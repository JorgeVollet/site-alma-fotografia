import { useEffect, useRef } from 'react'

// Faz o botão "Voltar" do navegador (e o gesto de voltar) FECHAR o pop-up em
// vez de sair do painel. Ao abrir, empilha UMA entrada "modal" no histórico;
// o "voltar" dispara popstate → fecha o modal (sem mudar de página).
//
// Importante: a limpeza NÃO chama history.back() — em dev o StrictMode roda o
// efeito 2× (setup→cleanup→setup) e um back() na limpeza dispararia um popstate
// capturado pelo listener recém-montado, fechando o modal na hora (bug do
// "abre e fecha"). O push é idempotente (só empilha se ainda não há a marca),
// então o double-invoke do StrictMode não cria entradas duplicadas, e a marca
// que sobra ao fechar pelo X é reutilizada/absorvida no próximo "voltar".
export default function useBackToClose(onClose) {
  const cb = useRef(onClose)
  cb.current = onClose
  useEffect(() => {
    const jaTem = window.history.state && window.history.state.almaModal
    if (!jaTem) window.history.pushState({ almaModal: true }, '')
    const onPop = () => { if (cb.current) cb.current() }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
}
