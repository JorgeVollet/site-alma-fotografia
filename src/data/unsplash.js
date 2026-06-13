// =====================================================================
//  FOTOS REAIS (Unsplash) — curadoria por categoria de ensaio
//  Foco no nicho da ALMA: materno-infantil (gestante, newborn,
//  acompanhamento, smash the cake, família, lifestyle).
//  URLs diretas e estáveis de images.unsplash.com.
//  Estas fotos são ILUSTRATIVAS (demo). Serão trocadas pelas reais
//  do estúdio na versão final.
// =====================================================================

// IDs de fotos do Unsplash, agrupados por categoria (nicho Alma).
const IDS = {
  // Gestante / ensaio de gravidez
  gestante: [
    'photo-1519689680058-324335c77eba',
    'photo-1556711905-b3f402e1ff0f',
    'photo-1531983412531-1f49a365ffed',
    'photo-1490481651871-ab68de25d43d',
    'photo-1604881991720-f91add269bed',
    'photo-1606041008023-472dfb5e530f',
  ],
  // Newborn / recém-nascido
  newborn: [
    'photo-1492725764893-90b379c2b6e7',
    'photo-1555252333-9f8e92e65df9',
    'photo-1530281700549-e82e7bf110d6',
    'photo-1515488042361-ee00e0ddd4e4',
    'photo-1546015720-b8b30df5aa27',
    'photo-1544126592-807ade215a0b',
  ],
  // Acompanhamento do bebê / primeiro ano
  acompanhamento: [
    'photo-1503454537195-1dcabb73ffb9',
    'photo-1492138645164-7c2eb88c1d97',
    'photo-1607923432780-7a9c30adcb72',
    'photo-1476703993599-0035a21b17a9',
    'photo-1518621736915-f3b1c41bfd00',
  ],
  // Smash the cake / aniversário infantil
  smash: [
    'photo-1530103862676-de8c9debad1d',
    'photo-1464349095431-e9a21285b5f3',
    'photo-1513151233558-d860c5398176',
    'photo-1558636508-e0db3814bd1d',
    'photo-1559733329-cfd7e07b0696',
  ],
  // Família / lifestyle
  familia: [
    'photo-1511895426328-dc8714191300',
    'photo-1609220136736-443140cffec6',
    'photo-1476234251651-f353703a034d',
    'photo-1504439468489-c8920d796a29',
    'photo-1490725263030-1f0521cec8b1',
    'photo-1543342384-1f1350e27861',
  ],
  // Casal / Nós 1+1=3 (gestante + casal)
  casal: [
    'photo-1522673607200-164d1b6ce486',
    'photo-1518568814500-bf0f8d125f46',
    'photo-1469571486292-0ba58a3f068b',
    'photo-1583244532610-2a234e7c3f8e',
  ],
  // Retratos / corporativo
  retratos: [
    'photo-1438761681033-6461ffad8d80',
    'photo-1494790108377-be9c29b29330',
    'photo-1500648767791-00dcc994a43e',
    'photo-1534528741775-53994a69daeb',
  ],
  // fotos largas, boas para fundos/heros
  destaque: [
    'photo-1452587925148-ce544e77e70d',
    'photo-1606800052052-a08af7148866',
    'photo-1515488042361-ee00e0ddd4e4',
  ],
}

export function unsplashUrl(id, w = 800) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`
}

// Constrói lista de fotos reais por categoria
export function fotosReais(categoria, w = 800) {
  const ids = IDS[categoria] || []
  return ids.map((id, i) => ({
    id: `${categoria}-real-${i + 1}`,
    src: unsplashUrl(id, w),
    categoria,
    alt: `Ensaio ${categoria} — Alma Fotografia`,
  }))
}

export const UNSPLASH_IDS = IDS
