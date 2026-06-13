// =====================================================================
//  CONTEÚDO CENTRAL DA ALMA FOTOGRAFIA
//  Tudo que é "texto/dado do cliente" mora aqui. Quando o estúdio
//  passar o conteúdo real, basta editar este arquivo.
//  Dados extraídos do Instagram (@alma.fotografia), Facebook e
//  Google (5,0★ · 112 avaliações).
// =====================================================================

export const STUDIO = {
  nome: 'Alma Fotografia',
  tagline: 'Há 10 anos transformando afeto em memória que fica para sempre.',
  subTagline: 'Estúdio especialista em materno-infantil.',
  cidade: 'Boa Vista do Buricá',
  estado: 'RS',
  endereco: 'Av. Farrapos, 560 — Centro, Boa Vista do Buricá · RS',
  cep: '98918-000',
  telefone: '(55) 98449-0509',
  whatsapp: '5598449-0509',
  whatsappDisplay: '(55) 98449-0509',
  email: 'contato@almafotografia.com.br',
  instagram: 'https://www.instagram.com/alma.fotografia/',
  instagramHandle: '@alma.fotografia',
  facebook: 'https://www.facebook.com/fotografiaalma/',
  seguidores: '12,8 mil',
  anos: '10',
  ensaios: '+2.000',
  // Avaliações Google
  googleNota: '5,0',
  googleQtd: '112',
  googleLink: 'https://www.google.com/maps/place/ALMA+FOTOGRAFIA',
  // Coordenadas aproximadas de Boa Vista do Buricá/RS para o mapa
  mapsEmbed:
    'https://www.google.com/maps?q=Av.+Farrapos,+560+-+Centro,+Boa+Vista+do+Buric%C3%A1+-+RS&output=embed',
  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=Av.+Farrapos+560+Boa+Vista+do+Buric%C3%A1+RS',
}

