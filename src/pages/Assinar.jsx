import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileSignature, Check, Eraser, ShieldCheck, Camera } from 'lucide-react'
import { CONTRATOS_DEMO, montarContrato } from '../data/crm'
import { formatBRL } from '../components/Money'
import { useApp } from '../context/AppContext'
import Logo from '../components/Logo'

// Página PÚBLICA de assinatura — é o que o cliente abre pelo link do WhatsApp.
export default function Assinar() {
  const { id } = useParams()
  const { contratosEdit, contratosCustom, registrarAssinatura } = useApp()
  const canvasRef = useRef(null)
  const [temAssinatura, setTemAssinatura] = useState(false)
  const [assinado, setAssinado] = useState(false)
  const desenhando = useRef(false)

  const custom = contratosCustom.find((c) => c.id === id)
  const baseDemo = CONTRATOS_DEMO.find((c) => c.id === id)
  const contrato = custom ? custom : (baseDemo ? { ...baseDemo, ...(contratosEdit[id] || {}) } : null)
  const jaAssinado = contrato && (contrato.status === 'assinado' || assinado)

  useEffect(() => {
    if (jaAssinado) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#3a2e26'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const pos = (e) => {
      const r = canvas.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top
      return { x: x * (canvas.width / r.width), y: y * (canvas.height / r.height) }
    }
    const start = (e) => { e.preventDefault(); desenhando.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const move = (e) => { if (!desenhando.current) return; e.preventDefault(); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setTemAssinatura(true) }
    const end = () => { desenhando.current = false }
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start); canvas.addEventListener('touchmove', move); canvas.addEventListener('touchend', end)
    return () => {
      canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', move); canvas.removeEventListener('touchend', end)
    }
  }, [jaAssinado])

  if (!contrato) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream-200 p-6 text-center">
        <div>
          <p className="font-serif text-2xl text-cocoa-800">Contrato não encontrado</p>
          <Link to="/" className="btn-primary mt-5">Ir para o site</Link>
        </div>
      </div>
    )
  }

  const limpar = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setTemAssinatura(false) }
  const confirmar = () => {
    const dataURL = canvasRef.current.toDataURL('image/png')
    registrarAssinatura(id, dataURL, contrato)
    setAssinado(true)
  }

  const clausulas = (contrato.clausulas && contrato.clausulas.length)
    ? contrato.clausulas.map((cl) => cl
        .replace(/\{\{cliente\}\}/g, contrato.clienteNome || '—')
        .replace(/\{\{valor\}\}/g, contrato.valor ? formatBRL(contrato.valor) : '—')
        .replace(/\{\{data\}\}/g, contrato.criado ? new Date(contrato.criado + 'T12:00').toLocaleDateString('pt-BR') : '—')
        .replace(/\{\{ensaio\}\}/g, contrato.ensaio || 'o ensaio contratado'))
    : montarContrato(contrato.modelo, {
        cliente: contrato.clienteNome, valor: formatBRL(contrato.valor),
        data: contrato.criado ? new Date(contrato.criado + 'T12:00').toLocaleDateString('pt-BR') : '—',
        ensaio: contrato.ensaio || 'o ensaio contratado',
      })

  return (
    <div className="min-h-screen bg-cream-200 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* topo */}
        <div className="mb-6 flex items-center justify-between">
          <Logo dark className="h-9" />
          <span className="flex items-center gap-1.5 text-xs text-clay-500"><ShieldCheck size={14} /> Assinatura segura</span>
        </div>

        {jaAssinado ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-cream-50 p-8 text-center shadow-sm ring-1 ring-cocoa-800/5">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-clay-400 text-cream-50"><Check size={40} /></div>
            <h1 className="mt-6 font-serif text-3xl text-cocoa-800">Contrato assinado! 🎉</h1>
            <p className="mx-auto mt-3 max-w-md font-light text-cocoa-600">
              Obrigado, {(contrato.clienteNome || '').split(' ')[0]}! Sua assinatura foi registrada e a Alma Fotografia já recebeu a confirmação. Em breve entramos em contato com os próximos passos.
            </p>
            <Link to="/" className="btn-primary mt-7"><Camera size={16} /> Conhecer a Alma Fotografia</Link>
          </motion.div>
        ) : (
          <div className="rounded-3xl bg-cream-50 p-6 shadow-sm ring-1 ring-cocoa-800/5 md:p-8">
            <p className="text-center font-serif text-xl text-cocoa-800">Contrato de Prestação de Serviços</p>
            <p className="mt-1 text-center text-sm text-clay-500">{contrato.modelo}</p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-cream-200 px-3 py-2.5"><span className="text-cocoa-500">Cliente:</span> <strong className="text-cocoa-800">{contrato.clienteNome}</strong></div>
              <div className="rounded-xl bg-cream-200 px-3 py-2.5"><span className="text-cocoa-500">Valor:</span> <strong className="text-cocoa-800">{formatBRL(contrato.valor)}</strong></div>
            </div>

            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-2xl bg-cream-100 p-5">
              {clausulas.map((cl, i) => (
                <p key={i} className="text-sm leading-relaxed text-cocoa-700"><strong>Cláusula {i + 1}ª.</strong> {cl}</p>
              ))}
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-cocoa-700"><FileSignature size={16} className="text-terracotta-500" /> Assine abaixo para aceitar os termos:</p>
            <div className="mt-2 overflow-hidden rounded-xl bg-white ring-1 ring-cocoa-800/10">
              <canvas ref={canvasRef} width={520} height={180} className="w-full cursor-crosshair touch-none" />
            </div>
            <div className="mt-2 flex justify-between">
              <button onClick={limpar} className="inline-flex items-center gap-1.5 text-xs text-cocoa-500 hover:text-cocoa-800"><Eraser size={13} /> Limpar</button>
              <span className="text-xs text-cocoa-400">{contrato.clienteNome}</span>
            </div>

            <button onClick={confirmar} disabled={!temAssinatura} className="btn-primary mt-6 w-full disabled:opacity-40"><Check size={16} /> Assinar contrato</button>
            <p className="mt-3 text-center text-xs text-cocoa-400">Ao assinar, você concorda com os termos acima. Assinatura eletrônica com validade jurídica (Lei 14.063/2020).</p>
          </div>
        )}
      </div>
    </div>
  )
}
