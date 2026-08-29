-- ============================================================
-- BLOCO 3A — Costura: reserva do site → cliente + ensaio
--
-- Ao inserir um agendamento (reserva do site), o banco:
--   1. procura um cliente por E-MAIL ou TELEFONE (identificadores fortes
--      — nome sozinho NÃO casa, p/ não fundir homônimos);
--   2. se não achar, CRIA o cliente (origem 'site', etapa 'agendado');
--   3. lança um ENSAIO ligado a esse cliente, com origem 'site'
--      (a "tag agendamento pelo site");
--   4. grava no próprio agendamento qual cliente/ensaio ele virou.
--
-- Roda como SECURITY DEFINER: o visitante anônimo dispara, mas quem
-- escreve em clientes/ensaios é a função (com permissão), respeitando a RLS.
-- Depende de 03_clientes.sql e 04_ensaios.sql.
-- ============================================================

-- Colunas de rastreio
alter table public.ensaios       add column if not exists origem text not null default 'manual'; -- manual | site
alter table public.agendamentos  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
alter table public.agendamentos  add column if not exists ensaio_id  uuid references public.ensaios(id)  on delete set null;

create or replace function public.handle_new_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_ensaio_id  uuid;
  v_email      text := nullif(lower(trim(coalesce(new.email, ''))), '');
  v_tel        text := nullif(regexp_replace(coalesce(new.telefone, ''), '[^0-9]', '', 'g'), '');
  v_titulo     text;
begin
  -- 1) tenta achar cliente por email OU telefone
  select id into v_cliente_id
  from public.clientes
  where (v_email is not null and lower(trim(email)) = v_email)
     or (v_tel   is not null and nullif(regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g'), '') = v_tel)
  order by created_at asc
  limit 1;

  -- 2) não achou -> cria o cliente
  if v_cliente_id is null then
    insert into public.clientes (nome, email, telefone, funil_etapa, origem)
    values (new.nome, new.email, new.telefone, 'agendado', 'site')
    returning id into v_cliente_id;
  end if;

  -- 3) lança o ensaio ligado (tag origem 'site')
  v_titulo := coalesce(nullif(new.pacote_nome, ''), 'Ensaio')
              || case when coalesce(new.servico, '') <> '' then ' · ' || new.servico else '' end;

  insert into public.ensaios
    (cliente_id, titulo, tipo_ensaio, pacote_slug, valor, data, hora, status, origem, observacoes)
  values
    (v_cliente_id, v_titulo, new.servico, new.pacote_slug, coalesce(new.valor_total, 0),
     new.dia, new.hora, 'agendado', 'site',
     'Reserva feita pelo site em ' || to_char(new.created_at, 'DD/MM/YYYY HH24:MI'))
  returning id into v_ensaio_id;

  -- 4) liga a reserva ao que ela virou
  new.cliente_id := v_cliente_id;
  new.ensaio_id  := v_ensaio_id;
  return new;
end;
$$;

drop trigger if exists on_agendamento_created on public.agendamentos;
create trigger on_agendamento_created
  before insert on public.agendamentos
  for each row execute function public.handle_new_agendamento();
