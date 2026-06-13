import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import WhatsappFab from './components/WhatsappFab'

import Home from './pages/Home'
import Servicos from './pages/Servicos'
import Portfolio from './pages/Portfolio'
import Ensaio from './pages/Ensaio'
import Pacotes from './pages/Pacotes'
import Agendar from './pages/Agendar'
import AreaCliente from './pages/AreaCliente'
import Admin from './pages/Admin'
import Assinar from './pages/Assinar'
import EditorAlbum from './pages/EditorAlbum'

export default function App() {
  const location = useLocation()
  // Páginas standalone (sem header/footer do site)
  const standalone = location.pathname.startsWith('/assinar') || location.pathname.startsWith('/diagramador')

  if (standalone) {
    return (
      <>
        <ScrollToTop />
        <Routes location={location}>
          <Route path="/assinar/:id" element={<Assinar />} />
          <Route path="/diagramador/:id" element={<EditorAlbum />} />
        </Routes>
      </>
    )
  }

  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/ensaio/:id" element={<Ensaio />} />
            <Route path="/pacotes" element={<Pacotes />} />
            <Route path="/agendar" element={<Agendar />} />
            <Route path="/cliente" element={<AreaCliente />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <WhatsappFab />
    </>
  )
}
