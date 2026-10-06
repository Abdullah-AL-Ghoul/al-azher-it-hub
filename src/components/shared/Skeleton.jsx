/**
 * Shimmer placeholder used for loading states across pages.
 * className controls shape/size (e.g. "h-40 w-full rounded-xl").
 */
export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}