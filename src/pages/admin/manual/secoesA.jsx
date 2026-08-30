import { Secao, P, Caixa, Passos, Print, Fluxo, MiniCliente } from './ManualUI'


export function SecaoIntro() {
  return (
    <Secao id="intro" titulo="Bem-vindo ao seu painel" sub="Manual de uso da plataforma Alma Fotografia">
      <P>Este painel reúne, num só lugar, tudo o que antes exigia quatro ferramentas separadas: a entrega e seleção de fotos, o site, a gestão de clientes (CRM) e o diagramador de álbuns. Tudo conversa entre si — quando você faz uma coisa num módulo, os outros se atualizam sozinhos. Chamamos isso de <strong className="text-cream-100">costuras</strong>, e elas são o grande diferencial.</P>
      <Caixa tipo="dica" titulo="Como usar este manual">
        Use o índice à esquerda para navegar. Cada seção explica <strong>o que o módulo faz</strong>, <strong>como usar</strong> e <strong>com o que ele se conecta</strong>. Os blocos com 🔗 mostram as costuras entre os módulos.
      </Caixa>
      <Print titulo="Painel · visão geral" legenda="O painel é dividido em 4 grupos: Operação, Vendas & CRM, Financeiro e Gestão.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['Operação', 'Visão, Seleções, Galerias, Portfólio, Notas fiscais, Agenda, Workflow, Diagramador'], ['Vendas & CRM', 'Clientes, Funil, Contratos, Tarefas'], ['Financeiro', 'Lançamentos, Contas, Fluxo de caixa & DRE'], ['Gestão', 'Relatórios, Equipe, Manual']].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-cocoa-900 p-3 ring-1 ring-cream-100/10">
              <p className="text-xs font-medium text-terracotta-400">{t}</p>
              <p className="mt-1 text-[11px] text-cream-100/50">{d}</p>
            </div>
          ))}
        </div>
      </Print>
    </Secao>
  )
}

export function SecaoVisao() {
  return (
    <Secao id="visao" titulo="Visão geral" sub="Seu centro de comando diário">
      <P>É a primeira tela ao entrar. Mostra os números do estúdio (recebido no mês, a receber, pedidos de contato vindos do site, ensaios ativos) e, no topo, a <strong className="text-cream-100">Central de pendências</strong> — tudo que precisa da sua atenção hoje.</P>
      <Print titulo="Visão geral · pendências">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-cream-100">⚠️ Precisa da sua atenção</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {['1 conta vencida', '2 tarefas atrasadas', '1 contrato aguardando assinatura', '1 seleção p/ iniciar edição'].map((t) => (
            <div key={t} className="rounded-xl bg-cocoa-950/60 px-3 py-2 text-xs text-cream-100/80">{t} →</div>
          ))}
        </div>
      </Print>
      <Caixa tipo="costura" titulo="Conexões da Visão geral">
        Cada item da Central de pendências é <strong>clicável</strong> e leva direto para o módulo certo: conta vencida → Contas; tarefa atrasada → Tarefas; contrato → Contratos; seleção → Seleções. Os números somam dados de TODOS os módulos em tempo real.
      </Caixa>
    </Secao>
  )
}

