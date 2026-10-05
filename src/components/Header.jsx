import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'motion/react'
import config from '../config/portfolio.json'
import { useActiveSection } from '../hooks/useActiveSection'
import { useTheme } from '../hooks/useTheme'
import { lockScroll } from '../lib/smoothScroll'
import Icon from './ui/Icon'
import { EASE } from '../lib/motion'

const { meta, nav, socials } = config
const NAV_IDS = nav.map((n) => n.id)

export default function Header() {
  const active = useActiveSection(NAV_IDS)
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const toggleRef = useRef(null)
  const menuRef = useRef(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    setHidden(!open && y > 480 && y > prev + 4)
    if (y < prev - 4) setHidden(false)
  })

  // Mobile menu: lock scroll, Esc to close, keep focus inside
  useEffect(() => {
    if (!open) return
    lockScroll(true)
    menuRef.current?.querySelector('a')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
      if (e.key === 'Tab' && menuRef.current) {
        const items = [toggleRef.current, ...menuRef.current.querySelectorAll('a')]
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const close = () => mq.matches && setOpen(false)
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  const isDark = theme === 'dark'

  return (
    <m.header
      id="header"
      className="header"
      data-scrolled={scrolled || open}
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <nav className="nav container" aria-label="Primary">
        <a href="#home" className="nav-logo mono" aria-label={`${meta.name} — home`}>
          <span className="nav-logo-bracket">&lt;</span>
          {meta.shortName}
          <span className="nav-logo-bracket"> /&gt;</span>
        </a>

        <ul className="nav-list">
          {nav.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="nav-link"
                aria-current={active === item.id ? 'location' : undefined}
              >
                {active === item.id && (
                  <m.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span className="nav-link-text">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={theme}
                className="theme-icon"
                initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Icon name={isDark ? 'sun' : 'moon'} />
              </m.span>
            </AnimatePresence>
          </button>
          <a href="#contact" className="btn btn-primary btn-sm nav-cta">
            Let's talk
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="icon-btn nav-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="burger" data-open={open} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            ref={menuRef}
            className="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <m.ul
              className="mobile-menu-list"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
            >
              {nav.map((item, i) => (
                <m.li
                  key={item.id}
                  variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { ease: EASE, duration: 0.5 } } }}
                >
                  <a
                    href={`#${item.id}`}
                    className="mobile-menu-link"
                    aria-current={active === item.id ? 'location' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="mono mobile-menu-index">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </a>
                </m.li>
              ))}
            </m.ul>
            <m.div
              className="mobile-menu-foot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
            >
              <a className="mono" href={`mailto:${config.contact.email}`}>
                {config.contact.email}
              </a>
              <ul className="mobile-menu-socials">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a className="icon-btn" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                      <Icon name={s.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  )
}
