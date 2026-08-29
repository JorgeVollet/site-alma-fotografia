-- ============================================================
-- SEED — Catálogo da ALMA (ESPECÍFICO DA INSTÂNCIA — não vai pra FONTE)
--
-- Valores atuais derivados do site (provisórios). O Maurício ainda vai
-- confirmar os definitivos (ver docs/backend/perguntas-mauricio-dados-reais.md).
-- Depois disso, edita-se direto no admin — este seed é só o ponto de partida
-- para o site público não nascer vazio.
--
-- Idempotente: on conflict (slug) atualiza. Rode após 02_catalogo.sql.
-- ============================================================

insert into public.pacotes
  (slug, nome, ideal, preco, reserva, destaque, selo, inclui, fotos_inclusas, foto_extra, tipo_fiscal, ordem)
values
  ('pocket', 'Pocket Especial', 'Gestante, família & feminino', 600, 150, false, 'Vagas limitadas',
    array[
      '1 hora de ensaio',
      '1 look — o que te faz sentir linda',
      'Cenário exclusivo, leve e atemporal',
      'Direção completa em cada pose',
      'Para gestantes, famílias e feminino',
      '8 fotos digitais tratadas'
    ], 8, 35, 'servico', 1),

  ('memorias', 'Memórias', 'Newborn, smash & acompanhamento', 890, 200, true, null,
    array[
      '2 horas de ensaio',
      'Estúdio aquecido ou locação externa',
      'Cenário temático personalizado',
      '15 fotos digitais tratadas',
      'Galeria online com seleção',
      '5 fotos impressas 15x21',
      'Entrega em até 15 dias'
    ], 15, 30, 'servico', 2),

  ('experiencia', 'Experiência Alma', 'Acompanhamento 1º ano & família', 1690, 350, false, null,
    array[
      'Sessão completa, sem limite de tempo',
      'Cenários e figurinos exclusivos',
      '40 fotos digitais tratadas',
      'Galeria online com seleção',
      'Álbum encadernado premium 20x30',
      'Acompanhamento do bebê no 1º ano',
      'Entrega prioritária em 10 dias'
    ], 40, 25, 'servico', 3)
on conflict (slug) do update set
  nome = excluded.nome, ideal = excluded.ideal, preco = excluded.preco,
  reserva = excluded.reserva, destaque = excluded.destaque, selo = excluded.selo,
  inclui = excluded.inclui, fotos_inclusas = excluded.fotos_inclusas,
  foto_extra = excluded.foto_extra, tipo_fiscal = excluded.tipo_fiscal, ordem = excluded.ordem;

insert into public.produtos
  (slug, nome, descricao, preco, tipo_fiscal, personalizado, ordem)
values
  ('album-20x30', 'Álbum encadernado premium 20x30',
    'Álbum fine art, capa personalizada, até 20 lâminas.', 690, 'produto', true, 1),
  ('quadro-30x45', 'Quadro em metacrilato 30x45',
    'Sua foto favorita em acabamento de galeria.', 320, 'produto', true, 2),
  ('caixa-impressas', 'Caixa com 20 fotos impressas 15x21',
    'Fotos em papel fotográfico, caixa de presente.', 180, 'produto', true, 3)
on conflict (slug) do update set
  nome = excluded.nome, descricao = excluded.descricao, preco = excluded.preco,
  tipo_fiscal = excluded.tipo_fiscal, personalizado = excluded.personalizado, ordem = excluded.ordem;
