import { motion, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'

export default function AuthLayout({ children, isArabic, onBack }) {
 const prefersReduced = useReducedMotion()

  return (
   <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-spatial-full px-4 py-8">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
     <div className="absolute inset-0 spatial-grid opacity-[0.28]" />
     <div className="absolute -top-24 -left-24 w-80 h-80 bg-royal-500/[0.08] rounded-full blur-[42px] animate-orb-float-1" />
     <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-cyan-400/[0.07] rounded-full blur-[48px] animate-orb-float-2" />
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] bg-violet-500/[0.05] rounded-full blur-[56px] animate-orb-float-3" />
    </div>

    <div className="absolute inset-0 bg-[radial-gradient(ellipse_800px_520px_at_50%_-10%,rgba(37,99,235,0.07),transparent_60%)] pointer-events-none" />

    <motion.div
     className="relative z-10 w-full max-w-md"
    >
     <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 28, scale: 0.97 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
      transition={prefersReduced ? {} : { duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
     >
      <div className="absolute -inset-[1px] rounded-[28px] opacity-40 blur-[0.5px]" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.55) 0%, rgba(37,99,235,0.45) 50%, rgba(168,85,247,0.35) 100%)' }} />
      <div className="absolute -inset-6 bg-gradient-to-br from-royal-500/10 via-transparent to-cyan-400/10 rounded-[32px] blur-xl pointer-events-none" />

      <div className="relative glass rounded-[28px] p-7 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.04)_inset] overflow-hidden">
       <div className="pointer-events-none absolute inset-0 rounded-[28px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.55), transparent 22%)', opacity: 0.5 }} />
       <div className="relative">
        {children}
       </div>
      </div>
     </motion.div>

    <motion.div
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ delay: 1.1 }}
     className="text-center mt-5"
    >
     <button onClick={onBack} className="text-slate-500 dark:text-white/60 hover:text-slate-600 dark:hover:text-white/90 text-sm transition-colors flex items-center gap-1.5 mx-auto group">
      <motion.span className="group-hover:-translate-x-1 transition-transform">
       {isArabic ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
      </motion.span>
      {isArabic ? 'العودة' : 'Back'}
     </button>
    </motion.div>
   </motion.div>

   <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.5 }}
    className="absolute bottom-6 text-center text-slate-500 dark:text-white/60 text-xs"
   >
    AL-Azher IT Hub © {new Date().getFullYear()}
   </motion.div>
  </div>
 )
}
