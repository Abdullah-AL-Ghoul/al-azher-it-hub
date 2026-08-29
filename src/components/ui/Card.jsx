export default function Card({
  children,
  className = '',
  hover = false,
  padded = true,
  ...props
}) {
  const base = hover ? 'glass glass-hover lift' : 'glass'
  const padding = padded ? 'p-5 sm:p-6' : ''
  return (
    <div className={`${base} ${padding} rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  )
}