export function SecaoFotos() {
  return (
    <Secao id="fotos" titulo="Recebimento e envio de fotos" sub="O coração do trabalho: da entrega à seleção do cliente">
      <P>O fluxo das fotos tem 4 etapas, e o sistema acompanha cada uma com um status. O cliente entra na <strong className="text-cream-100">Área do Cliente</strong> com um código, vê suas fotos protegidas (sem poder baixar ou copiar), e seleciona as favoritas.</P>
      <Print titulo="Fluxo das fotos">
        <Fluxo etapas={[
          { label: 'Cliente escolhendo', icone: '🖼️', destaque: true },
          { label: 'Seleção recebida', icone: '✓' },
          { label: 'Em edição', icone: '🎨' },
          { label: 'Entregue', icone: '⬇️' },
        ]} />
      </Print>
      <Passos itens={[
        'O cliente acessa a Área do Cliente com o código da galeria (ex: SPHOR2026) e senha.',
        'Vê as fotos com marca d’água e proteção (download bloqueado nesta etapa).',
        'Seleciona as favoritas — o valor total vai somando ao vivo conforme passa do limite incluso no pacote.',
        'Ao confirmar, abre o pagamento do valor restante (PIX ou cartão). O cliente paga na hora ou escolhe pagar depois, pela Área do Cliente, em até 3 dias úteis.',
        'A seleção é enviada ao estúdio e aparece na aba Seleções do painel, com o status do pagamento.',
      ]} />
      <Caixa tipo="costura" titulo="O que a seleção conecta">
        Quando o cliente confirma a seleção, ela aparece na aba <strong>Seleções</strong> e o status muda. A partir daí você controla: <strong>Iniciar edição</strong> e depois <strong>Liberar download</strong>. Cada mudança dispara uma <strong>mensagem automática no WhatsApp</strong> do cliente (ver seção Integrações).
      </Caixa>
    </Secao>
  )
}

export function SecaoSelecoes() {
  return (
    <Secao id="selecoes" titulo="Seleções e exportação" sub="Gerencie a escolha de cada cliente e exporte para o Lightroom">
      <P>Na aba <strong className="text-cream-100">Seleções</strong>, você escolhe o cliente no seletor do topo e vê exatamente quais fotos ele escolheu, quantas são extras e o valor total do ensaio. É aqui que você comanda a produção.</P>
      <Print titulo="Seleções · controle da produção">
        <div className="space-y-2">
          <MiniCliente inicial="H" nome="Família Hoffmann" sub="28 fotos · Cliente escolhendo" grad="ph-gradient-2" tag="AO VIVO" />
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cocoa-800 px-3 py-1.5 text-xs text-cream-100/80">⬇️ Exportar lista p/ Lightroom</span>
            <span className="rounded-full bg-cream-100 px-3 py-1.5 text-xs text-cocoa-800">🎨 Iniciar edição</span>
          </div>
        </div>
      </Print>
      <Caixa tipo="dica" titulo="Exportação para o Lightroom">
        O botão <strong>"Exportar lista p/ Lightroom"</strong> gera um arquivo .txt com os nomes das fotos escolhidas. Você importa no filtro do Lightroom e edita só as selecionadas — sem procurar foto por foto. Funciona também no Windows Explorer e Mac Finder.
      </Caixa>
      <Caixa tipo="dica" titulo="Status de pagamento na tela">
        O painel de pagamento lista <strong>cada cobrança separadamente</strong>: o <strong>saldo do ensaio</strong> (valor combinado menos a entrada) e, quando o cliente escolhe mais fotos do que o pacote inclui, as <strong>fotos extras</strong>. Cada linha tem seu próprio botão de marcar recebido — e dá para desfazer se clicar errado. Assim você não vê "pago" enquanto as fotos extras seguem em aberto.
      </Caixa>
      <Caixa tipo="costura" titulo="Conexões das Seleções">
        Mudar o status aqui reflete na <strong>Visão geral</strong>, no <strong>Funil</strong> (ao entregar, o cliente vai para "Entregue") e dispara <strong>WhatsApp</strong> automático. As fotos extras viram base para cobrança em <strong>Contas a receber</strong>.
      </Caixa>
    </Secao>
  )
}

