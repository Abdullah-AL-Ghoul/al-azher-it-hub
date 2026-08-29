import { Component } from 'react'
import { motion } from 'framer-motion'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import ar from '../i18n/ar.json'
import en from '../i18n/en.json'

export default class ErrorBoundary extends Component {
 constructor(props) {
  super(props)
  this.state = { hasError: false, prefersReduced: false }
  this.prefersReduced = this.prefersReduced.bind(this)
 }

 prefersReduced() {
  this.setState({ prefersReduced: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches })
 }

 componentDidMount() {
  this.prefersReduced()
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', this.prefersReduced)
 }

 componentWillUnmount() {
  if (typeof window !== 'undefined') {
   const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
   mq.removeEventListener('change', this.prefersReduced)
  }
 }

 static getDerivedStateFromError() {
  return { hasError: true }
 }

 componentDidCatch(error, info) {
  console.error('ErrorBoundary:', error, info?.componentStack)
 }

 render() {
  const { lang = 'ar' } = this.props
  const isArabic = lang === 'ar'
  const t = isArabic ? ar : en

  if (this.state.hasError) {
   return (
    <div className="min-h-screen flex items-center justify-center bg-spatial-page px-4">
     <motion.div
      initial={this.state.prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={this.state.prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={this.state.prefersReduced ? {} : { duration: 0.5 }}
      className="glass rounded-2xl p-8 text-center max-w-md"
     >
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
       <FiAlertTriangle className="text-red-500" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-ink mb-2">
       {t.errorBoundary.title}
      </h1>
      <p className="text-slate-500 dark:text-white/50 mb-6">
       {t.errorBoundary.message}
      </p>
      <button
       onClick={() => window.location.reload()}
       className="inline-flex items-center gap-2 px-6 py-3 btn-spatial text-white rounded-xl font-semibold"
      >
       <FiRefreshCw size={18} /> {t.errorBoundary.retry}
      </button>
     </motion.div>
    </div>
   )
  }
  return this.props.children
 }
}
