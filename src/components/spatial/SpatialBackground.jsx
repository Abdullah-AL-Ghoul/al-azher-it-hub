import { memo } from 'react'

function SpatialBackground() {
 return (
  <div className="spatial-bg" aria-hidden="true">
   <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-royal-500/[0.07] blur-[32px]" />
   <div className="absolute top-[60%] right-[10%] w-[320px] h-[320px] rounded-full bg-cyan-400/[0.05] blur-[28px]" />
   <div className="absolute top-[40%] left-[50%] w-[280px] h-[280px] rounded-full bg-violet-500/[0.04] blur-[24px]" />
  </div>
 )
}

export default memo(SpatialBackground)
