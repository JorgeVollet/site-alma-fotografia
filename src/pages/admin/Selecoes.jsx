import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Wand2, CheckCircle2, Loader2, ImageOff, MessageSquare, Wallet, CalendarClock, MessageCircle, ChevronLeft, Undo2, Star, X, Download, FileDown, BookOpen } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import Photo from '../../components/Photo'
import MensagemModal from '../../components/MensagemModal'
import useBackToClose from '../../hooks/useBackToClose'
import { useApp } from '../../context/AppContext'
import { fetchGalerias, fetchFotos, fetchContaGaleria, marcarContaRecebida, reabrirConta, toggleFavoritaFoto, atualizarGaleria } from '../../lib/galerias'
import { urlPublica } from '../../lib/storage'
import { FLUXO_GALERIA as FLUXO, statusLabel, statusCor } from '../../data/statusEnsaio'
import { waLink } from '../../lib/wa'

// 3 modelos de mensagem por status (o estúdio escolhe, edita ou cria os seus).
const STATUS_PRESETS = {
  enviado: [
    (n) => `Oi, ${n}! 💛 Recebemos aqui na Alma a sua seleção de fotos. Já vamos começar a preparar tudo com muito carinho — em breve te avisamos os próximos passos!`,
    (n) => `${n}, recebemos suas escolhas! ✨ Muito obrigada pela confiança. Agora é com a gente: vamos cuidar de cada foto com todo o amor. 💛`,
    (n) => `Olá, ${n}! 💛 Sua seleção chegou certinha por aqui. Em breve iniciamos o tratamento das imagens. Qualquer dúvida, é só chamar!`,
  ],
  editando: [
    (n) => `Oi, ${n}! ✨ Suas fotos já entraram em edição! Estamos tratando cada uma com muito carinho. Pode deixar que a gente te avisa por aqui a cada novidade. 💛`,
    (n) => `${n}, que alegria! 🎨 Começamos a edição das suas fotos. Cada detalhe está sendo cuidado com amor — em breve trazemos novidades por aqui!`,
    (n) => `Olá, ${n}! 💛 Passando pra contar que suas fotos estão em edição. As próximas atualizações você também recebe por aqui. Já já são suas!`,
  ],
  pronto: [
    (n) => `Oi, ${n}! 🎉 Suas fotos estão prontíssimas e te esperando! Foi um prazer enorme registrar esse momento com você. Qualquer coisa, é só chamar. 💛`,
    (n) => `${n}, chegou o grande dia! ✨ Suas fotos ficaram lindas e já estão prontas. Mal podemos esperar pra você ver! 💛 — Alma Fotografia`,
    (n) => `Olá, ${n}! 💛 Suas memórias estão prontas. Esperamos que você ame cada uma tanto quanto nós amamos criá-las. Obrigada por confiar na Alma!`,
  ],
  selecionando: [
    (n) => `Oi, ${n}! 💛 Reabrimos a sua galeria pra você ajustar a seleção das fotos. Quando terminar, é só enviar de novo. Estamos à disposição!`,
    (n) => `${n}, liberamos novamente a sua galeria pra revisão das fotos. Fique à vontade pra escolher com calma. 💛`,
    (n) => `Olá, ${n}! ✨ Sua galeria está aberta de novo pra seleção. Qualquer dúvida na hora de escolher, é só chamar a gente!`,
  ],
}

