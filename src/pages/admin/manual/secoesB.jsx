import { Secao, P, Caixa, Passos, Print, Fluxo, MiniCliente } from './ManualUI'

export function SecaoClientesFunil() {
  return (
    <Secao id="clientes" titulo="Clientes e Funil de vendas" sub="A base do CRM e o caminho de cada negócio">
      <P>Em <strong className="text-cream-100">Clientes</strong> ficam todos os contatos — clientes ativos e leads. Cada um tem uma ficha com histórico de ensaios, total investido e botão de WhatsApp. Você adiciona, edita e busca clientes.</P>
      <P>O <strong className="text-cream-100">Funil de vendas</strong> é um quadro Kanban onde cada cliente passa pelas etapas: Novo lead → Orçamento → Agendado → Em produção → Entregue. Você arrasta os cartões entre as colunas.</P>
      <Print titulo="Funil de vendas (Kanban)">
        <div className="flex gap-2 overflow-x-auto">
          {[['Novo lead', 'bg-sand-300'], ['Orçamento', 'bg-clay-400'], ['Agendado', 'bg-terracotta-400'], ['Produção', 'bg-clay-500'], ['Entregue', 'bg-cocoa-600']].map(([nome, cor]) => (
            <div key={nome} className="w-32 shrink-0 rounded-xl bg-cocoa-900/50 p-2 ring-1 ring-cream-100/10">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] text-cream-100/70"><span className={'h-2 w-2 rounded-full ' + cor} /> {nome}</p>
              <div className="rounded-lg bg-cocoa-900 p-2 text-[10px] text-cream-100/60">cliente</div>
            </div>
          ))}
        </div>
      </Print>
      <Caixa tipo="dica" titulo="Clique no cartão do funil">
        Abre os detalhes contextuais: se for <strong>lead</strong>, mostra origem e notas; se for <strong>orçamento</strong>, você monta o orçamento item a item com total ao vivo; se <strong>agendado</strong>, vê data/local/pessoas; se <strong>produção</strong>, acompanha o progresso da edição.
      </Caixa>
      <Caixa tipo="costura" titulo="Conexões do Funil">
        O funil se move sozinho com os outros módulos: <strong>assinar um contrato</strong> move o lead para "Agendado"; <strong>entregar as fotos</strong> ou o <strong>workflow chegar em "Entrega"</strong> move para "Entregue". As tarefas e contratos ficam ligados ao cliente.
      </Caixa>
    </Secao>
  )
}

export function SecaoContratos() {
  return (
    <Secao id="contratos" titulo="Contratos e assinatura" sub="Do modelo ao aceite, tudo digital">
      <P>Crie contratos de 3 formas: a partir de um <strong className="text-cream-100">modelo</strong> pronto, <strong className="text-cream-100">do zero</strong> (escrevendo cada cláusula), ou fazendo <strong className="text-cream-100">upload de um PDF</strong> que o estúdio já tem. Depois, envie para o cliente assinar pelo celular.</P>
      <Print titulo="Contrato · enviar para assinatura">
        <div className="space-y-2">
          <MiniCliente inicial="E" nome="Eduardo & Camila" sub="Contrato de Casamento · R$ 1.490" grad="ph-gradient-3" tag="Assinado" />
          <div className="rounded-xl rounded-bl-sm bg-[#25D366]/10 p-3 text-xs text-cream-100/80 ring-1 ring-[#25D366]/20">📲 "Olá, Eduardo! Preparamos seu contrato. Abra o link e assine pelo celular: almafotografia.com.br/assinar/..."</div>
        </div>
      </Print>
      <Passos itens={[
        'Crie ou abra um contrato e clique em "Enviar por WhatsApp para assinatura".',
        'O sistema gera uma mensagem pronta com o telefone do cliente já preenchido e um link único.',
        'O cliente abre o link, lê as cláusulas e assina no dedo/mouse — direto pelo celular.',
        'A assinatura cai automaticamente no painel, e o contrato fica registrado como Assinado.',
      ]} />
      <Caixa tipo="costura" titulo="Conexões dos Contratos">
        Ao ser <strong>assinado</strong>, o contrato cria automaticamente uma <strong>Conta a receber</strong> (no valor do contrato, vencimento em 30 dias) e move o cliente no <strong>Funil</strong>. A assinatura digitalizada fica guardada no próprio contrato.
      </Caixa>
    </Secao>
  )
}

