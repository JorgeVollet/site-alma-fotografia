-- ============================================================
-- BLOCO 20 — Corrige a REGRESSÃO introduzida pela migration 19
--
-- O QUE EU ERREI NA 19: separei a cobrança em duas contas (saldo do ensaio e
-- fotos extras) mas deixei as DUAS com o mesmo `ensaio_id`. O bloco que procura
-- "a conta do saldo" (`where ensaio_id = X and status = 'pendente'`) podia pegar
-- a conta de EXTRAS, reescrevê-la como "Saldo do ensaio" e, logo em seguida,
-- criar outra conta de extras. Efeitos confirmados:
--   • cliente cobrado DUAS VEZES pelo saldo;
--   • saldo fantasma inflando o "A receber" mesmo depois de pago;
--   • ao reenviar a seleção, extras JÁ PAGOS eram cobrados de novo por inteiro;
--   • handle_ensaio_valor_change tinha o mesmo defeito (editar o valor do
--     ensaio destruía a cobrança das fotos extras).
--   • pior: contas criadas na MESMA transação empatam no created_at, então o
--     `order by created_at limit 1` era não-determinístico — dava para acontecer
--     sem ninguém ter pago nada.
--
-- A CORREÇÃO: uma coluna `origem` diz o que cada conta é ('saldo' | 'extras' |
-- 'contrato'). Some a ambiguidade. E o valor passa a ser calculado por
-- DIFERENÇA (devido − já pago), o que torna tudo idempotente de verdade:
-- reenviar a seleção cobra só o que falta, nunca o total de novo.
--
-- Depende de 19. Idempotente.
-- ============================================================

-- ── 1) A coluna que faltava ──────────────────────────────────
alter table public.contas_receber
  add column if not exists origem text not null default 'saldo';

-- classifica o que já existe no banco
update public.contas_receber
   set origem = 'extras'
 where descricao like 'Fotos extras%' and origem is distinct from 'extras';

update public.contas_receber
   set origem = 'contrato'
 where contrato_id is not null
   and galeria_id is null
   and descricao like 'Contrato%'
   and origem is distinct from 'contrato';

create index if not exists idx_contas_origem on public.contas_receber (origem, status);

-- No máximo UMA conta pendente de extras por galeria (as pagas ficam no
-- histórico). Best-effort: se o banco já tiver duplicatas, o índice não é
-- criado e a limpeza fica para a AUDITORIA-DADOS.sql — a migration não quebra.
do $$
begin
  create unique index idx_conta_extras_pendente
    on public.contas_receber (galeria_id)
    where origem = 'extras' and status = 'pendente' and galeria_id is not null;
exception
  when duplicate_table then null;
  when others then
    raise notice 'indice de extras nao criado (ha duplicatas pendentes) — rode supabase/AUDITORIA-DADOS.sql';
end $$;

