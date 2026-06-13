// Selo de assinatura "JV WEB STUDIO" reutilizável.
// variant: 'light' (sobre fundo escuro) | 'dark' (sobre fundo claro)
export default function AssinaturaJV({ variant = 'dark', className = '' }) {
  const base =
    variant === 'light'
      ? 'text-cream-100/40 hover:text-cream-100'
      : 'text-cocoa-400 hover:text-cocoa-700'
  const name =
    variant === 'light'
      ? 'text-sand-200 hover:text-cream-100'
      : 'text-clay-500 hover:text-terracotta-500'
  return (
    <p className={`text-center text-xs ${base} transition-colors ${className}`}>
      Desenvolvido por{' '}
      <a
        href="https://www.jvwebstudio.agency"
        target="_blank"
        rel="noreferrer"
        className={`font-medium link-underline ${name}`}
      >
        JV WEB STUDIO
      </a>
    </p>
  )
}