export function SecaoTarefas() {
  return (
    <Secao id="tarefas" titulo="Tarefas" sub="Nada esquecido, equipe organizada">
      <P>Lista de afazeres da equipe, com prazo, prioridade e o cliente relacionado. Você cria, edita e marca como concluída. Algumas tarefas já aparecem automaticamente, costuradas dos outros módulos (ex: "editar fotos da Joana").</P>
      <Print titulo="Tarefas">
        <div className="space-y-2">
          {[['Editar fotos selecionadas da Joana', 'Alta', 'atrasada'], ['Enviar orçamento para Fernanda', 'Alta', ''], ['Postar prévia no Instagram', 'Baixa', '']].map(([t, p, a]) => (
            <div key={t} className="flex items-center justify-between gap-2 rounded-xl bg-cocoa-900 p-3 ring-1 ring-cream-100/10">
              <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full ring-1 ring-cream-100/30" /><span className="text-xs text-cream-100/80">{t}</span></div>
              <div className="flex gap-1.5">{a && <span className="text-[10px] text-terracotta-400">⚠ {a}</span>}<span className="rounded-full bg-cream-100/10 px-2 py-0.5 text-[10px] text-cream-100/60">{p}</span></div>
            </div>
          ))}
        </div>
      </Print>
      <Caixa tipo="costura" titulo="Conexões das Tarefas">
        Cada tarefa pode estar <strong>ligada a um cliente</strong>. As atrasadas aparecem na <strong>Central de pendências</strong> da Visão geral. Você cria tarefas manuais ou elas surgem dos outros setores.
      </Caixa>
    </Secao>
  )
}

export function SecaoFinanceiro() {
  return (
    <Secao id="financeiro" titulo="Lançamentos e Financeiro" sub="Todo o dinheiro do estúdio, organizado">
      <P>Em <strong className="text-cream-100">Lançamentos</strong> você registra entradas (reservas, pacotes, fotos extras) e saídas (aluguel, material, produção). Cada lançamento tem categoria, data, status (pago/pendente) e pode ser ligado a um cliente. Filtre por tipo e marque pago com um clique (reversível).</P>
      <Print titulo="Lançamentos">
        <div className="space-y-1.5">
          {[['↑ Reserva — Eduardo', '+ R$ 300', 'clay'], ['↑ Saldo pacote — Joana', '+ R$ 690', 'clay'], ['↓ Aluguel do estúdio', '− R$ 1.200', 'gray']].map(([d, v, c]) => (
            <div key={d} className="flex items-center justify-between rounded-lg bg-cocoa-900 px-3 py-2 text-xs ring-1 ring-cream-100/10">
              <span className="text-cream-100/80">{d}</span>
              <span className={c === 'clay' ? 'text-clay-300' : 'text-cream-100/60'}>{v}</span>
            </div>
          ))}
        </div>
      </Print>
      <Caixa tipo="costura" titulo="Conexões do Financeiro">
        As <strong>reservas feitas no site</strong> entram aqui automaticamente. Quando você <strong>quita uma conta</strong> (a pagar/receber), ela vira um lançamento. Tudo que está aqui alimenta o <strong>Fluxo de caixa e o DRE</strong>.
      </Caixa>
    </Secao>
  )
}

