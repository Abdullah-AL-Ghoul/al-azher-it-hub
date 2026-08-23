// Unified Framer Motion animation preset tokens for AL-Azher IT Hub

export const springFast = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
}

export const springDefault = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
}

export const springSoft = {
  type: 'spring',
  stiffness: 200,
  damping: 22,
}

export const springBouncy = {
  type: 'spring',
  stiffness: 500,
  damping: 17,
}

export const easeSnappy = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.15,
}

export const easeDefault = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.4,
}

export const easeOut = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
}

// Route Transition Configuration
export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
}

// Modal Mount Transition Configuration
export const modalTransition = {
  initial: { opacity: 0, scale: 0.95, y: 15 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: springDefault,
}

// Unified Modal Variants
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 30 },
  transition: springDefault,
}

// Card & Interactive Element Hover Config
export const cardHoverTransition = {
  whileHover: { y: -4, rotateX: 0.5, rotateY: -0.25 },
  transition: springFast,
}

// Unified Page Stagger Variants
export const pageContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export const pageItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// Slow variant for hero/welcome entrances
export const pageContainerSlow = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

export const pageItemSlow = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// WelcomeGate aliases
export const welcomeContainer = pageContainerSlow
export const welcomeItem = pageItemSlow

// Reduced-motion variants (instant, no stagger)
export const pageContainerReduced = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
}

export const pageItemReduced = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
}

// Form slide variant (for CrudForm and SettingsPanel forms)
export const formSlideVariant = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: easeOut,
}

// ============ PREMIUM REVEAL TOKENS ============

export const revealContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export const revealItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export const revealItemLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export const revealItemRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export const revealItemScale = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export const counterSpring = {
  type: 'spring',
  stiffness: 120,
  damping: 15,
}