export function SecaoGalerias() {
  return (
    <Secao id="galerias" titulo="Galerias" sub="O espaço privado de cada cliente">
      <P>Cada cliente tem uma galeria própria, protegida por <strong className="text-cream-100">código e senha</strong>. É o "Alboom" do estúdio: aqui você cria a galeria, sobe as fotos e acompanha o que o cliente escolheu.</P>
      <P>A galeria tem <strong className="text-cream-100">duas abas</strong>: <em>Fotos p/ seleção</em> (as provas, com marca d'água) e <em>Entrega das fotos</em> (as finais editadas, sem marca).</P>
      <Caixa tipo="dica" titulo="Entrega em duas versões — sem trabalho dobrado">
        Você sobe <strong>só a foto em alta</strong>. Na hora de baixar, o cliente escolhe entre <strong>alta resolução</strong> (para guardar e imprimir) ou <strong>para redes sociais</strong> — e essa segunda versão é criada na hora, no navegador dele, com 2048px e cores prontas para o Instagram.
        <br /><br />
        É isso que evita aquela cor estranha quando o cliente publica: o Instagram recomprime foto grande demais e força o próprio perfil de cor. Entregando já no tamanho certo, ele quase não mexe na imagem.
      </Caixa>
      <Caixa tipo="dica" titulo="Deixar o cliente pagar pelo site">
        No topo da galeria existe um botão de <strong>liga/desliga</strong>. Ligado, o cliente pode pedir para pagar na hora em que envia a seleção, e você recebe o aviso para mandar o link. Desligado, ele só confirma a escolha e você recebe como sempre — maquininha ou PIX — lançando no financeiro.
        <br /><br />
        Deixe do jeito que fizer sentido para cada cliente. Não é obrigatório usar.
      </Caixa>
      <Caixa tipo="atencao" titulo="Galeria sem senha não abre">
        Por segurança, uma galeria sem senha definida <strong>não deixa ninguém entrar</strong> — antes bastava acertar o código. Defina a senha antes de avisar o cliente.
      </Caixa>
      <Print titulo="Galerias">
        <div className="grid grid-cols-3 gap-2">
          {[['Família Hoffmann', 'Newborn'], ['Eduardo & Camila', 'Casamento'], ['Joana', 'Família']].map(([n, e]) => (
            <div key={n} className="overflow-hidden rounded-lg ring-1 ring-cream-100/10">
              <div className="ph-gradient-2 h-12" />
              <div className="bg-cocoa-900 p-2"><p className="truncate text-[11px] text-cream-100">{n}</p><p className="text-[10px] text-cream-100/50">{e}</p></div>
            </div>
          ))}
        </div>
      </Print>
      <Passos itens={[
        'Clique em "Nova galeria" e informe o cliente, o ensaio e um código de acesso.',
        'Faça o upload das fotos do ensaio (na versão final, integrado ao armazenamento na nuvem).',
        'Compartilhe o código com o cliente — ele acessa pela Área do Cliente.',
        'Acompanhe aqui quais fotos ele selecionou (aparecem destacadas).',
      ]} />
      <Caixa tipo="costura" titulo="Conexões das Galerias">
        A galeria está ligada ao <strong>cliente</strong> (em Clientes) e às <strong>Seleções</strong>. O código de acesso da galeria é o mesmo que o cliente usa para entrar na Área do Cliente.
      </Caixa>
    </Secao>
  )
}

export function SecaoAgenda() {
  return (
    <Secao id="agenda" titulo="Agenda" sub="Os ensaios marcados, num calendário só">
      <P>O calendário mostra <strong className="text-cream-100">os ensaios que você marcou</strong> na ficha do cliente. Clique num dia para ver o que está agendado, com horário e nome de quem vai ser fotografado.</P>
      <P>Você também pode bloquear dias e definir o intervalo de descanso entre ensaios — isso serve de referência sua ao montar o dia.</P>
      <Print titulo="Agenda · calendário de disponibilidade">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className={'grid aspect-square place-items-center rounded text-[10px] ' + (i === 8 ? 'bg-terracotta-500 text-cream-50' : i % 7 === 0 ? 'bg-cocoa-950 text-cream-100/30 line-through' : 'bg-cocoa-800 text-cream-100/70')}>{i + 1}</div>
          ))}
        </div>
      </Print>
      <Caixa tipo="atencao" titulo="O site não marca mais horário">
        Por decisão do estúdio, o site deixou de oferecer marcação de data e hora — cada ensaio tem uma duração própria e fixar isso online dava confusão. Quem entra em contato pelo site vira um <strong>pedido de contato</strong> em Clientes, e <strong>a data quem marca é você</strong>, aqui ou na ficha do cliente.
      </Caixa>
      <Caixa tipo="costura" titulo="Conexões da Agenda">
        Todo ensaio com data preenchida aparece neste calendário automaticamente. Marcou a data na ficha do cliente? Já está aqui.
      </Caixa>
    </Secao>
  )
}

