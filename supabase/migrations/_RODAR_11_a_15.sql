-- ████████████████████████████████████████████████████████████
-- COMBINADO — rode 11 → 12 → 13 → 14 → 15 de uma vez (idempotente).
-- Pode rodar quantas vezes quiser: nada duplica nem dá erro.
-- (Atalho de conveniência. As migrations "oficiais" seguem nos arquivos
--  numerados; este só junta as 5 pendentes pra colar uma vez no SQL Editor.)
-- ████████████████████████████████████████████████████████████


-- ╔══════════════════════════════════════════════════════════╗
-- ║ 11 — CONTRATOS                                           ║
-- ╚══════════════════════════════════════════════════════════╝

insert into storage.buckets (id, name, public)
values ('contratos', 'contratos', false)
on conflict (id) do nothing;

drop policy if exists contratos_rw_auth on storage.objects;
create policy contratos_rw_auth on storage.objects
  for all to authenticated
  using (bucket_id = 'contratos')
  with check (bucket_id = 'contratos');

create table if not exists public.contratos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid references public.clientes(id) on delete set null,
  ensaio_id    uuid references public.ensaios(id)  on delete set null,
  titulo       text not null default 'Contrato',
  modelo       text,
  ensaio_desc  text,
  valor        numeric(10,2) not null default 0,
  clausulas    jsonb not null default '[]'::jsonb,
  pdf_path     text,
  pdf_nome     text,
  status       text not null default 'rascunho',
  assinatura   text,
  token        uuid not null default gen_random_uuid(),
  enviado_em   timestamptz,
  assinado_em  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_contratos_cliente on public.contratos (cliente_id);
create unique index if not exists idx_contratos_token on public.contratos (token);

grant select, insert, update, delete on public.contratos to authenticated;
alter table public.contratos enable row level security;
drop policy if exists contratos_all_auth on public.contratos;
create policy contratos_all_auth on public.contratos
  for all to authenticated using (true) with check (true);

alter table public.contas_receber
  add column if not exists contrato_id uuid references public.contratos(id) on delete set null;

create or replace function public.handle_contrato_assinado()
returns trigger language plpgsql security definer set search_path = public as $$
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
        (cliente_id, ensaio_id, contrato_id, descricao, valor, vencimento, status)
      values
        (new.cliente_id, new.ensaio_id, new.id,
         'Contrato — ' || coalesce(new.titulo, 'serviço'),
         new.valor, current_date + 30, 'pendente');
    end if;
  else
    delete from public.contas_receber where contrato_id = new.id and status = 'pendente';
  end if;
  return new;
end;
$$;

drop trigger if exists on_contrato_assinado on public.contratos;
create trigger on_contrato_assinado
  after insert or update on public.contratos
  for each row execute function public.handle_contrato_assinado();

create or replace function public.handle_contrato_excluido()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.contas_receber where contrato_id = old.id and status = 'pendente';
  return old;
end;
$$;

drop trigger if exists on_contrato_excluido on public.contratos;
create trigger on_contrato_excluido
  before delete on public.contratos
  for each row execute function public.handle_contrato_excluido();

