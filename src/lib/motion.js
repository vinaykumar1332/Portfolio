// Shared motion presets used across sections
export const EASE = [0.22, 1, 0.36, 1]

/** Parent/child variants for staggered lists. */
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
}

export const staggerChild = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.95, ease: EASE } },
}

export const inViewOnce = { once: true, margin: '0px 0px -10% 0px' }
