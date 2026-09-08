-- ============================================================
-- BLOCO 23 — Segurança: força bruta e spam nas portas públicas
--
-- O sistema tem DUAS portas abertas para quem não está logado:
--   • entrar_galeria(codigo, senha) — dá acesso às FOTOS do cliente
--   • solicitar_contato(...)        — cria cliente e ensaio
--
-- Nenhuma das duas tinha limite de tentativas. A senha da galeria é de 4
-- dígitos: 10.000 combinações, que um script testa em minutos. Do outro lado
-- dessa porta há fotos de bebês e crianças — o risco não é teórico.
--
-- Idempotente. Depende de 06 (galerias) e 18 (solicitar_contato).
-- ============================================================

-- ── 1) Bloqueio por tentativas na galeria ───────────────────
alter table public.galerias add column if not exists tentativas_falhas int not null default 0;
alter table public.galerias add column if not exists bloqueada_ate timestamptz;

-- ── 2) Limite genérico para as portas públicas ──────────────
-- Guarda um contador por chave numa janela de tempo. Serve para qualquer RPC
-- pública; hoje é usado pelo formulário de contato.
create table if not exists public.limite_uso (
  chave       text primary key,
  contador    int not null default 0,
  janela_ate  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_limite_janela on public.limite_uso (janela_ate);

-- Devolve TRUE se ainda pode passar; FALSE se estourou o limite.
create or replace function public.checar_limite(p_chave text, p_max int, p_minutos int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_reg public.limite_uso;
begin
  delete from public.limite_uso where janela_ate < now() - interval '1 day';  -- faxina

  select * into v_reg from public.limite_uso where chave = p_chave;

  if v_reg.chave is null or v_reg.janela_ate < now() then
    insert into public.limite_uso (chave, contador, janela_ate)
    values (p_chave, 1, now() + (p_minutos || ' minutes')::interval)
    on conflict (chave) do update
      set contador = 1, janela_ate = now() + (p_minutos || ' minutes')::interval;
    return true;
  end if;

  if v_reg.contador >= p_max then return false; end if;

  update public.limite_uso set contador = contador + 1 where chave = p_chave;
  return true;
end;
$$;

-- Identifica quem está chamando: IP do proxy quando existir, senão a chave dada.
create or replace function public.origem_chamada(p_fallback text default 'anon')
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_ip text;
begin
  begin
    v_ip := split_part(
      coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  exception when others then
    v_ip := null;
  end;
  return coalesce(nullif(trim(v_ip), ''), p_fallback);
end;
$$;

-- ── 3) entrar_galeria v5 — com trava de força bruta ─────────
-- Depois de 5 erros a galeria fecha por 15 minutos. Acertar zera o contador.
-- A mensagem NÃO diz se o código existe ou se a senha é que está errada — isso
-- entregaria de graça metade do trabalho a quem tenta adivinhar.
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
  v_generico text := 'Código ou senha incorretos.';
begin
  select * into v_gal from public.galerias
   where lower(codigo) = lower(trim(coalesce(p_codigo, ''))) limit 1;

  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', v_generico);
  end if;

  -- porta trancada por tentativas demais
  if v_gal.bloqueada_ate is not null and v_gal.bloqueada_ate > now() then
    return jsonb_build_object(
      'ok', false,
      'erro', 'Muitas tentativas. Aguarde alguns minutos e tente de novo, ou fale com o estúdio.',
      'bloqueada', true);
  end if;

  -- galeria sem senha definida não abre (era porta escancarada)
  if coalesce(trim(v_gal.senha), '') = '' then
    return jsonb_build_object('ok', false, 'erro', 'Esta galeria ainda não foi liberada. Fale com o estúdio.');
  end if;

  if trim(coalesce(v_gal.senha, '')) <> trim(coalesce(p_senha, '')) then
    update public.galerias
       set tentativas_falhas = coalesce(tentativas_falhas, 0) + 1,
           bloqueada_ate = case when coalesce(tentativas_falhas, 0) + 1 >= 5
                                then now() + interval '15 minutes' else bloqueada_ate end
     where id = v_gal.id;
    return jsonb_build_object('ok', false, 'erro', v_generico);
  end if;

  -- acertou: zera a trava e abre
  update public.galerias
     set tentativas_falhas = 0, bloqueada_ate = null, sessao_token = gen_random_uuid()
   where id = v_gal.id
   returning sessao_token into v_token;

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

-- ── 4) solicitar_contato: limite de envios e honeypot ───────
-- Sem trava, um bot criava cliente + ensaio a cada requisição, entupindo o CRM.
-- p_website é um campo ISCA: fica escondido no formulário, gente não preenche,
-- robô preenche. Se vier preenchido, respondemos "ok" e não gravamos nada —
-- o bot não descobre que foi barrado.
drop function if exists public.solicitar_contato(text, text, text, text, text, text);

create or replace function public.solicitar_contato(
  p_nome         text,
  p_email        text,
  p_telefone     text,
  p_servico      text default null,
  p_servico_nome text default null,
  p_mensagem     text default null,
  p_website      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_ensaio_id  uuid;
  v_novo       boolean := false;
  v_repetido   boolean := false;
  v_nome       text := nullif(trim(coalesce(p_nome, '')), '');
  v_email      text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_tel        text := nullif(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g'), '');
  v_label      text := coalesce(nullif(trim(coalesce(p_servico_nome, '')), ''),
                                nullif(trim(coalesce(p_servico, '')), ''), 'Ensaio');
  v_msg        text := nullif(trim(coalesce(p_mensagem, '')), '');
begin
  -- isca preenchida = robô. Finge que deu certo e sai.
  if coalesce(trim(p_website), '') <> '' then
    return jsonb_build_object('ok', true, 'ignorado', true);
  end if;

  -- no máximo 5 envios a cada 10 minutos por origem
  if not public.checar_limite('contato:' || public.origem_chamada(coalesce(v_tel, v_email, 'x')), 5, 10) then
    return jsonb_build_object('ok', false,
      'erro', 'Recebemos vários envios agora há pouco. Aguarde alguns minutos ou fale direto no WhatsApp.');
  end if;

  if v_nome is null then
    return jsonb_build_object('ok', false, 'erro', 'Informe o seu nome.');
  end if;
  if v_email is null and v_tel is null then
    return jsonb_build_object('ok', false, 'erro', 'Informe e-mail ou telefone.');
  end if;
  if length(v_nome) > 150 or length(coalesce(v_msg, '')) > 2000 then
    return jsonb_build_object('ok', false, 'erro', 'Texto longo demais.');
  end if;

  select id into v_cliente_id
    from public.clientes
   where (v_email is not null and lower(trim(email)) = v_email)
      or (v_tel is not null and nullif(regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g'), '') = v_tel)
   order by created_at asc limit 1;

  if v_cliente_id is null then
    insert into public.clientes (nome, email, telefone, funil_etapa, origem, interesse, primeiro_contato, notas)
    values (v_nome, p_email, p_telefone, 'lead', 'site', v_label, current_date, v_msg)
    returning id into v_cliente_id;
    v_novo := true;
  end if;

  select id into v_ensaio_id
    from public.ensaios
   where cliente_id = v_cliente_id and status = 'solicitado' and origem = 'site'
     and coalesce(tipo_ensaio, '') = coalesce(p_servico, '')
   order by created_at desc limit 1;

  if v_ensaio_id is null then
    insert into public.ensaios (cliente_id, titulo, tipo_ensaio, valor, status, origem, observacoes)
    values (v_cliente_id, v_label || ' · solicitação pelo site', p_servico, 0, 'solicitado', 'site', v_msg)
    returning id into v_ensaio_id;
  else
    v_repetido := true;
    update public.ensaios
       set observacoes = trim(both e'\n' from coalesce(observacoes || e'\n', '') || coalesce(v_msg, '')),
           updated_at = now()
     where id = v_ensaio_id and v_msg is not null;
  end if;

  insert into public.cliente_atualizacoes (cliente_id, texto)
  values (v_cliente_id,
          case when v_repetido then 'Pediu contato pelo site de novo' else 'Pediu contato pelo site' end
          || ' · ' || v_label
          || case when v_msg is not null then ' — "' || left(v_msg, 300) || '"' else '' end);

  return jsonb_build_object('ok', true, 'cliente_id', v_cliente_id,
                            'ensaio_id', v_ensaio_id, 'novo_cliente', v_novo, 'repetido', v_repetido);
end;
$$;

-- limite_uso é bastidor: ninguém lê nem escreve direto, só as funções acima
revoke all on public.limite_uso from anon, authenticated;
alter table public.limite_uso enable row level security;

grant execute on function public.entrar_galeria(text, text) to anon, authenticated;
grant execute on function public.solicitar_contato(text, text, text, text, text, text, text) to anon, authenticated;
revoke execute on function public.checar_limite(text, int, int) from anon, authenticated;