create or replace function public.carregar_contrato(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_c    public.contratos;
  v_nome text;
begin
  select * into v_c from public.contratos where token = p_token;
  if v_c.id is null or v_c.status = 'cancelado' then
    return jsonb_build_object('ok', false, 'erro', 'Contrato não encontrado.');
  end if;
  select nome into v_nome from public.clientes where id = v_c.cliente_id;
  return jsonb_build_object(
    'ok', true,
    'contrato', jsonb_build_object(
      'id', v_c.id, 'titulo', v_c.titulo, 'modelo', v_c.modelo, 'valor', v_c.valor,
      'clausulas', v_c.clausulas, 'ensaio', v_c.ensaio_desc, 'status', v_c.status,
      'clienteNome', coalesce(v_nome, ''), 'criado', v_c.created_at, 'pdfNome', v_c.pdf_nome
    )
  );
end;
$$;

create or replace function public.assinar_contrato(p_token uuid, p_assinatura text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_c public.contratos;
begin
  select * into v_c from public.contratos where token = p_token;
  if v_c.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Contrato não encontrado.');
  end if;
  if v_c.status = 'assinado' then
    return jsonb_build_object('ok', true, 'jaAssinado', true);
  end if;
  if v_c.status <> 'enviado' then
    return jsonb_build_object('ok', false, 'erro', 'Este contrato não está disponível para assinatura.');
  end if;
  if p_assinatura is null or length(p_assinatura) > 300000 then
    return jsonb_build_object('ok', false, 'erro', 'Assinatura inválida.');
  end if;
  update public.contratos
     set status = 'assinado', assinatura = p_assinatura, assinado_em = now()
   where id = v_c.id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.carregar_contrato(uuid)      to anon, authenticated;
grant execute on function public.assinar_contrato(uuid, text) to anon, authenticated;


-- ╔══════════════════════════════════════════════════════════╗
-- ║ 12 — NOTAS FISCAIS (base)                                ║
-- ╚══════════════════════════════════════════════════════════╝

create table if not exists public.notas_fiscais (
  id               uuid primary key default gen_random_uuid(),
  conta_receber_id uuid references public.contas_receber(id) on delete set null,
  cliente_id       uuid references public.clientes(id)       on delete set null,
  numero           text,
  tipo             text not null default 'nfse',
  descricao        text not null default '',
  valor            numeric(10,2) not null default 0,
  cpf_cnpj         text,
  status           text not null default 'pendente',
  emitida_em       timestamptz,
  pdf_url          text,
  xml_url          text,
  motivo_erro      text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_notas_status on public.notas_fiscais (status);
create index if not exists idx_notas_conta  on public.notas_fiscais (conta_receber_id);
create unique index if not exists idx_notas_conta_unica
  on public.notas_fiscais (conta_receber_id)
  where conta_receber_id is not null and status <> 'cancelada';

grant select, insert, update, delete on public.notas_fiscais to authenticated;
alter table public.notas_fiscais enable row level security;
drop policy if exists notas_all_auth on public.notas_fiscais;
create policy notas_all_auth on public.notas_fiscais
  for all to authenticated using (true) with check (true);


-- ╔══════════════════════════════════════════════════════════╗
-- ║ 13 — SELEÇÃO TURBINADA (nome_arquivo, favorita, recado)  ║
-- ╚══════════════════════════════════════════════════════════╝

alter table public.fotos    add column if not exists nome_arquivo       text;
alter table public.fotos    add column if not exists favorita_fotografo boolean not null default false;
alter table public.galerias add column if not exists mensagem_fotografo text;

-- (entrar_galeria do 13 é redefinida logo abaixo no 15 — fica a versão final)


-- ╔══════════════════════════════════════════════════════════╗
-- ║ 14 — NOTAS FATURÁVEIS (vínculo ao lançamento)            ║
-- ╚══════════════════════════════════════════════════════════╝

alter table public.notas_fiscais
  add column if not exists lancamento_id uuid references public.lancamentos(id) on delete set null;
create index if not exists idx_notas_lancamento on public.notas_fiscais (lancamento_id);
create unique index if not exists idx_notas_lancamento_unica
  on public.notas_fiscais (lancamento_id)
  where lancamento_id is not null and status <> 'cancelada';


-- ╔══════════════════════════════════════════════════════════╗
-- ║ 15 — GALERIAS v2 (seleção + entrega + recorrência)       ║
-- ╚══════════════════════════════════════════════════════════╝

alter table public.fotos add column if not exists tipo text not null default 'selecao';
create index if not exists idx_fotos_tipo on public.fotos (galeria_id, tipo);

insert into storage.buckets (id, name, public)
values ('entregas', 'entregas', true)
on conflict (id) do nothing;

drop policy if exists entregas_write_team on storage.objects;
create policy entregas_write_team
  on storage.objects for all
  to authenticated
  using (bucket_id = 'entregas')
  with check (bucket_id = 'entregas');

create or replace function public.entrar_galeria(p_codigo text, p_senha text)
returns jsonb language plpgsql security definer set search_path = public as $$
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
  if coalesce(v_gal.senha, '') <> coalesce(p_senha, '') then
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
      'mensagem_fotografo', v_gal.mensagem_fotografo
    ),
    'fotos', v_fotos,
    'entregas', v_entregas
  );
end;
$$;

create or replace function public.reenviar_selecao(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_gal_id uuid;
begin
  select id into v_gal_id from public.galerias where sessao_token = p_token;
  if v_gal_id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;
  update public.galerias set status = 'enviado' where id = v_gal_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.entrar_galeria(text, text) to anon, authenticated;
grant execute on function public.reenviar_selecao(uuid)     to anon, authenticated;

-- ████████████████████████████████████████████████████████████
-- FIM. Confira em Storage os buckets 'contratos' (privado) e 'entregas' (público).
-- ████████████████████████████████████████████████████████████
