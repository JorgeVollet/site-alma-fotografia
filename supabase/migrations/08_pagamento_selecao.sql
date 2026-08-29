-- ============================================================
-- JORNADA 1 — Pagamento no envio da seleção (genérico / revendível)
--   • galerias guardam valor_total e reserva (p/ calcular o saldo)
--   • contas_receber = base do Financeiro (Bloco 7) — começa aqui
--   • RPC finalizar_selecao: cliente envia a seleção e escolhe
--     pagar agora OU em até 3 dias úteis → gera a conta a receber.
--
-- Depende de 03_clientes, 04_ensaios, 06_galerias, 07_cliente_galeria.
-- ============================================================

-- ── Valores na galeria (para o cálculo do saldo) ───────────
alter table public.galerias add column if not exists valor_total numeric(10,2) not null default 0; -- valor do pacote/ensaio
alter table public.galerias add column if not exists reserva     numeric(10,2) not null default 0; -- sinal já pago

-- ── Contas a receber (base do Financeiro) ──────────────────
create table if not exists public.contas_receber (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references public.clientes(id) on delete set null,
  ensaio_id   uuid references public.ensaios(id)  on delete set null,
  galeria_id  uuid references public.galerias(id) on delete set null,
  descricao   text not null,
  valor       numeric(10,2) not null default 0,
  vencimento  date,
  status      text not null default 'pendente',  -- pendente | pago
  forma       text,                              -- pix | cartao | dinheiro | ...
  pago_em     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_contas_receber_cliente on public.contas_receber (cliente_id);

grant select, insert, update, delete on public.contas_receber to authenticated;
alter table public.contas_receber enable row level security;
drop policy if exists contas_receber_all_auth on public.contas_receber;
create policy contas_receber_all_auth on public.contas_receber
  for all to authenticated using (true) with check (true);

-- ── Helper: soma N dias ÚTEIS (pula sáb/dom) ───────────────
create or replace function public.mais_dias_uteis(p_data date, p_n int)
returns date
language plpgsql
immutable
as $$
declare d date := p_data; restantes int := p_n;
begin
  while restantes > 0 loop
    d := d + 1;
    if extract(isodow from d) < 6 then   -- 1..5 = seg..sex
      restantes := restantes - 1;
    end if;
  end loop;
  return d;
end;
$$;

-- ── RPC: cliente finaliza a seleção + define o pagamento ───
-- Calcula saldo (valor_total - reserva) + fotos extras, marca a galeria
-- como 'enviado' e cria a conta a receber (paga agora, ou vencendo em 3
-- dias úteis). Roda como SECURITY DEFINER (cliente é anônimo).
create or replace function public.finalizar_selecao(p_token uuid, p_pagar_agora boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal        public.galerias;
  v_qtd_sel    int;
  v_extras     int;
  v_valor_ex   numeric(10,2);
  v_saldo      numeric(10,2);
  v_total      numeric(10,2);
  v_venc       date;
  v_status     text;
begin
  select * into v_gal from public.galerias where sessao_token = p_token;
  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;

  select count(*) into v_qtd_sel from public.fotos where galeria_id = v_gal.id and selecionada;
  v_extras   := greatest(0, v_qtd_sel - coalesce(v_gal.fotos_inclusas, 0));
  v_valor_ex := v_extras * coalesce(v_gal.foto_extra, 0);
  v_saldo    := greatest(0, coalesce(v_gal.valor_total, 0) - coalesce(v_gal.reserva, 0));
  v_total    := v_saldo + v_valor_ex;

  if p_pagar_agora then
    v_venc := current_date;
    v_status := 'pago';
  else
    v_venc := public.mais_dias_uteis(current_date, 3);
    v_status := 'pendente';
  end if;

  update public.galerias set status = 'enviado' where id = v_gal.id;

  insert into public.contas_receber (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status, pago_em)
  values (
    v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
    'Saldo do ensaio + ' || v_extras || ' foto(s) extra — ' || coalesce(v_gal.nome, 'galeria'),
    v_total, v_venc, v_status,
    case when p_pagar_agora then now() else null end
  );

  return jsonb_build_object(
    'ok', true,
    'selecionadas', v_qtd_sel,
    'extras', v_extras,
    'valor_extra', v_valor_ex,
    'saldo', v_saldo,
    'total', v_total,
    'vencimento', v_venc,
    'status', v_status
  );
end;
$$;

grant execute on function public.mais_dias_uteis(date, int)        to anon, authenticated;
grant execute on function public.finalizar_selecao(uuid, boolean)  to anon, authenticated;

-- ── entrar_galeria: agora também devolve valor_total e reserva ──
-- (para o cliente ver o saldo a pagar antes de finalizar)
create or replace function public.entrar_galeria(p_codigo text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal   public.galerias;
  v_token uuid;
  v_fotos jsonb;
begin
  select * into v_gal from public.galerias
   where lower(codigo) = lower(trim(coalesce(p_codigo, ''))) limit 1;

  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Código não encontrado.');
  end if;
  if coalesce(v_gal.senha, '') <> coalesce(p_senha, '') then
    return jsonb_build_object('ok', false, 'erro', 'Senha incorreta.');
  end if;

  v_token := gen_random_uuid();
  update public.galerias set sessao_token = v_token where id = v_gal.id;

  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'selecionada', f.selecionada, 'observacao', f.observacao
         ) order by f.ordem), '[]'::jsonb)
    into v_fotos
    from public.fotos f where f.galeria_id = v_gal.id;

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'galeria', jsonb_build_object(
      'id', v_gal.id, 'nome', v_gal.nome, 'status', v_gal.status,
      'fotos_inclusas', v_gal.fotos_inclusas, 'foto_extra', v_gal.foto_extra,
      'valor_total', v_gal.valor_total, 'reserva', v_gal.reserva
    ),
    'fotos', v_fotos
  );
end;
$$;