// Gera um arquivo .lrsmcol (Coleção Inteligente do Lightroom Classic). O estúdio
// importa em Coleções > (clique direito) > "Importar configurações de coleção
// inteligente" e o LR mostra/seleciona exatamente as fotos escolhidas, casando
// pelo NOME do arquivo (sem extensão, p/ pegar o RAW .CR3/.NEF do catálogo).
// Formato Lua validado: regras combinadas por `combine = "union"` (match-any),
// que fica DENTRO da tabela `value`; `id` é um UUID único por arquivo.
function gerarSmartCollection(nomes, titulo) {
  const semExt = (n) => n.replace(/\.[^.]+$/, '')
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const regras = nomes.map((n) => (
    '\t\t{\n' +
    '\t\t\tcriteria = "filename",\n' +
    '\t\t\toperation = "any",\n' +
    `\t\t\tvalue = "${esc(semExt(n))}",\n` +
    '\t\t\tvalue2 = "",\n' +
    '\t\t},'
  )).join('\n')
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'alma-' + nomes.length).toUpperCase()
  return (
    's = {\n' +
    `\tid = "${id}",\n` +
    `\tinternalName = "${esc(titulo)}",\n` +
    `\ttitle = "${esc(titulo)}",\n` +
    '\ttype = "LibrarySmartCollection",\n' +
    '\tvalue = {\n' +
    regras + '\n' +
    '\t\tcombine = "union",\n' +
    '\t},\n' +
    '\tversion = 0,\n' +
    '}\n'
  )
}

function baixarArquivo(conteudo, nome, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url; a.download = nome; a.click()
  URL.revokeObjectURL(url)
}

