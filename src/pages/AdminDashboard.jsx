import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { FiLayout, FiBook, FiVideo, FiLink, FiUsers, FiActivity, FiSettings, FiHome, FiClipboard } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import SiteLogo from '../components/shared/SiteLogo'

import { getCourses, getLectures, getSources, getUsers, getActivity, getAllStudentLogs, getAdditions, getStudyPlan, getRoadmap } from '../services'
import AdminDashboardContent from '../components/AdminDashboard/AdminDashboardContent'

const TABS = [
 { key: 'overview', icon: FiLayout, labelAr: 'ملخص', labelEn: 'Overview' },
 { key: 'courses', icon: FiBook, labelAr: 'المواد', labelEn: 'Courses' },
 { key: 'lectures', icon: FiVideo, labelAr: 'المحاضرات', labelEn: 'Lectures' },
 { key: 'sources', icon: FiLink, labelAr: 'المصادر', labelEn: 'Sources' },
 { key: 'users', icon: FiUsers, labelAr: 'الطلاب', labelEn: 'Students' },
 { key: 'studentLogs', icon: FiClipboard, labelAr: 'سجل الطلاب', labelEn: 'Student Logs' },
 { key: 'activity', icon: FiActivity, labelAr: 'الأنشطة', labelEn: 'Activity' },
 { key: 'settings', icon: FiSettings, labelAr: 'الإعدادات', labelEn: 'Settings' },
]

const TAB_DATA_MAP = {
 overview: ['courses', 'lectures', 'sources', 'users', 'studentLogs', 'activity', 'additions'],
 courses: ['courses'],
 lectures: ['lectures', 'courses'],
 sources: ['sources'],
 users: ['users'],
 studentLogs: ['studentLogs', 'users'],
 activity: ['activity'],
 settings: ['additions', 'studyPlan', 'roadmap'],
}

export default function AdminDashboard() {
 const { logout } = useAuth()
 const { lang } = useLanguage()
 const navigate = useNavigate()
 const isArabic = lang === 'ar'

 useEffect(() => {
  document.title = isArabic ? 'لوحة التحكم - AL-Azher IT Hub' : 'Dashboard - AL-Azher IT Hub'
 }, [isArabic])

 const [tab, setTab] = useState('overview')
 const [courses, setCourses] = useState([])
 const [lectures, setLectures] = useState([])
 const [sources, setSources] = useState([])
 const [users, setUsers] = useState([])
 const [activityLogs, setActivityLogs] = useState([])
 const [studentLogs, setStudentLogs] = useState([])
 const [additions, setAdditions] = useState([])
 const [studyPlan, setStudyPlan] = useState({})
 const [roadmap, setRoadmap] = useState([])
 const [loading, setLoading] = useState(false)
 const loadedTabs = useRef(new Set())
 const loadGeneration = useRef(0)
 const prefersReduced = useReducedMotion()

 const loadTabData = useCallback(async (tabKey, force = false) => {
  if (!force && loadedTabs.current.has(tabKey)) return
  
  loadGeneration.current += 1
  const generation = loadGeneration.current
  
  setLoading(true)
  try {
   const dataKeys = TAB_DATA_MAP[tabKey] || []
   
   const fetchers = {
    courses: getCourses,
    lectures: getLectures,
    sources: getSources,
    users: getUsers,
    activity: getActivity,
    studentLogs: getAllStudentLogs,
    additions: getAdditions,
    studyPlan: getStudyPlan,
    roadmap: getRoadmap,
   }

   const results = await Promise.allSettled(
    dataKeys.map(key => fetchers[key]())
   )

   if (generation !== loadGeneration.current) return

   const setters = {
    courses: setCourses,
    lectures: setLectures,
    sources: setSources,
    users: setUsers,
    activity: setActivityLogs,
    studentLogs: setStudentLogs,
    additions: setAdditions,
    studyPlan: setStudyPlan,
    roadmap: setRoadmap,
   }

   dataKeys.forEach((key, i) => {
    if (results[i].status === 'fulfilled') {
     setters[key](results[i].value)
    }
   })

   loadedTabs.current.add(tabKey)
  } catch (error) {
   if (generation !== loadGeneration.current) return
   toast.error(isArabic ? 'فشل تحميل البيانات' : 'Failed to load data')
  } finally {
   if (generation === loadGeneration.current) setLoading(false)
  }
 }, [isArabic])

 useEffect(() => {
  loadTabData(tab)
 }, [tab, loadTabData])

 const handleRefresh = useCallback(() => {
  loadedTabs.current.delete(tab)
  loadTabData(tab, true)
 }, [tab, loadTabData])

  return (
   <div className="relative min-h-screen bg-spatial-page grain">
   <div className="navbar-spatial sticky top-0 z-50 border-b border-black/5 dark:border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
       <SiteLogo size="sm" />
       <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 px-3 py-2 glass text-slate-600 dark:text-white/70 hover:text-navy-900 dark:hover:text-white rounded-xl text-sm font-medium transition"
       >
        <FiHome size={16} /> {isArabic ? 'الرئيسية' : 'Home'}
       </button>
       <h1 className="text-xl md:text-2xl font-bold gradient-text-spatial">{isArabic ? 'لوحة التحكم' : 'Admin Dashboard'}</h1>
      </div>
      <button
       onClick={logout}
       className="flex items-center gap-2 px-3 py-1.5 glass text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-medium transition"
      >
       <span>{isArabic ? 'تسجيل خروج' : 'Logout'}</span>
       <span aria-hidden="true">✕</span>
      </button>
     </div>
    </div>
   </div>

   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="flex items-center gap-2 mb-6 p-2 glass rounded-xl overflow-x-auto scrollbar-thin" role="tablist" aria-label={isArabic ? 'أقسام لوحة التحكم' : 'Dashboard tabs'}>
     {TABS.map(t => {
      const Icon = t.icon
      return (
       <button
        key={t.key}
        id={`tab-${t.key}`}
        onClick={() => setTab(t.key)}
        role="tab"
        aria-selected={tab === t.key}
        aria-controls={`panel-${t.key}`}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap shrink-0 ${
         tab === t.key ? 'btn-spatial text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'
        }`}
       >
        <Icon size={16} /> {isArabic ? t.labelAr : t.labelEn}
       </button>
      )
     })}
    </div>

    <AnimatePresence mode="wait">
     <motion.div
      key={tab}
      role="tabpanel"
      id={`panel-${tab}`}
      aria-labelledby={`tab-${tab}`}
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={prefersReduced ? {} : { duration: 0.3 }}
     >
      <AdminDashboardContent
       courses={courses}
       lectures={lectures}
       sources={sources}
       users={users}
       activityLogs={activityLogs}
       studentLogs={studentLogs}
       additions={additions}
       studyPlan={studyPlan}
       roadmap={roadmap}
       loading={loading}
       isArabic={isArabic}
       selectedTab={tab}
       onRefresh={handleRefresh}
       onNavigate={setTab}
      />
     </motion.div>
    </AnimatePresence>
   </div>
  </div>
 )
}
