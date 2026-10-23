import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let lenis = null

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initSmoothScroll() {
  if (lenis || prefersReducedMotion()) return () => {}

  // lerp-based wheel smoothing follows the wheel closely (no floaty lag);
  // touch keeps native momentum scrolling, which feels best on phones.
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.12,
    smoothWheel: true,
    wheelMultiplier: 1,
    // let scrollable children (textarea, menus) scroll themselves
    allowNestedScroll: true,
  })

  return () => {
    lenis?.destroy()
    lenis = null
  }
}

const headerOffset = () => -(document.getElementById('header')?.offsetHeight ?? 72) + 1

/** Smoothly scroll to "#id" (or an element) and move focus there for keyboard/screen-reader users. */
export function scrollToTarget(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return

  const focus = () => {
    const heading = el.querySelector('h1, h2') ?? el
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
  }

  if (lenis) {
    // Lenis already subtracts the page's scroll-padding-top (header height + 8px,
    // set in index.css), so no extra header offset here or it's applied twice.
    lenis.scrollTo(el, {
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      onComplete: focus,
    })
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + headerOffset()
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    focus()
  }

  if (el.id) history.replaceState(null, '', el.id === 'home' ? window.location.pathname : `#${el.id}`)
}

export function lockScroll(locked) {
  if (locked) lenis?.stop()
  else lenis?.start()
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

/** Intercept same-page "#hash" link clicks so they use smooth scrolling. */
export function handleAnchorClick(event) {
  const link = event.target.closest?.('a[href^="#"]')
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.button !== 0) return
  const hash = link.getAttribute('href')
  if (hash.length < 2) return
  const el = document.querySelector(hash)
  if (!el) return
  event.preventDefault()
  scrollToTarget(el)
}