export default function Selecoes() {
  const [galerias, setGalerias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aberta, setAberta] = useState(null)
  const [filtro, setFiltro] = useState('todas')

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setGalerias(await fetchGalerias())
    setCarregando(false)
  }, [])
  useEffect(() => { recarregar() }, [recarregar])

  if (aberta) return <Detalhe galeria={aberta} onVoltar={() => { setAberta(null); recarregar() }} />

  const lista = filtro === 'todas' ? galerias : galerias.filter((g) => g.status === filtro)

  return (
    <div>
      <h1 className="font-serif text-3xl">Seleções</h1>
      <p className="mt-1 text-sm text-cream-100/60">Acompanhe a escolha de fotos de cada cliente, da seleção à entrega.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {['todas', ...FLUXO].map((s) => (
          <button key={s} onClick={() => setFiltro(s)} className={'rounded-full px-3 py-1.5 text-xs transition ' + (filtro === s ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-900 text-cream-100/60 hover:text-cream-100')}>
            {s === 'todas' ? 'Todas' : statusLabel(s)}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-cream-100/40"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : lista.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-cream-100/15 bg-cocoa-900/40 p-10 text-center">
          <ImageOff size={26} className="mx-auto text-cream-100/30" />
          <p className="mt-3 text-sm text-cream-100/60">Nenhuma seleção {filtro !== 'todas' ? 'nesse status' : 'ainda'}.</p>
          <p className="mt-1 text-xs text-cream-100/40">As galerias aparecem aqui assim que forem criadas em <strong>Galerias</strong>.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
          <table className="w-full text-sm">
            <thead className="bg-cocoa-900 text-left text-xs uppercase tracking-wide text-cream-100/40">
              <tr><th className="px-5 py-3">Cliente / galeria</th><th className="hidden px-5 py-3 sm:table-cell">Fotos</th><th className="px-5 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-cream-100/5">
              {lista.map((g) => (
                <tr key={g.id} onClick={() => setAberta(g)} className="cursor-pointer bg-cocoa-900/40 transition hover:bg-cocoa-900">
                  <td className="px-5 py-4"><p className="font-medium">{g.clienteNome || g.nome}</p><p className="text-xs text-cream-100/40">{g.nome}</p></td>
                  <td className="hidden px-5 py-4 text-cream-100/60 sm:table-cell">{g.totalFotos}</td>
                  <td className="px-5 py-4"><span className={'inline-block rounded-full px-2.5 py-1 text-xs ' + statusCor(g.status)}>{statusLabel(g.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Detalhe({ galeria, onVoltar }) {
  const { clientes, mudarStatusGaleria } = useApp()
  const [fotos, setFotos] = useState([])
  const [conta, setConta] = useState(null)
  const [status, setStatus] = useState(galeria.status)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroStatus, setErroStatus] = useState('')
  const [msgStatus, setMsgStatus] = useState(null) // status p/ o modal de mensagem ao cliente
  const [exportInfo, setExportInfo] = useState(null) // 'lightroom' | 'txt' — instruções pós-download
  const [vista, setVista] = useState('todas')       // todas | selecionadas | indicadas
  const [msgFoto, setMsgFoto] = useState(galeria.mensagemFotografo || '')
  const [salvandoMsg, setSalvandoMsg] = useState(false)
  const cliente = clientes.find((c) => c.id === galeria.clienteId)
  const primeiroNome = cliente?.nome ? cliente.nome.split(' ')[0] : 'tudo bem'

  const idx = FLUXO.indexOf(status)
  const proximo = FLUXO[idx + 1]
  const anterior = FLUXO[idx - 1]

  const recarregar = useCallback(async () => {
    setCarregando(true)
    const [fs, ct] = await Promise.all([fetchFotos(galeria.id), fetchContaGaleria(galeria.id, galeria.ensaioId)])
    setFotos(fs.filter((f) => f.tipo !== 'entrega')) // Seleções lida só com as provas
    setConta(ct)
    setCarregando(false)
  }, [galeria.id, galeria.ensaioId])
  useEffect(() => { recarregar() }, [recarregar])

  const selecionadas = fotos.filter((f) => f.selecionada)
  const indicadas = fotos.filter((f) => f.favorita)
  const comObs = fotos.filter((f) => f.observacao)
  const semNome = selecionadas.filter((f) => !f.nomeArquivo).length
  const slug = (galeria.clienteNome || galeria.nome || 'selecao').toLowerCase().replace(/[^\w]+/g, '-')

  // muda o status (avança OU volta) — costura o funil e abre a mensagem ao cliente
  const mudar = async (novo, confirmar) => {
    if (confirmar && !window.confirm(confirmar)) return
    setSalvando(true)
    const ok = await mudarStatusGaleria(galeria.id, novo)
    setSalvando(false)
    // ANTES a tela avancava mesmo com o banco recusando: o estudio avisava
    // "suas fotos estao prontas" com o status parado no servidor.
    if (!ok) {
      setErroStatus('Não foi possível mudar a etapa agora. A tela continua na etapa anterior — tente de novo.')
      return
    }
    setErroStatus('')
    setStatus(novo)
    if (STATUS_PRESETS[novo]) setMsgStatus(novo) // abre o pop-up de aviso (opcional)
  }

  const favoritar = async (foto) => {
    const nova = !foto.favorita
    setFotos((fs) => fs.map((x) => (x.id === foto.id ? { ...x, favorita: nova } : x)))
    await toggleFavoritaFoto(foto.id, nova)
  }

  const salvarRecado = async () => {
    setSalvandoMsg(true)
    await atualizarGaleria(galeria.id, { mensagemFotografo: msgFoto })
    setSalvandoMsg(false)
  }

  const receber = async () => {
    if (!conta) return
    if (!window.confirm('Confirmar o recebimento desse pagamento?')) return
    await marcarContaRecebida(conta.id)
    setConta({ ...conta, status: 'pago' })
  }

  const desfazerRecebimento = async () => {
    if (!conta) return
    if (!window.confirm('Desfazer o recebimento? A conta volta para "A receber".')) return
    await reabrirConta(conta.id)
    setConta({ ...conta, status: 'pendente' })
  }

  const exportarLightroom = () => {
    const nomes = selecionadas.map((f) => f.nomeArquivo).filter(Boolean)
    if (!nomes.length) {
      alert('Estas fotos foram enviadas antes desta atualização e não têm o nome original salvo. Reenvie as fotos para usar o Smart Collection do Lightroom — ou use a “Lista (.txt)”.')
      return
    }
    const conteudo = gerarSmartCollection(nomes, `Seleção — ${galeria.clienteNome || galeria.nome}`)
    baixarArquivo(conteudo, `selecao-${slug}.lrsmcol`, 'text/plain;charset=utf-8')
    setExportInfo('lightroom')
  }

  const exportarTxt = () => {
    const linhas = selecionadas.map((f) => f.nomeArquivo || `Foto ${fotos.indexOf(f) + 1}`)
    const txt = `# Seleção — ${galeria.clienteNome || galeria.nome}\n# ${selecionadas.length} fotos selecionadas\n\n${linhas.join('\n')}`
    baixarArquivo(txt, `selecao-${slug}.txt`, 'text/plain;charset=utf-8')
    setExportInfo('txt')
  }

  const venc = conta?.vencimento ? new Date(conta.vencimento + 'T12:00').toLocaleDateString('pt-BR') : null
  const wa = waLink(cliente?.telefone)

  const visiveis = vista === 'selecionadas' ? selecionadas : vista === 'indicadas' ? indicadas : fotos

  return (
    <div>
      <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100"><ArrowLeft size={16} /> Voltar para seleções</button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{galeria.clienteNome || galeria.nome}</h1>
          <p className="mt-1 text-sm text-cream-100/60">{galeria.nome} · {selecionadas.length} de {fotos.length} selecionadas{indicadas.length > 0 && ` · ${indicadas.length} indicada(s)`}</p>
        </div>
        <span className={'rounded-full px-3 py-1.5 text-xs ' + statusCor(status)}>{statusLabel(status)}</span>
      </div>

      {/* Pagamento + ações de status */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/50"><Wallet size={13} /> Pagamento da seleção</p>
          {conta ? (
            <div className="mt-2">
              <p className="font-serif text-2xl">{formatBRL(conta.valor)}</p>
              {conta.status === 'pago'
                ? <p className="mt-1 text-sm text-emerald-300">Pago ✓</p>
                : <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-300"><CalendarClock size={14} /> A receber{venc ? ` até ${venc}` : ''}</p>}
              {conta.status !== 'pago'
                ? <button onClick={receber} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/25 hover:bg-emerald-500/25"><Check size={13} /> Marcar como recebido</button>
                : <button onClick={desfazerRecebimento} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cocoa-800 px-3 py-1.5 text-xs text-cream-100/70 ring-1 ring-cream-100/15 hover:text-amber-300"><Undo2 size={13} /> Desfazer recebimento</button>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-cream-100/40">Ainda não há cobrança gerada para esta seleção.</p>
          )}
        </div>

        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="text-xs text-cream-100/50">Andamento <span className="text-cream-100/30">(dá pra voltar atrás · avisa o cliente)</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {anterior && (
              <button onClick={() => mudar(anterior, `Voltar o status para "${statusLabel(anterior)}"?`)} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-full bg-cocoa-800 px-3 py-2 text-xs text-cream-100/70 ring-1 ring-cream-100/15 hover:text-cream-100 disabled:opacity-50">
                <ChevronLeft size={14} /> Voltar p/ {statusLabel(anterior)}
              </button>
            )}
            {proximo && (
              <button onClick={() => mudar(proximo, proximo === 'pronto' ? 'Marcar o ensaio como pronto/entregue?' : null)} disabled={salvando} className="inline-flex items-center gap-2 rounded-full bg-terracotta-500/20 px-4 py-2 text-xs text-terracotta-300 ring-1 ring-terracotta-400/30 hover:bg-terracotta-500/30 disabled:opacity-50">
                {proximo === 'editando' ? <Wand2 size={14} /> : proximo === 'pronto' ? <CheckCircle2 size={14} /> : <Check size={14} />}
                {{ enviado: 'Marcar seleção recebida', editando: 'Iniciar edição', pronto: 'Marcar como pronto' }[proximo] || 'Avançar'}
              </button>
            )}
            {status === 'pronto' && <span className="self-center text-sm text-emerald-300">Entregue 🎉</span>}
            {STATUS_PRESETS[status] && <button onClick={() => setMsgStatus(status)} className="inline-flex items-center gap-1.5 rounded-full bg-cocoa-800 px-3 py-2 text-xs text-cream-100/70 ring-1 ring-cream-100/15 hover:text-cream-100"><MessageCircle size={13} /> Avisar cliente</button>}
          </div>
          {erroStatus && (
            <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-300 ring-1 ring-red-400/30">{erroStatus}</p>
          )}
          {selecionadas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-cream-100/10 pt-3">
              <button onClick={exportarLightroom} className="inline-flex items-center gap-2 rounded-full bg-terracotta-500/15 px-4 py-2 text-xs text-terracotta-300 ring-1 ring-terracotta-400/25 hover:bg-terracotta-500/25"><Download size={14} /> Exportar p/ Lightroom</button>
              <button onClick={exportarTxt} className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2 text-xs text-cream-100 ring-1 ring-cream-100/15 hover:bg-cocoa-700"><FileDown size={14} /> Lista (.txt)</button>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-4 py-2 text-xs text-[#25D366] hover:bg-[#25D366]/25"><MessageCircle size={14} /> WhatsApp</a>}
            </div>
          )}
          {selecionadas.length > 0 && semNome > 0 && (
            <p className="mt-2 text-[11px] text-amber-300/80">⚠ {semNome} foto(s) sem nome original (enviadas antes da atualização) — o Lightroom só casa as que têm nome. Reenvie p/ usar 100%.</p>
          )}
        </div>
      </div>

      {/* Indicações da Alma (recado + favoritas do fotógrafo) */}
      <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
        <h3 className="flex items-center gap-2 font-serif text-lg"><Star size={16} className="text-amber-300" /> Indicações da Alma</h3>
        <p className="mt-1 text-xs text-cream-100/50">Favorite (⭐) as fotos abaixo que você recomenda — elas aparecem em destaque na galeria do cliente, com o seu recado. Ótimo p/ vender extras 💛</p>
        <textarea
          value={msgFoto} onChange={(e) => setMsgFoto(e.target.value)} rows={2}
          placeholder="Recado pro cliente sobre as fotos que você indicou. Ex: Essas ficaram especiais — amei a luz e a expressão, valem muito a pena! 💛"
          className="mt-3 w-full resize-none rounded-xl bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none ring-1 ring-cream-100/10 placeholder:text-cream-100/30 focus:ring-terracotta-400/40"
        />
        <button onClick={salvarRecado} disabled={salvandoMsg} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cocoa-800 px-3 py-1.5 text-xs text-cream-100/80 ring-1 ring-cream-100/15 hover:text-cream-100 disabled:opacity-50">
          {salvandoMsg ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar recado
        </button>
      </div>

      {/* Observações */}
      {comObs.length > 0 && (
        <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <h3 className="flex items-center gap-2 font-serif text-lg"><MessageSquare size={16} /> Observações do cliente</h3>
          <ul className="mt-3 space-y-2">
            {comObs.map((f) => (
              <li key={f.id} className="flex gap-3 text-sm"><span className="shrink-0 text-cream-100/40">Foto {fotos.indexOf(f) + 1}:</span><span className="text-cream-100/80">{f.observacao}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Fotos (todas/selecionadas/indicadas) — clicar na ⭐ indica ao cliente */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-xl">Fotos</h3>
        <div className="flex gap-1.5">
          {[['todas', `Todas (${fotos.length})`], ['selecionadas', `Selecionadas (${selecionadas.length})`], ['indicadas', `Indicadas (${indicadas.length})`]].map(([id, lbl]) => (
            <button key={id} onClick={() => setVista(id)} className={'rounded-full px-3 py-1.5 text-xs transition ' + (vista === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-900 text-cream-100/60 hover:text-cream-100')}>{lbl}</button>
          ))}
        </div>
      </div>
      {carregando ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-cream-100/40"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : visiveis.length === 0 ? (
        <p className="mt-4 text-sm text-cream-100/40">Nenhuma foto {vista === 'selecionadas' ? 'selecionada pelo cliente' : vista === 'indicadas' ? 'indicada' : ''} ainda.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {visiveis.map((f) => (
            <div key={f.id} className={'group relative overflow-hidden rounded-lg ring-2 transition ' + (f.selecionada ? 'ring-terracotta-400/60' : 'ring-transparent')}>
              <Photo src={urlPublica(f.thumbPath)} alt="" fallback="ph-gradient-2" className="aspect-square" />
              {f.selecionada && <div className="absolute right-1 top-1 rounded-full bg-terracotta-500 p-1 text-cream-50" title="Selecionada pelo cliente"><Check size={11} /></div>}
              {/* botão favoritar (estrela) */}
              <button onClick={() => favoritar(f)} title={f.favorita ? 'Remover indicação' : 'Indicar ao cliente'} className={'absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full transition ' + (f.favorita ? 'bg-amber-400 text-cocoa-900' : 'bg-cocoa-950/70 text-cream-100/70 opacity-0 group-hover:opacity-100 hover:text-amber-300')}>
                <Star size={12} className={f.favorita ? 'fill-current' : ''} />
              </button>
              {f.observacao && <div className="absolute inset-x-0 bottom-0 truncate bg-cocoa-950/80 px-1.5 py-1 text-[10px] text-cream-100/80" title={f.observacao}>💬 {f.observacao}</div>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {msgStatus && (
          <MensagemModal
            titulo="Avisar o cliente?"
            subtitulo={`Status agora: ${statusLabel(msgStatus)} · para ${cliente?.nome || 'o cliente'}. É opcional — escolha um modelo, edite e envie, ou pule.`}
            presets={(STATUS_PRESETS[msgStatus] || []).map((fn) => fn(primeiroNome))}
            presetKey={'status:' + msgStatus}
            cliente={cliente}
            assunto={`Suas fotos na Alma Fotografia — ${galeria.nome}`}
            onClose={() => setMsgStatus(null)}
          />
        )}
        {exportInfo && <ExportInfoModal tipo={exportInfo} onClose={() => setExportInfo(null)} />}
      </AnimatePresence>
    </div>
  )
}

// Instruções de como usar o arquivo exportado (Lightroom .lrsmcol / lista .txt).
function ExportInfoModal({ tipo, onClose }) {
  useBackToClose(onClose)
  const Passo = ({ n, children }) => (
    <li className="flex gap-2.5">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-terracotta-500/20 text-[11px] text-terracotta-300">{n}</span>
      <span className="flex-1">{children}</span>
    </li>
  )
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><BookOpen size={20} className="text-terracotta-400" /> Arquivo baixado!</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/60">Como usar no Lightroom Classic — a seleção do cliente aparece sozinha:</p>
        <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-cream-100/80">
          <Passo n="1">No Lightroom, no painel <strong>Coleções</strong>, clique com o <strong>botão direito</strong>.</Passo>
          <Passo n="2">Escolha <strong>“Importar configurações de coleção inteligente”</strong>.</Passo>
          <Passo n="3">Selecione o arquivo <strong>.lrsmcol</strong> que acabou de baixar.</Passo>
          <Passo n="4">Pronto! A coleção abre já com <strong>as fotos escolhidas</strong> — casa pelo nome e pega o RAW. Para transformar em bandeira, selecione tudo <strong>(Ctrl/Cmd + A)</strong> e tecle <strong>P</strong>.</Passo>
        </ol>
        {tipo === 'txt' && (
          <div className="mt-4 rounded-xl bg-cocoa-950 p-3 text-xs leading-relaxed text-cream-100/60">
            <p className="font-medium text-cream-100/80">Você baixou a lista .txt</p>
            <p className="mt-1">É um plano B: abre os nomes das fotos pra conferência manual, ou pra colar no filtro de texto do Lightroom (Filtro &gt; Texto &gt; Nome do arquivo &gt; <strong>Contém</strong>). Pra seleção automática, prefira o botão <strong>“Exportar p/ Lightroom”</strong> (.lrsmcol).</p>
          </div>
        )}
        <button onClick={onClose} className="btn-light mt-5 w-full">Entendi</button>
      </motion.div>
    </motion.div>
  )
}