-- ── 2) recalcular_cobranca_galeria v2 ────────────────────────
-- Cobra por DIFERENÇA: devido − já pago. Rodar dez vezes dá o mesmo resultado.
create or replace function public.recalcular_cobranca_galeria(p_galeria_id uuid, p_vencimento date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal         public.galerias;
  v_conta       public.contas_receber;
  v_qtd_sel     int;
  v_extras      int;
  v_valor_ex    numeric(10,2);
  v_saldo       numeric(10,2);
  v_pago_saldo  numeric(10,2);
  v_pago_extras numeric(10,2);
  v_falta_saldo numeric(10,2);
  v_falta_ex    numeric(10,2);
  v_venc        date := coalesce(p_vencimento, current_date);
begin
  select * into v_gal from public.galerias where id = p_galeria_id;
  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Galeria não encontrada.');
  end if;

  select count(*) into v_qtd_sel from public.fotos
   where galeria_id = v_gal.id and selecionada and coalesce(tipo, 'selecao') = 'selecao';

  v_extras   := greatest(0, v_qtd_sel - coalesce(v_gal.fotos_inclusas, 0));
  v_valor_ex := v_extras * coalesce(v_gal.foto_extra, 0);
  v_saldo    := greatest(0, coalesce(v_gal.valor_total, 0) - coalesce(v_gal.reserva, 0));

  -- quanto o cliente JÁ pagou de cada coisa
  select coalesce(sum(valor), 0) into v_pago_saldo
    from public.contas_receber
   where origem = 'saldo' and status = 'pago'
     and (galeria_id = v_gal.id
          or (v_gal.ensaio_id is not null and ensaio_id = v_gal.ensaio_id));

  select coalesce(sum(valor), 0) into v_pago_extras
    from public.contas_receber
   where origem = 'extras' and status = 'pago' and galeria_id = v_gal.id;

  v_falta_saldo := greatest(0, v_saldo - v_pago_saldo);
  v_falta_ex    := greatest(0, v_valor_ex - v_pago_extras);

  -- ── A) SALDO ──
  -- Só mexe quando a galeria SABE o preço. Com valor_total 0 (ensaio criado a
  -- partir de lead do site), a conta que existe veio do contrato e é a fonte da
  -- verdade — mexer nela apagaria a cobrança real.
  if coalesce(v_gal.valor_total, 0) > 0 then
    select * into v_conta from public.contas_receber
     where origem = 'saldo' and status = 'pendente'
       and (galeria_id = v_gal.id
            or (v_gal.ensaio_id is not null and ensaio_id = v_gal.ensaio_id))
     order by created_at asc, id asc
     limit 1;

    if v_falta_saldo > 0 then
      if v_conta.id is not null then
        update public.contas_receber
           set valor = v_falta_saldo,
               descricao = 'Saldo do ensaio — ' || coalesce(v_gal.nome, 'galeria'),
               vencimento = v_venc,
               galeria_id = coalesce(galeria_id, v_gal.id),
               ensaio_id  = coalesce(ensaio_id, v_gal.ensaio_id),
               contrato_id = null   -- a linha virou saldo do ensaio; excluir o
                                    -- contrato não pode mais levá-la junto
         where id = v_conta.id;
      else
        insert into public.contas_receber
          (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status, origem)
        values (v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
                'Saldo do ensaio — ' || coalesce(v_gal.nome, 'galeria'),
                v_falta_saldo, v_venc, 'pendente', 'saldo');
      end if;
    elsif v_conta.id is not null then
      -- saldo já quitado: a pendência some (o pago fica no histórico)
      delete from public.contas_receber where id = v_conta.id;
    end if;
  end if;

  -- ── B) FOTOS EXTRAS ──
  select * into v_conta from public.contas_receber
   where origem = 'extras' and status = 'pendente' and galeria_id = v_gal.id
   order by created_at asc, id asc
   limit 1;

  if v_falta_ex > 0 then
    if v_conta.id is not null then
      update public.contas_receber
         set valor = v_falta_ex,
             descricao = 'Fotos extras (' || v_extras || ') — ' || coalesce(v_gal.nome, 'galeria'),
             vencimento = v_venc
       where id = v_conta.id;
    else
      insert into public.contas_receber
        (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status, origem)
      values (v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
              'Fotos extras (' || v_extras || ') — ' || coalesce(v_gal.nome, 'galeria'),
              v_falta_ex, v_venc, 'pendente', 'extras');
    end if;
  elsif v_conta.id is not null then
    -- cliente desmarcou fotos (ou já pagou tudo): a pendência some
    delete from public.contas_receber where id = v_conta.id;
  end if;

  return jsonb_build_object(
    'ok', true, 'selecionadas', v_qtd_sel, 'extras', v_extras,
    'valor_extra', v_valor_ex, 'saldo', v_saldo,
    'pago_saldo', v_pago_saldo, 'pago_extras', v_pago_extras,
    'total', v_falta_saldo + v_falta_ex,
    'vencimento', v_venc
  );
end;
$$;

-- ── 3) handle_ensaio_valor_change: mesma correção ────────────
-- Tinha o defeito idêntico: pegava a conta de extras e a transformava em saldo.
create or replace function public.handle_ensaio_valor_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
  v_pago    numeric(10,2);
  v_falta   numeric(10,2);
  v_conta   public.contas_receber;
begin
  if new.valor is distinct from old.valor
     and coalesce(new.status, 'agendado') not in ('solicitado', 'orcamento')
     and coalesce(new.valor, 0) > 0 then

    select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
    v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));

    select coalesce(sum(valor), 0) into v_pago
      from public.contas_receber
     where ensaio_id = new.id and origem = 'saldo' and status = 'pago';
    v_falta := greatest(0, v_saldo - v_pago);

    select * into v_conta from public.contas_receber
     where ensaio_id = new.id and origem = 'saldo' and status = 'pendente'
     order by created_at asc, id asc
     limit 1;

    if v_falta > 0 then
      if v_conta.id is not null then
        update public.contas_receber
           set valor = v_falta,
               descricao = 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio')
         where id = v_conta.id;
      else
        insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status, origem)
        values (new.cliente_id, new.id,
                'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_falta, 'pendente', 'saldo');
      end if;
    elsif v_conta.id is not null then
      delete from public.contas_receber where id = v_conta.id;
    end if;
  end if;
  return new;
end;
$$;

-- ── 4) handle_new_ensaio e status_change: marcam origem ──────
create or replace function public.handle_new_ensaio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
  v_aberto  boolean := coalesce(new.status, 'agendado') in ('solicitado', 'orcamento');
