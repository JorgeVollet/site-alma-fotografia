import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { STUDIO } from '../data/studio'

export default function WhatsappFab() {
  const [show, setShow] = useState(false)
  const [bubble, setBubble] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 1200)
    const t2 = setTimeout(() => setBubble(true), 3000)
    const t3 = setTimeout(() => setBubble(false), 9000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  const wa = `https://wa.me/${STUDIO.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Olá! Vim pelo site e gostaria de saber mais sobre os ensaios 📸'
  )}`

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0 }}
          className="fixed bottom-5 right-5 z-40 flex items-end gap-3"
        >
          <AnimatePresence>
            {bubble && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                className="mb-1 max-w-[200px] rounded-2xl rounded-br-sm bg-cream-50 px-4 py-3 text-sm text-cocoa-800 shadow-xl ring-1 ring-cocoa-800/5"
              >
                <button
                  onClick={() => setBubble(false)}
                  className="absolute -right-2 -top-2 rounded-full bg-cocoa-800 p-0.5 text-cream-100"
                >
                  <X size={12} />
                </button>
                Oi! 👋 Quer marcar seu ensaio? Fala com a gente!
              </motion.div>
            )}
          </AnimatePresence>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform hover:scale-110"
            aria-label="WhatsApp"
          >
            <MessageCircle size={26} fill="white" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
