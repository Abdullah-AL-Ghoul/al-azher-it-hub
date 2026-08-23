import { memo } from 'react'

function SkeletonRow({ count = 5, widths = ['60%'] }) {
 return (
  <div className="space-y-3" aria-busy="true" role="status">
   {[...Array(count)].map((_, i) => (
    <div key={i} className="glass rounded-xl p-4 border border-white/10">
     <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
     {widths.map((w, j) => (
      <div key={j} className="h-3 bg-slate-200 dark:bg-slate-600 rounded mt-2" style={{ width: w }} />
     ))}
    </div>
   ))}
  </div>
 )
}

export default memo(SkeletonRow)
