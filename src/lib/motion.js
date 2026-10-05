// Shared motion presets used across sections
export const EASE = [0.22, 1, 0.36, 1]

/** Parent/child variants for staggered lists. */
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

export const staggerChild = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export const inViewOnce = { once: true, margin: '0px 0px -10% 0px' }