export function SecaoWorkflow() {
  return (
    <Secao id="workflow" titulo="Fluxo de trabalho" sub="Cada ensaio do briefing à entrega">
      <P>Acompanhe cada projeto pelas etapas de produção, com prazo e responsável. Você avança e volta etapas, e delega cada fase a um membro da equipe.</P>
      <Print titulo="Fluxo de trabalho · etapas">
        <Fluxo etapas={[
          { label: 'Briefing' }, { label: 'Ensaio' }, { label: 'Seleção', destaque: true }, { label: 'Edição' }, { label: 'Revisão' }, { label: 'Entrega' },
        ]} />
      </Print>
      <Caixa tipo="costura" titulo="Conexões do Workflow">
        Quando um projeto chega na etapa <strong>"Entrega"</strong>, o cliente é movido automaticamente para <strong>"Entregue" no Funil de vendas</strong>. Se você voltar a etapa, ele volta para "Em produção". Cada etapa pode ser <strong>delegada</strong> a um membro da Equipe.
      </Caixa>
    </Secao>
  )
}


export function SecaoPortfolio() {
  return (
    <Secao id="portfolio" titulo="Portfólio" sub="Os ensaios que aparecem no site, sob seu controle">
      <P>Na aba <strong className="text-cream-100">Portfólio</strong> você monta os ensaios que o público vê no site. Cada ensaio vira um card clicável na página de Portfólio e abre uma galeria própria com todas as fotos daquele trabalho. O painel já vem com um ensaio de cada categoria pronto para você editar.</P>
      <Print titulo="Portfólio · ensaios">
        <div className="grid grid-cols-3 gap-2">
          {[['Gestante', 'gestante'], ['Newborn', 'newborn'], ['Smash the Cake', 'smash']].map(([n, e]) => (
            <div key={n} className="overflow-hidden rounded-lg ring-1 ring-cream-100/10">
              <div className="ph-gradient h-12" />
              <div className="bg-cocoa-900 p-2"><p className="truncate text-[11px] text-cream-100">Ensaio {n}</p><p className="text-[10px] text-cream-100/50">{e}</p></div>
            </div>
          ))}
        </div>
      </Print>
      <Passos itens={[
        'Clique em "Adicionar ensaio" e informe título, subtítulo e categoria. A capa é a primeira foto — não precisa escolher.',
        'O ensaio aparece como card. Clique em "Fotos" e escolha os arquivos no seu computador: eles sobem direto para a nuvem.',
        'Use "Editar" para mudar os dados e "Ver página do ensaio" para conferir como ficou no site.',
        'No site, o visitante filtra por categoria, clica num card e vê o ensaio completo com lightbox.',
      ]} />
      <Caixa tipo="costura" titulo="Conexões do Portfólio">
        Os ensaios que você cria aqui aparecem direto na <strong>página de Portfólio do site</strong> e em cada <strong>página de ensaio</strong> própria. As categorias usam a mesma lista do site (Gestante, Newborn, Família, etc.), então tudo fica consistente.
      </Caixa>
      <Caixa tipo="dica" titulo="As fotos ficam na nuvem, não no seu navegador">
        O que você monta aqui é salvo no servidor: aparece para <strong>todo visitante do site</strong> e continua igual se você abrir o painel de outro computador. As imagens são reduzidas para 2000px antes de subir — o site carrega rápido e a qualidade continua ótima na tela.
      </Caixa>
      <Caixa tipo="dica" titulo="Atalho: aproveitar as favoritas de um ensaio">
        Em <strong>Seleções</strong>, quando você marca fotos como favoritas do fotógrafo, aparece a opção de <strong>levar para o portfólio</strong>. As fotos são copiadas sem marca d'água — é o caminho mais rápido de alimentar a vitrine com trabalho recém-entregue.
      </Caixa>
    </Secao>
  )
}

