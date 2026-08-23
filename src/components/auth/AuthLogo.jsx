import { motion } from 'framer-motion'
import TypewriterText from '../shared/TypewriterText'
import SiteLogo from '../shared/SiteLogo'

export default function AuthLogo({ title, subtitle, isArabic }) {
 return (
  <motion.div
   initial={{ opacity: 0, scale: 0.5, y: -20 }}
   animate={{ opacity: 1, scale: 1, y: 0 }}
   transition={{ delay: 0.2, duration: 0.6, type: 'spring', damping: 12 }}
   className="text-center mb-8 relative z-10"
  >
   <div className="mx-auto mb-5">
    <SiteLogo size="md" />
   </div>
   <h1 className="text-2xl md:text-3xl font-bold text-navy-900 dark:text-white mb-2">
    {title}
   </h1>
   <p className="text-slate-500 dark:text-white/60 text-sm">
    <TypewriterText
     text={subtitle}
     delay={800}
    />
   </p>
  </motion.div>
 )
}
