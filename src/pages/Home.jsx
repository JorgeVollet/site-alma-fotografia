import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ArrowRight, Plus } from 'lucide-react'
import Reveal from '../components/Reveal'
import Photo from '../components/Photo'
import Avaliacoes from '../components/Avaliacoes'
import { SeloCircular, IconeA, PatternBg } from '../components/MarcaDagua'
import { Parallax, ParallaxImg, RevealCinematic, TituloScroll, ImagemCresce } from '../components/ScrollFX'
import CardEquipe from '../components/CardEquipe'
import ScrollHorizontal, { ItemHorizontal } from '../components/ScrollHorizontal'
import ScrollyEssencia from '../components/ScrollyEssencia'
import ScrollStack from '../components/ScrollStack'
import { STUDIO, SERVICOS, PROCESSO, ESSENCIA, EQUIPE } from '../data/studio'
import { DESTAQUES } from '../data/galleries'

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Hero />
      <Essencia />
      <IndiceServicos />
      <GaleriaEditorial />
      <ProcessoEditorial />
      <Avaliacoes />
      <CTAEditorial />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* HERO — foto full-screen com título sobreposto gigante               */
/* ------------------------------------------------------------------ */
function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -80])

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-cocoa-950">
      {/* selo circular da marca, girando suave */}
      <SeloCircular className="absolute right-6 top-24 z-20 md:right-12 md:top-28" size="h-24 w-24 md:h-32 md:w-32" opacity="opacity-90" />
      {/* foto de fundo full-bleed */}
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <Photo
          src="/fotos/hero.jpg"
          alt="Aline e Maurício — Alma Fotografia"
          className="h-full w-full"
          fallback="ph-gradient-4"
        />
        {/* gradiente para dar contraste ao texto na base (foto é clara) */}
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/90 via-cocoa-950/10 to-transparent" />
      </motion.div>

      {/* título sobreposto — escala editorial gigante */}
      <motion.div style={{ y: titleY }} className="container-c absolute inset-x-0 bottom-0 z-10 pb-[8vh]">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest2 text-cream-100/80">
            <span className="h-px w-8 bg-clay-400" /> Estúdio materno-infantil · desde 2016
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="display mt-4 text-[clamp(3rem,12vw,11rem)] leading-[0.86] text-cream-50">
            Memórias
            <span className="block italic text-clay-300">afetivas.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="mt-8 flex flex-col items-start justify-between gap-6 border-t border-cream-100/15 pt-6 md:flex-row md:items-center">
            <p className="max-w-sm font-sans text-sm font-light leading-relaxed text-cream-100/75">
              {STUDIO.subTagline} Há {STUDIO.anos} anos em {STUDIO.cidade}/{STUDIO.estado},
              transformando gestação, primeiros dias e cada fase da infância em retratos cheios de verdade.
            </p>
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-2 text-cream-100/80">
                <span className="text-clay-300">★★★★★</span>
                <span className="font-sans text-xs">{STUDIO.googleNota} · {STUDIO.googleQtd} no Google</span>
              </div>
              <Link to="/agendar" className="btn-light !py-3 text-xs">
                Agendar ensaio <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      </motion.div>

      {/* índice lateral (detalhe editorial) */}
      <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex">
        {['Ensaios', 'Sobre', 'Galeria', 'Avaliações'].map((t, i) => (
          <span key={t} className="font-sans text-[10px] uppercase tracking-widest2 text-cream-100/40">
            0{i + 1} — {t}
          </span>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* ESSÊNCIA — quem somos: Aline, Maurício e a Alma                     */
/* ------------------------------------------------------------------ */
function Essencia() {
  return (
    <section className="relative bg-cream-100">
      {/* SCROLLYTELLING "A Alma" — revelação por palavra no scroll */}
      <ScrollyEssencia
        selo="01 — A Alma"
        titulo={ESSENCIA.titulo}
        paragrafos={ESSENCIA.texto}
        boasVindas={ESSENCIA.boasVindas}
      />

      {/* SCROLL HORIZONTAL — texto "Quem somos" fixo à esquerda e os 3
          cards da equipe deslizando (técnica sticky-pin estilo AETHER) */}
      <ScrollHorizontal
        painel={
          <div>
            <span className="font-sans text-xs uppercase tracking-widest2 text-clay-600">02 — Nossa equipe</span>
            <h2 className="display mt-4 text-5xl leading-[0.95] text-cocoa-900 md:text-7xl">
              Os corações <span className="italic text-terracotta-600">da Alma.</span>
            </h2>
            <p className="mt-6 max-w-sm font-sans text-base font-light leading-relaxed text-cocoa-600">
              Continue rolando para conhecer quem está por trás de cada ensaio — passe o mouse nos cards para descobrir mais.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest2 text-clay-500">
              Role para o lado →
            </span>
          </div>
        }
      >
        {EQUIPE.map((m, i) => (
          <ItemHorizontal key={m.nome}>
            <CardEquipe m={m} i={i} cta="Conheça a equipe" to="/servicos" />
          </ItemHorizontal>
        ))}

        {/* NÚMEROS — lado a lado, fecham a composição do track */}
        <div className="flex shrink-0 items-center gap-10 border-l border-cocoa-800/15 pl-12 md:gap-16 md:pl-16">
          {[
            ['10', 'anos criando memórias'],
            ['2.000+', 'famílias fotografadas'],
            ['5,0★', '112 avaliações no Google'],
          ].map(([num, label]) => (
            <div key={label} className="w-[40vw] shrink-0 sm:w-[32vw] md:w-auto">
              <p className="display text-5xl text-cocoa-900 md:text-7xl">{num}</p>
              <p className="mt-2 font-sans text-sm text-cocoa-500 md:whitespace-nowrap">{label}</p>
            </div>
          ))}
        </div>
      </ScrollHorizontal>

    </section>
  )
}

/* ------------------------------------------------------------------ */
/* ÍNDICE DE SERVIÇOS — lista editorial numerada, com hover de foto    */
/* ------------------------------------------------------------------ */












function IndiceServicos() {
  const lista = SERVICOS.slice(0, 6)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  // DESLOCAMENTO DA LISTA: quando a categoria i abre, a lista sobe i*LINHA
  // (traz o nome i pro topo, mostra o conteúdo completo). Quando fecha,
  // volta a 0 (todos alinhados). Ligado ao mesmo progresso das fases.
  const LINHA = 89
  const EXTRA = 96  // sobe um pouco a mais quando aberto: ativo vai pro TOPO,
                    // a anterior sai de cima e a próxima aparece embaixo.
  const DEAD = 0.05
  const seg = (1 - DEAD) / lista.length
  const pts = [0]
  const vals = [0]
  for (let i = 0; i < lista.length; i++) {
    const ini = DEAD + i * seg
    const gapIni = ini + seg * 0.12  // ainda fechado -> lista em 0
    const cheio  = ini + seg * 0.28  // abriu -> ativo no topo
    const segura = ini + seg * 0.68  // segura aberto
    const fecha  = ini + seg * 0.85  // fechou -> lista volta a 0
    const aberto = i * LINHA + EXTRA
    pts.push(gapIni, cheio, segura, fecha)
    vals.push(0, aberto, aberto, 0)
  }
  pts.push(1); vals.push(0)
  const listaY = useTransform(scrollYProgress, pts, vals)
  const listaYNeg = useTransform(listaY, (v) => -v)

  return (
    // seção ALTA = scroll lento por categoria (pin). 150vh por item.
    <section ref={ref} className="relative bg-cocoa-950 text-cream-100" style={{ height: `${lista.length * 320 + 40}vh` }}>
      <div className="sticky top-0 flex h-screen items-start overflow-hidden pt-[calc(12vh+50px)]">
        <div className="container-c grid w-full items-start gap-10 md:grid-cols-12">
          {/* ESQUERDA — título fixo */}
          <div className="md:col-span-4 md:pr-8">
            <SeloCircular className="mb-6 opacity-15" size="h-20 w-20 md:h-24 md:w-24" />
            <span className="font-sans text-xs uppercase tracking-widest2 text-terracotta-400">02 — O que fazemos</span>
            <h2 className="display mt-4 text-4xl leading-[0.95] md:text-6xl">Cada fase,<br /><span className="italic text-sand-200">um ensaio.</span></h2>
            <Link to="/servicos" className="btn-ghost mt-8 w-fit">Ver todos os serviços <ArrowRight size={15} /></Link>
          </div>

          {/* DIREITA — accordion FIXO; a lista sobe quando uma abre (traz o
              nome ao topo, mostra o conteúdo completo) e volta ao fechar. */}
          <div className="md:col-span-8">
            <motion.div style={{ y: listaYNeg }}>
              {lista.map((s, i) => (
                <ServicoFase key={s.id} s={s} i={i} total={lista.length} progress={scrollYProgress} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Cada categoria controla seu próprio painel pela posição do scroll.
// Fatia da categoria i: [DEAD + i*seg, DEAD + (i+1)*seg].
// Dentro da fatia: abre[0-.30] -> segura[.30-.70] -> fecha[.70-1].
function ServicoFase({ s, i, total, progress }) {
  const DEAD = 0.05
  const usable = 1 - DEAD
  const seg = usable / total
  const ini = DEAD + i * seg
  // dentro da fatia: GAP inicial fechado -> abre -> segura -> fecha -> GAP final fechado
  // os gaps criam o "respiro fechado" entre uma categoria e a próxima.
  const aGapIni = ini + seg * 0.12   // fica fechado até aqui (respiro)
  const aCheio  = ini + seg * 0.28   // termina de abrir
  const aSegura = ini + seg * 0.68   // começa a fechar
  const aFecha  = ini + seg * 0.85   // terminou de fechar (depois: gap final fechado)

  // maxHeight: fechado -> abre -> segura aberto -> fecha -> fechado (gap)
  const maxH = useTransform(progress, [aGapIni, aCheio, aSegura, aFecha], ['0px', '640px', '640px', '0px'])
  const op = useTransform(progress, [aGapIni, aCheio, aSegura, aFecha], [0, 1, 1, 0])
  const cor = useTransform(progress, [aGapIni, aCheio, aSegura, aFecha],
    ['rgb(245,243,238)', 'rgb(202,161,95)', 'rgb(202,161,95)', 'rgb(245,243,238)'])

  return (
    <div className="border-t border-cream-100/10">
      <div className="flex items-baseline gap-4 py-5">
        <span className="font-sans text-sm text-cream-100/30">{String(i + 1).padStart(2, '0')}</span>
        <motion.h3 style={{ color: cor }} className="display text-3xl md:text-5xl">{s.nome}</motion.h3>
      </div>

      <motion.div style={{ maxHeight: maxH, opacity: op }} className="overflow-hidden">
        <div className="pb-7">
          {s.foto ? (
            <div className="overflow-hidden rounded-sm">
              <img src={s.foto} alt={`Ensaio ${s.nome} — Alma Fotografia`} draggable={false} className="max-h-[40vh] w-full rounded-sm object-cover" />
            </div>
          ) : (
            <div className={`${s.gradient} aspect-[16/9] w-full rounded-sm`} />
          )}
          <p className="mt-5 max-w-xl font-sans text-base font-light leading-relaxed text-cream-100/75">{s.descricao}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {s.tags.map((t) => (
              <li key={t} className="rounded-full border border-cream-100/15 px-3 py-1.5 text-xs text-cream-100/70">{t}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to={`/servicos#${s.id}`} className="inline-flex items-center gap-2 text-sm text-cream-100 link-underline">
              Ver página de {s.nome} <ArrowRight size={15} />
            </Link>
            <Link to="/agendar" className="inline-flex items-center gap-2 text-sm text-clay-400 link-underline">
              Agendar {s.nome} <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GALERIA EDITORIAL — fotos full-bleed em escala variada              */
/* ------------------------------------------------------------------ */
function GaleriaEditorial() {
  // 10 fotos pra galeria de colunas (mistura de reais locais + acervo)
  const extras = DESTAQUES.slice(0, 6)
  const fotosGaleria = [
    { src: '/fotos/capagaleria.jpg', titulo: 'Histórias que ganham vida', legenda: 'Cada ensaio, um capítulo da sua história.', pos: 'center top', cat: 'todos' },
    { src: '/fotos/familia.jpg', titulo: 'Família', legenda: 'O amor que une vocês, ao ar livre.', pos: 'center', cat: 'familia' },
    { src: '/fotos/gestanteok.png', titulo: 'Gestante', legenda: 'A beleza única da espera.', pos: 'center', cat: 'gestante' },
    { src: '/fotos/newborn.jpg', titulo: 'Newborn', legenda: 'Os primeiros dias, com todo o cuidado.', pos: 'center', cat: 'newborn' },
    { src: '/fotos/smash.jpg', titulo: 'Smash the Cake', legenda: 'A festa do primeiro aninho.', pos: 'center', cat: 'smash' },
    { src: '/fotos/acompanhamento.jpg', titulo: 'Acompanhamento', legenda: 'Cada fase do primeiro ano.', pos: 'center', cat: 'acompanhamento' },
    { src: '/fotos/2.jpg', titulo: 'Momentos reais', legenda: 'Histórias que ganham vida.', pos: 'center', cat: 'todos' },
    { src: '/fotos/gestante.jpeg', titulo: 'Nós 1+1=3', legenda: 'De casal a família, a história começa antes.', pos: 'center', cat: 'casal' },
  ].filter((f) => f.src)

  return (
    <section className="bg-cream-100 py-[14vh]">
      <div className="container-c">
        <RevealCinematic>
          <span className="font-sans text-xs uppercase tracking-widest2 text-clay-600">03 — Galeria</span>
          <h2 className="display mt-4 text-5xl text-cocoa-800 md:text-7xl">
            Histórias que <span className="italic text-terracotta-600">ganham vida.</span>
          </h2>
        </RevealCinematic>
      </div>

      {/* SCROLL-TO-STACK — a CAPA é o 1º slide (abre em caixa) e os demais
          empilham por cima dela, criando a pilha contínua. */}
      <div className="mt-10">
        <ScrollStack slides={fotosGaleria} />
      </div>

      <div className="container-c">
        <RevealCinematic delay={0.1} className="mx-auto mt-16 flex max-w-4xl flex-col items-start gap-5 border-t border-cocoa-800/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md font-sans text-sm font-light leading-relaxed text-cocoa-600">
            Conduzimos cada ensaio com leveza, paciência e carinho — especialmente com as crianças.
            Sem pressa, sem poses forçadas. Só momentos reais e muito afeto.
          </p>
          <Link to="/portfolio" className="inline-flex shrink-0 items-center gap-2 text-sm text-clay-600 link-underline">
            Ver portfólio completo <ArrowRight size={15} />
          </Link>
        </RevealCinematic>
      </div>
    </section>
  )
}


/* ------------------------------------------------------------------ */
/* PROCESSO — passos numerados editorial, layout horizontal            */
/* ------------------------------------------------------------------ */
function ProcessoEditorial() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.7', 'end 0.6'],
  })
  // a linha vertical preenche de 0% a 100% conforme rola (path tracing)
  const altura = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section className="bg-sage-100 py-[14vh]">
      <div className="container-c">
        {/* TÍTULO centralizado no topo */}
        <TituloScroll className="mx-auto mb-16 max-w-2xl text-center md:mb-24">
          <span className="font-sans text-xs uppercase tracking-widest2 text-clay-600">04 — Como funciona</span>
          <h2 className="display mt-4 text-4xl text-cocoa-800 md:text-6xl">
            Do primeiro oi ao <span className="italic text-clay-500">download.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-base font-light leading-relaxed text-cocoa-600">
            Um processo pensado para ser leve, transparente e sem surpresas. Você acompanha cada etapa.
          </p>
        </TituloScroll>

        {/* PASSOS com a linha traçada, centralizados */}
        <div className="mx-auto max-w-3xl">
            {/* PATH TRACING — linha vertical CENTRAL; passos alternam lado */}
            <div ref={ref} className="relative">
              {/* trilho de fundo (track) — centro */}
              <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-cocoa-800/15" />
              {/* linha que PREENCHE em terracota conforme o scroll */}
              <motion.div
                style={{ height: altura }}
                className="absolute left-1/2 top-2 w-px -translate-x-1/2 bg-terracotta-500"
              />

              {PROCESSO.map((p, i) => (
                <PassoTrace key={p.n} p={p} i={i} progress={scrollYProgress} total={PROCESSO.length} />
              ))}
            </div>
        </div>
      </div>
    </section>
  )
}

// Cada passo: a bolinha na linha acende (terracota) quando a trilha
// alcança a posição dele; o texto também ganha destaque.
function PassoTrace({ p, i, progress, total }) {
  const ponto = (i + 0.5) / total           // posição do passo na linha (0..1)
  const aceso = useTransform(progress, [ponto - 0.08, ponto], [0, 1])
  const escala = useTransform(aceso, [0, 1], [0.6, 1])
  const bg = useTransform(aceso, [0, 1], ['rgba(150,127,110,0.35)', 'rgb(166,122,85)'])
  const corTexto = useTransform(aceso, [0, 1], ['rgb(120,113,103)', 'rgb(86,92,85)'])

  const esquerda = i % 2 === 0  // 1,3,5 -> esquerda | 2,4,6 -> direita

  return (
    <div className="relative py-8">
      {/* bolinha — centro exato sobre a linha (marginLeft compensa o ring) */}
      <motion.span
        style={{ scale: escala, backgroundColor: bg, left: '50%', marginLeft: '-7px' }}
        className="absolute top-[42px] z-10 h-3.5 w-3.5 rounded-full ring-4 ring-sage-100"
      />
      {/* conteúdo de um lado da linha */}
      <div className={`grid md:grid-cols-2 ${esquerda ? '' : ''}`}>
        {esquerda ? (
          <>
            <div className="pr-10 text-right md:pr-14">
              <div className="flex items-start justify-end gap-4">
                <div>
                  <motion.h3 style={{ color: corTexto }} className="font-serif text-2xl">{p.titulo}</motion.h3>
                  <p className="mt-1.5 ml-auto max-w-sm font-sans text-sm font-light leading-relaxed text-cocoa-600">{p.texto}</p>
                </div>
                <span className="display text-3xl text-clay-400 md:text-4xl">{p.n}</span>
              </div>
            </div>
            <div />
          </>
        ) : (
          <>
            <div />
            <div className="pl-10 md:pl-14">
              <div className="flex items-start gap-4">
                <span className="display text-3xl text-clay-400 md:text-4xl">{p.n}</span>
                <div>
                  <motion.h3 style={{ color: corTexto }} className="font-serif text-2xl">{p.titulo}</motion.h3>
                  <p className="mt-1.5 max-w-sm font-sans text-sm font-light leading-relaxed text-cocoa-600">{p.texto}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CTA EDITORIAL — tipografia gigante                                  */
/* ------------------------------------------------------------------ */
function CTAEditorial() {
  return (
    <section className="relative overflow-hidden bg-cocoa-950 py-[16vh] text-cream-100">
      <div className="grain absolute inset-0 opacity-[0.05]" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-clay-500/15 blur-3xl" />
      <SeloCircular className="absolute -right-12 -top-12 opacity-20 md:right-12 md:top-12 md:opacity-30" size="h-40 w-40 md:h-48 md:w-48" />
      <div className="container-c relative">
        <RevealCinematic>
          <span className="font-sans text-xs uppercase tracking-widest2 text-terracotta-400">Vamos criar juntos</span>
        </RevealCinematic>
        <TituloScroll className="origin-left" from={80}>
          <h2 className="display mt-6 text-[clamp(2.5rem,9vw,8rem)] leading-[0.9]">
            Vamos eternizar
            <span className="block italic text-clay-300">o seu momento?</span>
          </h2>
        </TituloScroll>
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-start gap-5 border-t border-cream-100/15 pt-8 sm:flex-row sm:items-center">
            <Link to="/agendar" className="btn-blush">
              Agendar meu ensaio <ArrowUpRight size={16} />
            </Link>
            <Link to="/pacotes" className="inline-flex items-center gap-2 text-sm text-cream-100/70 link-underline">
              <Plus size={15} /> Ver pacotes e preços
            </Link>
            <span className="ml-auto hidden font-sans text-sm text-cream-100/50 md:block">
              {STUDIO.whatsappDisplay}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