// --- Serviços / tipos de ensaio (nicho materno-infantil) -------------
export const SERVICOS = [
  {
    id: 'gestante',
    foto: '/fotos/gestanteok.png',
    fw: 1066,
    fh: 1600,
    nome: 'Gestar',
    resumo: 'A beleza única da espera, eternizada com delicadeza.',
    descricao:
      'Ensaio gestante em estúdio ou ao ar livre, conduzido com leveza e olhar afetivo. Celebramos essa fase tão especial com cenários cuidadosamente pensados, figurinos e toda a sensibilidade que esse momento merece.',
    icon: 'Flower2',
    gradient: 'ph-gradient-2',
    tags: ['Estúdio ou externo', 'Figurinos inclusos', 'Direção afetiva'],
  },
  {
    id: 'newborn',
    foto: '/fotos/newborn.jpg',
    fw: 1280,
    fh: 1600,
    nome: 'Newborn',
    resumo: 'Os primeiros dias, registrados com segurança e amor.',
    descricao:
      'Realizado nos primeiros 5 a 15 dias de vida, em ambiente aquecido e seguro, com props artesanais e todo o cuidado com o bebê. Aqui, a gente não fotografa só crianças — a gente cuida delas.',
    icon: 'Baby',
    gradient: 'ph-gradient-4',
    tags: ['Estúdio aquecido', 'Props exclusivas', 'Segurança total'],
  },
  {
    id: 'acompanhamento',
    foto: '/fotos/acompanhamento.jpg',
    fw: 1600,
    fh: 1158,
    nome: 'Acompanhamento',
    resumo: 'Cada fase do primeiro ano, guardada mês a mês.',
    descricao:
      'Acompanhamos o crescimento do bebê ao longo do primeiro ano com ensaios em momentos-chave do desenvolvimento. Uma linha do tempo afetiva: do recém-nascido ao primeiro sorriso, dos primeiros passos ao smash the cake.',
    icon: 'Sprout',
    gradient: 'ph-gradient-2',
    tags: ['Primeiro ano', 'Marcos do bebê', 'Linha do tempo'],
  },
  {
    id: 'smash',
    foto: '/fotos/smash.jpg',
    fw: 1158,
    fh: 1600,
    nome: 'Smash the Cake',
    resumo: 'A festa do primeiro aninho, com muito sorriso e bagunça.',
    descricao:
      'O ensaio mais divertido! Cenário temático personalizado, bolo e toda a liberdade para o aniversariante explorar, lambuzar e sorrir. Paciência e carinho com cada criança, do começo ao fim.',
    icon: 'Cake',
    gradient: 'ph-gradient-4',
    tags: ['Cenário temático', 'Bolo incluso', 'Diversão garantida'],
  },
  {
    id: 'familia',
    foto: '/fotos/familia.jpg',
    fw: 1600,
    fh: 1158,
    nome: 'Família',
    resumo: 'O amor que une vocês, em imagens cheias de verdade.',
    descricao:
      'Ensaios em estúdio ou ao ar livre que capturam a conexão real entre quem você ama. Conduzimos com leveza para que as fotos sejam espontâneas — momentos verdadeiros, sem poses forçadas.',
    icon: 'Users',
    gradient: 'ph-gradient',
    tags: ['Estúdio ou externo', 'Momentos reais', 'Direção leve'],
  },
  {
    id: 'casal',
    foto: '/fotos/gestante.jpeg',
    fw: 1280,
    fh: 1600,
    nome: 'Nós 1+1=3',
    resumo: 'De casal a família, a história começa antes do bebê chegar.',
    descricao:
      'Um ensaio que une o casal e a chegada do novo integrante. Da gestante ao recém-nascido, contamos o capítulo mais lindo de vocês com sensibilidade e afeto em cada quadro.',
    icon: 'Heart',
    gradient: 'ph-gradient-4',
    tags: ['Casal & bebê', 'Narrativa afetiva', 'Momento único'],
  },
  {
    id: 'lifestyle',
    nome: 'Memórias Reais',
    foto: '/fotos/2.jpg',
    resumo: 'A vida real, sem pose — só o cotidiano que importa.',
    descricao:
      'Ensaios documentais no conforto da sua casa ou em locação especial. Registramos o dia a dia, os detalhes e a rotina afetiva da sua família com um olhar natural e espontâneo.',
    icon: 'Home',
    gradient: 'ph-gradient',
    tags: ['Na sua casa', 'Documental', 'Espontâneo'],
  },
  {
    id: 'corporativo',
    nome: 'Corporativo',
    resumo: 'A imagem profissional que o seu negócio merece.',
    descricao:
      'Retratos de equipe, headshots, fotos de ambiente e produto. Padronização visual para fortalecer a presença da sua marca com consistência e bom gosto.',
    icon: 'Briefcase',
    gradient: 'ph-gradient-3',
    tags: ['Headshots', 'Equipe', 'Ambiente & produto'],
  },
]

// --- Pacotes ---------------------------------------------------------
export const PACOTES = [
  {
    id: 'pocket',
    nome: 'Pocket Especial',
    ideal: 'Gestante, família & feminino',
    preco: 600,
    reserva: 150,
    destaque: false,
    selo: 'Vagas limitadas',
    inclui: [
      '1 hora de ensaio',
      '1 look — o que te faz sentir linda',
      'Cenário exclusivo, leve e atemporal',
      'Direção completa em cada pose',
      'Para gestantes, famílias e feminino',
      '8 fotos digitais tratadas',
    ],
    fotosInclusas: 8,
    fotoExtra: 35,
    // tipo fiscal p/ emissão de nota: 'servico' = NFS-e
    tipo_fiscal: 'servico',
  },
  {
    id: 'memorias',
    nome: 'Memórias',
    ideal: 'Newborn, smash & acompanhamento',
    preco: 890,
    reserva: 200,
    destaque: true,
    inclui: [
      '2 horas de ensaio',
      'Estúdio aquecido ou locação externa',
      'Cenário temático personalizado',
      '15 fotos digitais tratadas',
      'Galeria online com seleção',
      '5 fotos impressas 15x21',
      'Entrega em até 15 dias',
    ],
    fotosInclusas: 15,
    fotoExtra: 30,
    // tipo fiscal p/ emissão de nota: 'servico' = NFS-e
    tipo_fiscal: 'servico',
  },
  {
    id: 'experiencia',
    nome: 'Experiência Alma',
    ideal: 'Acompanhamento 1º ano & família',
    preco: 1690,
    reserva: 350,
    destaque: false,
    inclui: [
      'Sessão completa, sem limite de tempo',
      'Cenários e figurinos exclusivos',
      '40 fotos digitais tratadas',
      'Galeria online com seleção',
      'Álbum encadernado premium 20x30',
      'Acompanhamento do bebê no 1º ano',
      'Entrega prioritária em 10 dias',
    ],
    fotosInclusas: 40,
    fotoExtra: 25,
    // tipo fiscal p/ emissão de nota: 'servico' = NFS-e
    tipo_fiscal: 'servico',
  },
]

