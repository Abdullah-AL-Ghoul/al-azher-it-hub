import { memo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const particlesArr = Array.from({ length: 6 }, (_, i) => ({
 id: i,
 x: Math.random() * 100,
 y: Math.random() * 100,
 size: Math.random() * 2 + 1,
 opacity: Math.random() * 0.15 + 0.03,
 duration: Math.random() * 15 + 10,
 delay: Math.random() * 5,
}))

function SpatialBackground() {
 const { scrollYProgress } = useScroll()
 const y1 = useTransform(scrollYProgress, [0, 1], [0, -60])

 return (
  <div className="spatial-bg" aria-hidden="true">
   <motion.div style={{ y: y1 }} className="absolute inset-0 overflow-hidden will-change-transform">
    <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-royal-500/[0.07] blur-[32px] animate-orb-float-1 will-change-transform" />
    <div className="absolute top-[60%] right-[10%] w-[320px] h-[320px] rounded-full bg-cyan-400/[0.05] blur-[28px] animate-orb-float-2 will-change-transform" />
    <div className="absolute top-[40%] left-[50%] w-[280px] h-[280px] rounded-full bg-violet-500/[0.04] blur-[24px] animate-orb-float-3 will-change-transform" />
   </motion.div>

   <div className="absolute inset-0" style={{ perspective: '600px' }}>
    {particlesArr.map(p => (
     <div
      key={p.id}
      className="absolute rounded-full bg-white will-change-transform"
      style={{
       left: `${p.x}%`,
       top: `${p.y}%`,
       width: `${p.size}px`,
       height: `${p.size}px`,
       opacity: p.opacity,
       animation: `spatialDrift ${p.duration}s ease-in-out ${p.delay}s infinite`,
      }}
     />
    ))}
   </div>
  </div>
 )
}

export default memo(SpatialBackground)