export function SecaoContas() {
  return (
    <Secao id="contas" titulo="Contas a pagar e a receber" sub="Vencimentos sob controle">
      <P>Controle o que você tem a <strong className="text-cream-100">receber</strong> (saldos de clientes) e a <strong className="text-cream-100">pagar</strong> (despesas com vencimento). O sistema marca em vermelho as contas <strong className="text-cream-100">vencidas</strong>. Clique numa conta para ver detalhes, editar, ou marcar como paga/recebida (e desfazer se clicar errado).</P>
      <Print titulo="Contas a receber">
        <div className="space-y-1.5">
          {[['Saldo casamento — Eduardo', 'R$ 1.190', 'vence 18/06'], ['Saldo newborn — Helena', 'R$ 540', 'VENCIDA']].map(([d, v, s]) => (
            <div key={d} className="flex items-center justify-between rounded-lg bg-cocoa-900 px-3 py-2 text-xs ring-1 ring-cream-100/10">
              <div><p className="text-cream-100/80">{d}</p><p className={'text-[10px] ' + (s === 'VENCIDA' ? 'text-terracotta-400' : 'text-cream-100/40')}>{s}</p></div>
              <span className="text-clay-300">{v}</span>
            </div>
          ))}
        </div>
      </Print>
      <Caixa tipo="costura" titulo="Conexões das Contas">
        Contratos assinados geram contas a receber automaticamente. Ao <strong>quitar</strong> uma conta, ela vira lançamento no <strong>Financeiro</strong> (e some do fluxo de caixa como pendência, virando realizada). Contas vencidas aparecem na <strong>Central de pendências</strong>.
      </Caixa>
    </Secao>
  )
}

