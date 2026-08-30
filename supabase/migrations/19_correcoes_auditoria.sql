-- ============================================================
-- BLOCO 19 — Correções da auditoria (dinheiro + segurança)
--
-- Achados confirmados por verificação adversarial que esta migration corrige:
--   [1][3][7][13] finalizar_selecao sobrescrevia conta JÁ PAGA -> o trigger
--        sync_lancamento_conta apagava o lançamento e o dinheiro sumia do caixa.
--   [2][12] "Pagar agora" marcava a conta como PAGA e lançava receita SEM
--        nenhuma cobrança real (a Stone ainda não está integrada).
--   [15] galeria sem ensaio_id fazia finalizar_selecao CRIAR uma conta nova a
--        cada envio (recebível duplicado).
--   [19] reenviar_selecao não recalculava: fotos extras da 2ª rodada nunca
--        eram cobradas.
--   [14][16] conta a pagar quitada nunca virava lançamento de saída -> DRE e
--        lucro inflados.
--   [24] ensaio fechado com valor 0 (ou valor preenchido depois) nunca gerava
--        a conta a receber.
--   [8] anon ainda podia INSERIR em agendamentos e injetar receita falsa.
--   [10] galeria sem senha aceitava login com senha vazia.
--   [+] handle_new_user aceitava o role vindo do metadata do próprio usuário
--        (qualquer um podia se cadastrar como admin usando a anon key pública).
--
-- Idempotente. Depende de 08, 09, 11, 15, 17, 18.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1) SEGURANÇA
-- ════════════════════════════════════════════════════════════

-- [8] O site não marca mais horário (a página virou captação de lead), então
-- ninguém mais insere reservas pelo público. Enquanto o grant existia, um
-- visitante podia inserir agendamento com valor_reserva alto e o trigger
-- handle_new_agendamento criava cliente + ensaio + LANÇAMENTO DE ENTRADA:
-- dinheiro falso no caixa, sem autenticação nenhuma.
drop policy if exists agendamentos_insert_anon on public.agendamentos;
revoke insert on public.agendamentos from anon;

-- [+] Escalada de privilégio: o role vinha de raw_user_meta_data, que o
-- próprio usuário controla no signup. Com a anon key (pública, vai no bundle),
-- qualquer pessoa podia criar conta pedindo role admin e ler o CRM inteiro.
-- Agora TODO usuário novo nasce 'atendimento'; só o primeiro (bootstrap do
-- dono) é admin, e promover passa a ser ato manual de um admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  public.user_role;
  v_total int;
begin
  select count(*) into v_total from public.profiles;
  if v_total = 0 then
    v_role := 'admin';           -- bootstrap: o primeiro usuário é o dono
  else
    v_role := 'atendimento';     -- NUNCA confiar no metadata do usuário
  end if;

  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    v_role
  );
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════
-- 2) LANÇAMENTO DE SAÍDA PARA CONTA A PAGAR  [14][16]
-- ════════════════════════════════════════════════════════════
alter table public.lancamentos
  add column if not exists conta_pagar_id uuid references public.contas_pagar(id) on delete set null;

create unique index if not exists idx_lanc_conta_pagar
  on public.lancamentos (conta_pagar_id) where conta_pagar_id is not null;

create or replace function public.sync_lancamento_conta_pagar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pago' then
    insert into public.lancamentos (tipo, descricao, valor, categoria, conta_pagar_id, data)
    select 'saida', new.descricao, new.valor, coalesce(new.categoria, 'Despesa'), new.id,
           coalesce(new.pago_em::date, current_date)
     where not exists (select 1 from public.lancamentos where conta_pagar_id = new.id);
    -- valor/descrição editados depois refletem no caixa
    update public.lancamentos
       set valor = new.valor, descricao = new.descricao,
           categoria = coalesce(new.categoria, 'Despesa'),
           data = coalesce(new.pago_em::date, current_date)
     where conta_pagar_id = new.id;
  else
    delete from public.lancamentos where conta_pagar_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_conta_pagar_sync on public.contas_pagar;
create trigger on_conta_pagar_sync
  after insert or update on public.contas_pagar
  for each row execute function public.sync_lancamento_conta_pagar();

-- BACKFILL: contas a pagar que já estavam quitadas antes deste trigger
insert into public.lancamentos (tipo, descricao, valor, categoria, conta_pagar_id, data)
select 'saida', cp.descricao, cp.valor, coalesce(cp.categoria, 'Despesa'), cp.id,
       coalesce(cp.pago_em::date, current_date)
  from public.contas_pagar cp
 where cp.status = 'pago'
   and not exists (select 1 from public.lancamentos l where l.conta_pagar_id = cp.id);

