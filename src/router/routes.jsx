import { lazy } from 'react'
import { matchPath } from 'react-router-dom'

const WelcomeGate = lazy(() => import('../pages/WelcomeGate'))
const Login = lazy(() => import('../pages/Login'))
const Signup = lazy(() => import('../pages/Signup'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const Home = lazy(() => import('../pages/Home'))
const Lectures = lazy(() => import('../pages/Lectures'))
const LectureDetail = lazy(() => import('../pages/LectureDetail'))
const Sources = lazy(() => import('../pages/Sources'))
const StudyPlan = lazy(() => import('../pages/StudyPlan'))
const Additions = lazy(() => import('../pages/Additions'))
const Contact = lazy(() => import('../pages/Contact'))
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'))
const Profile = lazy(() => import('../pages/Profile'))
const CourseRoadmap = lazy(() => import('../pages/CourseRoadmap'))
const NotFound = lazy(() => import('../pages/NotFound'))

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