export function SecaoNotasFiscais() {
  return (
    <Secao id="notas" titulo="Notas fiscais" sub="Acompanhe as notas de serviço e de produto emitidas pelo site">
      <P>Na aba <strong className="text-cream-100">Notas fiscais</strong> você acompanha todas as notas emitidas: as de <strong>serviço (NFS-e)</strong>, dos ensaios, e as de <strong>produto (NF-e)</strong>, dos álbuns e quadros. Cada nota mostra cliente, valor, status e tem download de PDF/XML quando autorizada.</P>
      <Print titulo="Notas fiscais · lista">
        <div className="space-y-1.5">
          {[['Família Sphor', 'Ensaio Newborn', 'Autorizada', 'bg-emerald-500/15 text-emerald-300'], ['Patrícia Krever', 'Ensaio Gestante', 'Processando', 'bg-sky-500/15 text-sky-300'], ['Majoire Sphor', 'Quadro 30x45', 'Rejeitada', 'bg-terracotta-500/15 text-terracotta-300']].map(([n, d, st, cor]) => (
            <div key={n} className="flex items-center justify-between rounded-lg bg-cocoa-950/50 px-3 py-2">
              <div><p className="text-xs text-cream-100">{n}</p><p className="text-[10px] text-cream-100/50">{d}</p></div>
              <span className={'rounded-full px-2 py-0.5 text-[10px] ' + cor}>{st}</span>
            </div>
          ))}
        </div>
      </Print>
      <P>A nota do <strong className="text-cream-100">ensaio</strong> sai quando o cliente paga o valor restante. A nota do <strong className="text-cream-100">produto</strong> (álbum, quadro) sai quando você confirma o envio para produção — porque é feito sob medida.</P>
      <Passos itens={[
        'Filtre por tipo (NFS-e / NF-e), por status ou busque por cliente.',
        'Clique numa nota para ver os detalhes, baixar o PDF/XML e reenviar por e-mail.',
        'Nota com erro? O motivo aparece em destaque e você pode reemitir após corrigir.',
        'Nota autorizada pode ser cancelada (dentro do prazo legal), com justificativa.',
      ]} />
      <Caixa tipo="atencao" titulo="Cancelar nota x devolver dinheiro">
        São coisas separadas. Você pode <strong>cancelar uma nota</strong> (ex.: CPF digitado errado) sem que isso signifique reembolso. A reserva do agendamento não é reembolsável, e produtos personalizados só podem ser cancelados <strong>antes de entrar em produção</strong>.
      </Caixa>
      <Caixa tipo="costura" titulo="Conexões das Notas fiscais">
        A emissão é puxada do <strong>pagamento</strong> (em Seleções e na Área do Cliente). Cada item tem uma etiqueta — serviço ou produto — que decide o tipo de nota automaticamente. A integração real é feita pela <strong>Focus NFe</strong>; esta tela já está pronta para receber esses dados.
      </Caixa>
      <Caixa tipo="dica" titulo="Em construção">
        Esta área é a parte visual, já pronta. A emissão automática de verdade entra quando o backend de notas (Focus NFe) for conectado — sem mudar o que você vê aqui.
      </Caixa>
    </Secao>
  )
}