-- ── conta a RECEBER paga que muda de valor deve refletir no caixa ──
create or replace function public.sync_lancamento_conta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pago' then
    insert into public.lancamentos (tipo, descricao, valor, categoria, cliente_id, conta_receber_id, data)
    select 'entrada', new.descricao, new.valor, 'Pacote', new.cliente_id, new.id,
           coalesce(new.pago_em::date, current_date)
     where not exists (select 1 from public.lancamentos where conta_receber_id = new.id);
    update public.lancamentos
       set valor = new.valor, descricao = new.descricao,
           data = coalesce(new.pago_em::date, current_date)
     where conta_receber_id = new.id;
  else
    delete from public.lancamentos where conta_receber_id = new.id;
  end if;
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════
-- 3) VALOR DO ENSAIO -> CONTA A RECEBER  [24]
-- ════════════════════════════════════════════════════════════
-- Antes, a conta só nascia no INSERT (17) ou na virada de status (17). Quem
-- fechava o ensaio com valor 0 e preenchia o preço depois nunca era cobrado.
create or replace function public.handle_ensaio_valor_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
  v_conta   public.contas_receber;
begin
  if new.valor is distinct from old.valor
     and coalesce(new.status, 'agendado') not in ('solicitado', 'orcamento')
     and coalesce(new.valor, 0) > 0 then

    select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
    v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));

    select * into v_conta from public.contas_receber
     where ensaio_id = new.id and status = 'pendente'
     order by created_at asc limit 1;

    if v_conta.id is not null then
      update public.contas_receber
         set valor = v_saldo,
             descricao = 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio')
       where id = v_conta.id;
    elsif v_saldo > 0
      and not exists (select 1 from public.contas_receber
                       where ensaio_id = new.id and status <> 'cancelado') then
      insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status)
      values (new.cliente_id, new.id,
              'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_saldo, 'pendente');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_ensaio_valor_change on public.ensaios;
create trigger on_ensaio_valor_change
  after update of valor on public.ensaios
  for each row execute function public.handle_ensaio_valor_change();

-- ════════════════════════════════════════════════════════════
-- 4) entrar_galeria v4 — recusa galeria sem senha  [10]
-- ════════════════════════════════════════════════════════════
create or replace function public.entrar_galeria(p_codigo text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal      public.galerias;
  v_token    uuid;
  v_fotos    jsonb;
  v_entregas jsonb;
begin
  select * into v_gal from public.galerias
   where lower(codigo) = lower(trim(coalesce(p_codigo, ''))) limit 1;

  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Código não encontrado.');
  end if;

  -- galeria sem senha definida NÃO abre com senha vazia (era porta escancarada:
  -- bastava acertar o código para ver as fotos do cliente)
  if coalesce(trim(v_gal.senha), '') = '' then
    return jsonb_build_object('ok', false, 'erro', 'Esta galeria ainda não foi liberada. Fale com o estúdio.');
  end if;
  if trim(coalesce(v_gal.senha, '')) <> trim(coalesce(p_senha, '')) then
    return jsonb_build_object('ok', false, 'erro', 'Senha incorreta.');
  end if;

  v_token := gen_random_uuid();
  update public.galerias set sessao_token = v_token where id = v_gal.id;

  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'selecionada', f.selecionada, 'observacao', f.observacao,
            'favorita_fotografo', f.favorita_fotografo
         ) order by f.ordem), '[]'::jsonb)
    into v_fotos
    from public.fotos f
   where f.galeria_id = v_gal.id and coalesce(f.tipo, 'selecao') = 'selecao';

  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'nome_arquivo', f.nome_arquivo
         ) order by f.ordem), '[]'::jsonb)
    into v_entregas
    from public.fotos f
   where f.galeria_id = v_gal.id and f.tipo = 'entrega';

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'galeria', jsonb_build_object(
      'id', v_gal.id, 'nome', v_gal.nome, 'status', v_gal.status,
      'fotos_inclusas', v_gal.fotos_inclusas, 'foto_extra', v_gal.foto_extra,
      'valor_total', v_gal.valor_total, 'reserva', v_gal.reserva,
      'mensagem_fotografo', v_gal.mensagem_fotografo,
      'pagamento_online', coalesce(v_gal.pagamento_online, false)
    ),
    'fotos', v_fotos,
    'entregas', v_entregas
  );
end;
$$;

