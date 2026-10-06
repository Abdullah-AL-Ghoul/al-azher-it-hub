
import { matchPath } from 'react-router-dom'
import { lazyWithRecovery } from '../utils/lazyRecovery'

const WelcomeGate = lazyWithRecovery(() => import('../pages/WelcomeGate'))
const Login = lazyWithRecovery(() => import('../pages/Login'))
const Signup = lazyWithRecovery(() => import('../pages/Signup'))
const ForgotPassword = lazyWithRecovery(() => import('../pages/ForgotPassword'))
const ResetPassword = lazyWithRecovery(() => import('../pages/ResetPassword'))
const Home = lazyWithRecovery(() => import('../pages/Home'))
const Lectures = lazyWithRecovery(() => import('../pages/Lectures'))
const LectureDetail = lazyWithRecovery(() => import('../pages/LectureDetail'))
const Sources = lazyWithRecovery(() => import('../pages/Sources'))
const StudyPlan = lazyWithRecovery(() => import('../pages/StudyPlan'))
const Additions = lazyWithRecovery(() => import('../pages/Additions'))
const Contact = lazyWithRecovery(() => import('../pages/Contact'))
const AdminDashboard = lazyWithRecovery(() => import('../pages/AdminDashboard'))
const Profile = lazyWithRecovery(() => import('../pages/Profile'))
const CourseRoadmap = lazyWithRecovery(() => import('../pages/CourseRoadmap'))
const NotFound = lazyWithRecovery(() => import('../pages/NotFound'))

/**
 * Single source of truth for the app's route table.
 *
 * @typedef {Object} AppRoute
 * @property {string} path React Router path ('*' = catch-all)
 * @property {import('react').ComponentType} [Component] Lazy page component
 * @property {boolean} [protected] Requires an authenticated user
 * @property {boolean} [adminOnly] Requires an admin (implies protected)
 * @property {boolean} [bare] Rendered without the Navbar/Footer shell
 * @property {string} [redirect] Legacy redirect target; takes precedence over Component
 *
 * @type {AppRoute[]}
 */
export const APP_ROUTES = [
  // Bare (no shell): welcome gate + auth pages
  { path: '/', Component: WelcomeGate, bare: true },
  { path: '/login', Component: Login, bare: true },
  { path: '/signup', Component: Signup, bare: true },
  { path: '/forgot-password', Component: ForgotPassword, bare: true },
  { path: '/reset-password', Component: ResetPassword, bare: true },

  // Protected student area
  { path: '/home', Component: Home, protected: true },
  { path: '/lectures', Component: Lectures, protected: true },
  { path: '/lecture/:id', Component: LectureDetail, protected: true },
  { path: '/sources', Component: Sources, protected: true },
  { path: '/study-plan', Component: StudyPlan, protected: true },
  { path: '/additions', Component: Additions, protected: true },
  { path: '/contact', Component: Contact, protected: true },
  { path: '/roadmap', Component: CourseRoadmap, protected: true },
  { path: '/profile', Component: Profile, protected: true },

  // Admin only
  { path: '/admin', Component: AdminDashboard, protected: true, adminOnly: true },

  // Legacy URLs from the old information architecture
  { path: '/videos', redirect: '/lectures' },
  { path: '/books', redirect: '/home' },
  { path: '/courses', redirect: '/home' },
  { path: '/schedule', redirect: '/home' },
  { path: '/university', redirect: '/home' },

  { path: '*', Component: NotFound },
]

/**
 * Whether the route rendering this pathname runs without the app shell
 * (Navbar/Footer/SpatialBackground hidden — welcome gate and auth pages).
 * @param {string} pathname
 * @returns {boolean}
 */
export function isBarePathname(pathname) {
  return APP_ROUTES.some((route) => route.bare && matchPath(route.path, pathname))
}