// --- PRODUTOS físicos personalizados (álbuns, quadros, impressos) -----
// Vendidos como adicional ao ensaio. tipo_fiscal: 'produto' => NF-e.
// 'personalizado: true' => cancelável só ATÉ a produção começar.
export const PRODUTOS = [
  {
    id: 'album-20x30',
    nome: 'Álbum encadernado premium 20x30',
    descricao: 'Álbum fine art, capa personalizada, até 20 lâminas.',
    preco: 690,
    tipo_fiscal: 'produto',
    personalizado: true,
  },
  {
    id: 'quadro-30x45',
    nome: 'Quadro em metacrilato 30x45',
    descricao: 'Sua foto favorita em acabamento de galeria.',
    preco: 320,
    tipo_fiscal: 'produto',
    personalizado: true,
  },
  {
    id: 'caixa-impressas',
    nome: 'Caixa com 20 fotos impressas 15x21',
    descricao: 'Fotos em papel fotográfico, caixa de presente.',
    preco: 180,
    tipo_fiscal: 'produto',
    personalizado: true,
  },
]

// --- Como funciona / processo ----------------------------------------
export const PROCESSO = [
  {
    n: '01',
    titulo: 'Conversa & escolha',
    texto:
      'Você escolhe o ensaio, conta o que imagina e a gente alinha cada detalhe. Tudo começa entendendo a sua história e o momento que vocês vivem.',
    icon: 'MessageCircle',
  },
  {
    n: '02',
    titulo: 'Agendamento & reserva',
    texto:
      'Reserve a data direto pelo site e garanta seu horário com o pagamento da reserva. Simples, rápido e seguro.',
    icon: 'CalendarCheck',
  },
  {
    n: '03',
    titulo: 'O grande dia',
    texto:
      'No ensaio, conduzimos com leveza, paciência e carinho — especialmente com as crianças. Sem pressa, só momentos reais e muito afeto.',
    icon: 'Camera',
  },
  {
    n: '04',
    titulo: 'Seleção das fotos',
    texto:
      'Você recebe acesso à sua galeria privada e escolhe suas favoritas com calma, vendo o valor de cada foto extra em tempo real.',
    icon: 'ImageDown',
  },
  {
    n: '05',
    titulo: 'Tratamento & entrega',
    texto:
      'Tratamos cada imagem escolhida com todo o cuidado e disponibilizamos tudo pronto para download na sua área de cliente.',
    icon: 'Sparkles',
  },
]

