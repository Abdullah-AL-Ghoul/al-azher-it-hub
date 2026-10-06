import { memo } from 'react'

// Layered atmosphere: drifting blurred orbs (orb-float tokens) over an
// aurora gradient that slowly shifts. Pure CSS animation — no JS per frame.
// Reduced-motion freezes everything via the global media query.
function SpatialBackground() {
 return (
  <div className="spatial-bg" aria-hidden="true">
   <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-royal-500/[0.09] blur-[64px] animate-orb-float-1" />
   <div className="absolute top-[55%] right-[8%] w-[360px] h-[360px] rounded-full bg-cyan-400/[0.07] blur-[56px] animate-orb-float-2" />
   <div className="absolute top-[35%] left-[45%] w-[300px] h-[300px] rounded-full bg-violet-500/[0.06] blur-[48px] animate-orb-float-3" />
   <div className="absolute top-[70%] left-[20%] w-[260px] h-[260px] rounded-full bg-emerald-400/[0.04] blur-[44px] animate-orb-float-2" />
   <div
    className="absolute -inset-[12%] animate-aurora-shift opacity-70 will-change-transform"
    style={{
     background:
      'linear-gradient(120deg, transparent 20%, rgba(37,99,235,0.05) 40%, rgba(6,182,212,0.04) 60%, transparent 80%)',
     backgroundSize: '200% 200%',
    }}
   />
  </div>
 )
}

export default memo(SpatialBackground)
