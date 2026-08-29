export default function Spinner({ size = 'md', className = '' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size] || 'w-6 h-6'
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block ${sizeClass} border-2 border-royal-500/20 border-t-royal-500 rounded-full animate-spin ${className}`}
    />
  )
}