// --- Depoimentos (REAIS — Google, 5,0★) ------------------------------
export const DEPOIMENTOS = [
  {
    nome: 'Majoire Sphor',
    servico: 'Ensaio em família',
    texto:
      'ALMA, vocês são incríveis. Poder viver essa magia com o nosso filho foi sensacional, a gente volta a ser criança por um instante, e a ALMA com toda a sua leveza e carinho transformou esse dia em algo inesquecível. Vocês são demais 🤍',
    nota: 5,
  },
  {
    nome: 'Patrícia Krever',
    servico: 'Ensaio de família',
    texto:
      'O ensaio com a Alma foi maravilhoso, uma experiência que com certeza ficará na memória de toda família. Foi um dia leve, descontraído e cheio de carinho! Obrigado por captarem a nossa essência e eternizar esse momento!',
    nota: 5,
  },
  {
    nome: 'Daniela Schroter De Alves',
    servico: 'Ensaio Alma',
    texto:
      'Trabalho incrível! Profissionais autênticos, ficamos muito à vontade! Uma experiência linda e divertida! Amor em forma de lembranças ❤️',
    nota: 5,
  },
  {
    nome: 'Família Alma',
    servico: 'Acompanhamento do bebê',
    texto:
      'Muito atenciosos, espaço aconchegante e fotos lindas! Gratos e já ansiosos pelo próximo encontro com a família Alma 💕',
    nota: 5,
  },
  {
    nome: 'Cliente Alma',
    servico: 'Newborn',
    texto:
      'Excelente trabalho, parabéns equipe 👏 vocês são nota mil! Cada detalhe pensado com tanto cuidado e carinho. Recomendo de olhos fechados.',
    nota: 5,
  },
  {
    nome: 'Mamãe de primeira viagem',
    servico: 'Gestante & Newborn',
    texto:
      'Foi tudo perfeito do começo ao fim. A paciência com o bebê, o acolhimento, a delicadeza... saímos com o coração cheio e fotos que vamos guardar pra vida toda.',
    nota: 5,
  },
]
// --- A ALMA: Aline, Maurício e o estúdio (essência) ------------------
export const ESSENCIA = {
  titulo: 'Quem somos nós?',
  texto: [
    'Dois corações que acreditam profundamente no poder das memórias, e que colocam alma em tudo o que fazem.',
    'Um estúdio que acredita que fotografar é muito mais do que apertar um botão: é acolher, sentir, registrar e entregar memórias que permanecem.',
    'Seja gestante, newborn, acompanhamento, corporativo ou campanhas especiais… cada história que passa por aqui se torna parte da nossa também.',
  ],
  boasVindas: ['Seja bem-vindo(a) à nossa essência.', 'Seja bem-vindo(a) à Alma.'],
}

export const EQUIPE = [
  {
    nome: 'Aline Kochem',
    funcao: 'CEO e Mentora',
    iniciais: 'AL',
    foto: '/fotos/aline.jpg',
    bio: 'Aline é o coração e a estratégia da Alma: mentora e CEO, empreendendo há mais de 10 anos. É quem sonha, planeja e faz cada campanha acontecer com propósito e sensibilidade. Designer de moda e professora de Hatha Yoga, ela traz leveza, arte e equilíbrio pra cada detalhe.',
    gradient: 'ph-gradient-4',
  },
  {
    nome: 'Maurício Diesel',
    funcao: 'Fotógrafo, Gestor e Editor',
    iniciais: 'MA',
    foto: '/fotos/mauricio.jpg',
    bio: 'Maurício é o olhar criativo por trás das lentes: fotógrafo há mais de 15 anos, publicitário, gestor e editor. É ele quem transforma momentos em imagens cheias de vida, emoção e verdade.',
    gradient: 'ph-gradient-2',
  },
  {
    nome: 'A Alma',
    funcao: 'AL (Aline) + MA (Maurício)',
    iniciais: 'AL·MA',
    foto: '/fotos/almamauricioealine.jpg',
    bio: 'Juntos, criamos a Alma Fotografia: um estúdio que vai muito além de fotos. Aqui, cada ensaio é uma experiência guiada, sensível e feita para eternizar histórias com significado.',
    gradient: 'ph-gradient',
    eOEstudio: true,
  },
]

// --- Categorias de portfólio -----------------------------------------
export const CATEGORIAS_PORTFOLIO = [
  { id: 'todos', nome: 'Todos' },
  { id: 'gestante', nome: 'Gestante' },
  { id: 'newborn', nome: 'Newborn' },
  { id: 'acompanhamento', nome: 'Acompanhamento' },
  { id: 'smash', nome: 'Smash the Cake' },
  { id: 'familia', nome: 'Família' },
  { id: 'casal', nome: 'Nós 1+1=3' },
]