begin
  if not v_aberto then
    select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
    v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));
    if v_saldo > 0 then
      insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status, origem)
      values (new.cliente_id, new.id, 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'),
              v_saldo, 'pendente', 'saldo');
    end if;
  end if;

  if new.cliente_id is not null then
    if coalesce(new.status, 'agendado') = 'solicitado' then
      null;
    elsif new.status = 'orcamento' then
      update public.clientes set funil_etapa = 'orcamento'
       where id = new.cliente_id and coalesce(funil_etapa, 'lead') in ('lead');
    else
      update public.clientes set funil_etapa = 'agendado'
       where id = new.cliente_id and coalesce(funil_etapa, 'lead') in ('lead', 'orcamento');
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.handle_ensaio_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
begin
  if coalesce(old.status, '') in ('solicitado', 'orcamento')
     and coalesce(new.status, '') not in ('solicitado', 'orcamento') then

    if not exists (select 1 from public.contas_receber
                    where ensaio_id = new.id and status <> 'cancelado') then
      select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
      v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));
      if v_saldo > 0 then
        insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status, origem)
        values (new.cliente_id, new.id,
                'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_saldo, 'pendente', 'saldo');
      end if;
    end if;

    if new.cliente_id is not null then
      update public.clientes set funil_etapa = 'agendado'
       where id = new.cliente_id and coalesce(funil_etapa, 'lead') in ('lead', 'orcamento');
    end if;
  end if;
  return new;
end;
$$;

-- ── 5) Contrato: parar de levar junto a conta que virou saldo ─
-- Achado [2]: quando a seleção é finalizada, a conta do contrato é ADOTADA como
-- saldo do ensaio (ganha galeria_id e nova descrição). Excluir o contrato depois
-- apagava essa linha — o ensaio ficava sem cobrança nenhuma e ninguém percebia.
-- Agora só apaga a conta que AINDA é do contrato (não adotada).
create or replace function public.handle_contrato_excluido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.contas_receber
   where contrato_id = old.id
     and status = 'pendente'
     and galeria_id is null
     and coalesce(origem, 'saldo') <> 'extras';
  return old;
end;
$$;

create or replace function public.handle_contrato_assinado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etapa_atual      text;
  v_tem_conta_ensaio boolean := false;
begin
  if new.status = 'assinado' then
    if new.cliente_id is not null then
      select funil_etapa into v_etapa_atual from public.clientes where id = new.cliente_id;
      if v_etapa_atual is null or v_etapa_atual in ('lead', 'orcamento') then
        update public.clientes set funil_etapa = 'agendado' where id = new.cliente_id;
      end if;
    end if;

    if new.ensaio_id is not null then
      select exists(
        select 1 from public.contas_receber
        where ensaio_id = new.ensaio_id and status <> 'cancelado'
      ) into v_tem_conta_ensaio;
    end if;

    if coalesce(new.valor, 0) > 0
       and not v_tem_conta_ensaio
       and not exists (select 1 from public.contas_receber where contrato_id = new.id) then
      insert into public.contas_receber
        (cliente_id, ensaio_id, contrato_id, descricao, valor, vencimento, status, origem)
      values
        (new.cliente_id, new.ensaio_id, new.id,
         'Contrato — ' || coalesce(new.titulo, 'serviço'),
         new.valor, current_date + 30, 'pendente', 'contrato');
    end if;
  else
    -- desfez a assinatura: solta a linha já adotada e apaga só a do contrato
    update public.contas_receber set contrato_id = null
     where contrato_id = new.id and galeria_id is not null;
    delete from public.contas_receber
     where contrato_id = new.id and status = 'pendente' and galeria_id is null;
  end if;
  return new;
end;
$$;

-- ── 6) Excluir ensaio não deixa mais recebível fantasma  [15] ─
-- A FK é `on delete set null`: apagar o ensaio deixava a conta viva, sem vínculo
-- e sem como ser removida pelo painel, inflando o "A receber" para sempre.
-- Cancela (não apaga) para preservar o histórico do que já foi pago.
create or replace function public.handle_ensaio_excluido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contas_receber
     set status = 'cancelado'
   where ensaio_id = old.id and status = 'pendente';
  return old;
end;
$$;

drop trigger if exists on_ensaio_excluido on public.ensaios;
create trigger on_ensaio_excluido
  before delete on public.ensaios
  for each row execute function public.handle_ensaio_excluido();

grant execute on function public.recalcular_cobranca_galeria(uuid, date) to authenticated;