export function SecaoFluxoDRE() {
  return (
    <Secao id="fluxo" titulo="Fluxo de caixa e DRE" sub="A saúde financeira de relance">
      <P>O <strong className="text-cream-100">Fluxo de caixa</strong> mostra um gráfico de entradas vs saídas por mês. O <strong className="text-cream-100">DRE</strong> (Demonstrativo de Resultado) resume: receita bruta − despesas por categoria = lucro líquido, com a margem em %.</P>
      <Print titulo="Fluxo de caixa & DRE">
        <div className="flex items-end justify-around gap-3" style={{ height: '90px' }}>
          {[60, 45, 80, 50].map((h, i) => (
            <div key={i} className="flex flex-1 items-end justify-center gap-1" style={{ height: '100%' }}>
              <div className="w-1/2 rounded-t bg-clay-400" style={{ height: h + '%' }} />
              <div className="w-1/2 rounded-t bg-cocoa-700" style={{ height: (h - 20) + '%' }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-cream-100/40">entradas (claro) vs saídas (escuro)</p>
      </Print>
      <Caixa tipo="dica" titulo="Tudo é clicável (drill-down)">
        Clique numa barra de mês ou numa categoria do DRE para ver exatamente quais lançamentos formam aquele número.
      </Caixa>
      <Caixa tipo="costura" titulo="Conexões">
        O fluxo de caixa e o DRE são <strong>alimentados automaticamente</strong> por todos os lançamentos do Financeiro e pelas reservas do site. Não precisa digitar nada duas vezes — o que você registra em Lançamentos/Contas aparece aqui.
      </Caixa>
    </Secao>
  )
}

export function SecaoRelatorios() {
  return (
    <Secao id="relatorios" titulo="Relatórios" sub="Insights para crescer">
      <P>Dashboard de indicadores: receita por tipo de serviço, taxa de conversão do funil, ticket médio e clientes ativos. Ajuda a decidir onde investir e quais ensaios dão mais retorno.</P>
      <Print titulo="Relatórios">
        <div className="grid grid-cols-3 gap-2">
          {[['Receita', 'R$ 3.260'], ['Conversão', '67%'], ['Ticket médio', 'R$ 815']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-cocoa-900 p-3 ring-1 ring-cream-100/10"><p className="font-serif text-lg text-terracotta-400">{v}</p><p className="text-[10px] text-cream-100/50">{l}</p></div>
          ))}
        </div>
      </Print>
      <Caixa tipo="costura" titulo="Conexões dos Relatórios">
        Os relatórios <strong>leem os dados</strong> de Clientes, Funil e Financeiro em tempo real. Conforme você usa o painel, os números se atualizam sozinhos.
      </Caixa>
    </Secao>
  )
}

export function SecaoWhatsApp() {
  return (
    <Secao id="whatsapp" titulo="Integrações e WhatsApp" sub="Comunicação automática com o cliente">
      <P>O painel usa o WhatsApp do cliente (já cadastrado na ficha) para avisos automáticos em momentos-chave. No demonstrativo, a mensagem aparece pronta para você enviar; na versão final, é disparada automaticamente por API.</P>
      <Print titulo="Mensagens automáticas">
        <div className="space-y-2">
          {[['Ao iniciar edição', 'Estamos trabalhando nas suas fotos com muito carinho 💛'], ['Ao entregar', 'Suas fotos ficaram prontas! Acesse o site para baixar ✨'], ['Contrato', 'Abra o link e assine pelo celular']].map(([q, m]) => (
            <div key={q} className="rounded-xl rounded-bl-sm bg-[#25D366]/10 p-3 ring-1 ring-[#25D366]/20">
              <p className="text-[10px] uppercase tracking-wide text-[#25D366]">{q}</p>
              <p className="mt-0.5 text-xs text-cream-100/80">{m}</p>
            </div>
          ))}
        </div>
      </Print>
      <Caixa tipo="whatsapp" titulo="Quando o WhatsApp dispara">
        Ao <strong>iniciar a edição</strong> e ao <strong>liberar o download</strong> das fotos (na aba Seleções), e ao <strong>enviar um contrato</strong> para assinatura. O histórico de mensagens enviadas fica registrado na Visão geral.
      </Caixa>
      <Caixa tipo="atencao" titulo="O que precisa ser confirmado para a versão final">
        O envio 100% automático exige uma <strong>conta de API de WhatsApp</strong> (Z-API, Twilio ou similar) com o número oficial do estúdio. No demo, a mensagem é gerada e você envia manualmente. Isso é ativado na fase de produção.
      </Caixa>
    </Secao>
  )
}

export function SecaoCosturas() {
  return (
    <Secao id="costuras" titulo="Conexões entre os módulos" sub="O grande diferencial: tudo conversa entre si">
      <P>Aqui está o mapa das principais costuras — quando você faz uma ação, veja o que acontece sozinho no resto do sistema:</P>
      <div className="space-y-3">
        <Print titulo="Jornada completa de um cliente">
          <Fluxo vertical etapas={[
            { label: 'Lead chega (Clientes / Funil)', icone: '👋' },
            { label: 'Contrato assinado → cria conta a receber + move funil', icone: '✍️', destaque: true },
            { label: 'Agendamento (site → Agenda + Financeiro)', icone: '📅' },
            { label: 'Workflow: produção → entrega', icone: '🎬' },
            { label: 'Seleção de fotos (Área do Cliente)', icone: '🖼️' },
            { label: 'Iniciar edição → WhatsApp automático', icone: '🎨', destaque: true },
            { label: 'Liberar download → WhatsApp + move funil p/ Entregue', icone: '⬇️', destaque: true },
            { label: 'Conta quitada → vira lançamento → Fluxo de caixa / DRE', icone: '💰', destaque: true },
          ]} />
        </Print>
      </div>
      <Caixa tipo="costura" titulo="Resumo das costuras">
        <ul className="ml-4 list-disc space-y-1">
          <li>Reserva no site → Agenda + Financeiro</li>
          <li>Contrato assinado → Conta a receber + Funil</li>
          <li>Entregar fotos → WhatsApp + Funil "Entregue"</li>
          <li>Workflow "Entrega" → Funil "Entregue"</li>
          <li>Quitar conta → Lançamento → Fluxo de caixa + DRE</li>
          <li>Tudo → Visão geral (pendências) + Relatórios</li>
        </ul>
      </Caixa>
      <Caixa tipo="dica" titulo="Conclusão">
        Você nunca digita a mesma informação duas vezes. Uma ação num módulo se propaga para todos os outros. É isso que torna o painel mais rápido e completo que ferramentas separadas — e o que faz o estúdio economizar tempo todos os dias.
      </Caixa>
    </Secao>
  )
}