-- ════════════════════════════════════════════════════════════
-- 5) recalcular_cobranca_galeria — a peça que faltava
-- ════════════════════════════════════════════════════════════
-- Uma função só, IDEMPOTENTE, usada por finalizar_selecao e por
-- reenviar_selecao [19]. Rodar duas vezes converge para o mesmo valor.
--
-- Regras que a auditoria mostrou faltar:
--   • NUNCA toca em conta com status 'pago'  [1][3][7][13]
--   • NUNCA sobrescreve o saldo com 0 (galeria criada de ensaio sem valor não
--     pode zerar a conta que veio do contrato)
--   • os EXTRAS viram conta PRÓPRIA da galeria, recalculada a cada envio —
--     por isso reenviar passa a cobrar as fotos novas  [19]
--   • sem ensaio_id não inventa conta nova a cada envio  [15]
create or replace function public.recalcular_cobranca_galeria(p_galeria_id uuid, p_vencimento date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal      public.galerias;
  v_conta    public.contas_receber;
  v_qtd_sel  int;
  v_extras   int;
  v_valor_ex numeric(10,2);
  v_saldo    numeric(10,2);
  v_venc     date := coalesce(p_vencimento, current_date);
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

  -- ── A) conta do SALDO (a do ensaio) ──
  if v_gal.ensaio_id is not null and v_saldo > 0 then
    select * into v_conta from public.contas_receber
     where ensaio_id = v_gal.ensaio_id and status = 'pendente'
     order by created_at asc limit 1;

    if v_conta.id is not null then
      update public.contas_receber
         set valor = v_saldo,
             descricao = 'Saldo do ensaio — ' || coalesce(v_gal.nome, 'galeria'),
             vencimento = v_venc,
             galeria_id = coalesce(galeria_id, v_gal.id)
       where id = v_conta.id;
    elsif not exists (select 1 from public.contas_receber
                       where ensaio_id = v_gal.ensaio_id and status <> 'cancelado') then
      insert into public.contas_receber (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status)
      values (v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
              'Saldo do ensaio — ' || coalesce(v_gal.nome, 'galeria'),
              v_saldo, v_venc, 'pendente');
    end if;
    -- se a conta do ensaio já está PAGA, não mexe: o dinheiro já entrou.
  end if;

  -- ── B) conta dos EXTRAS (própria da galeria, recalculável) ──
  select * into v_conta from public.contas_receber
   where galeria_id = v_gal.id and status = 'pendente'
     and descricao like 'Fotos extras%'
   order by created_at asc limit 1;

  if v_valor_ex > 0 then
    if v_conta.id is not null then
      update public.contas_receber
         set valor = v_valor_ex,
             descricao = 'Fotos extras (' || v_extras || ') — ' || coalesce(v_gal.nome, 'galeria'),
             vencimento = v_venc
       where id = v_conta.id;
    else
      insert into public.contas_receber (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status)
      values (v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
              'Fotos extras (' || v_extras || ') — ' || coalesce(v_gal.nome, 'galeria'),
              v_valor_ex, v_venc, 'pendente');
    end if;
  elsif v_conta.id is not null then
    -- cliente desmarcou fotos: a cobrança de extras some (só se ainda pendente)
    delete from public.contas_receber where id = v_conta.id;
  end if;

  return jsonb_build_object(
    'ok', true, 'selecionadas', v_qtd_sel, 'extras', v_extras,
    'valor_extra', v_valor_ex, 'saldo', v_saldo, 'total', v_saldo + v_valor_ex,
    'vencimento', v_venc
  );
end;
$$;

-- ════════════════════════════════════════════════════════════
-- 6) finalizar_selecao v4  [1][2][3][7][12][13][15]
-- ════════════════════════════════════════════════════════════
-- MUDANÇA DE COMPORTAMENTO IMPORTANTE: "pagar agora" NÃO marca mais a conta
-- como paga. A Stone ainda não está integrada — marcar como pago criava um
-- lançamento de receita sem nenhuma cobrança real, inflando o caixa. Agora a
-- escolha do cliente vira INTENÇÃO: a conta vence hoje e o estúdio manda o
-- link/PIX. Quando a Stone entrar, é exatamente aqui que ela pluga.
create or replace function public.finalizar_selecao(p_token uuid, p_pagar_agora boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal  public.galerias;
  v_calc jsonb;
  v_quer boolean;
  v_venc date;
begin
  select * into v_gal from public.galerias where sessao_token = p_token;
  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;

  v_quer := coalesce(p_pagar_agora, false) and coalesce(v_gal.pagamento_online, false);
  v_venc := case when v_quer then current_date
                 else public.mais_dias_uteis(current_date, 3) end;

  update public.galerias set status = 'enviado' where id = v_gal.id;

  v_calc := public.recalcular_cobranca_galeria(v_gal.id, v_venc);

  return v_calc
    || jsonb_build_object(
         'status', 'pendente',
         'pagamento_solicitado', v_quer,
         'pagamento_online', coalesce(v_gal.pagamento_online, false)
       );
end;
$$;

-- ════════════════════════════════════════════════════════════
-- 7) reenviar_selecao v2 — agora COBRA as fotos novas  [19]
-- ════════════════════════════════════════════════════════════
create or replace function public.reenviar_selecao(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal  public.galerias;
  v_calc jsonb;
begin
  select * into v_gal from public.galerias where sessao_token = p_token;
  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;

  update public.galerias set status = 'enviado' where id = v_gal.id;

  -- antes isto só mudava o status: as fotos extras da 2ª rodada nunca eram
  -- cobradas e o admin via o valor velho
  v_calc := public.recalcular_cobranca_galeria(v_gal.id, public.mais_dias_uteis(current_date, 3));

  return v_calc || jsonb_build_object('reenvio', true);
end;
$$;

grant execute on function public.entrar_galeria(text, text)               to anon, authenticated;
grant execute on function public.finalizar_selecao(uuid, boolean)         to anon, authenticated;
grant execute on function public.reenviar_selecao(uuid)                   to anon, authenticated;
grant execute on function public.recalcular_cobranca_galeria(uuid, date)  to authenticated;
