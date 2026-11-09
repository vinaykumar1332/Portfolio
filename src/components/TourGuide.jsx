import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useActiveSection } from '../hooks/useActiveSection'
import { EASE } from '../lib/motion'
import { scrollToTarget } from '../lib/smoothScroll'
import { TOUR_OPEN_EVENT } from '../lib/events'
import config from '../config/portfolio.json'
import ContactBuddy from './ContactBuddy'
import Icon from './ui/Icon'

const { tour } = config
const STOPS = tour.stops

const SECTION_IDS = STOPS.filter((s) => s.id !== 'home').map((s) => s.id)

// Cryptographic pick, so each visit gets one of a section's messages
function pickIndex(count) {
  try {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % count
  } catch {
    return 0
  }
}
const DISMISS_KEY = 'vk-tour-dismissed'
const SHOW_AFTER_PX = 420
const TYPE_MS = 26

// Waits briefly (a "getting ready" moment), then reveals text one character at a time.
function useTyped(text, speed = TYPE_MS, delay = tour.loadMs) {
  // Progress is stored together with the text it belongs to, so a new text starts from zero
  const [progress, setProgress] = useState({ text: '', count: 0 })
  useEffect(() => {
    let count = 0
    let interval = 0
    const wait = setTimeout(() => {
      interval = setInterval(() => {
        count += 1
        setProgress({ text, count })
        if (count >= text.length) clearInterval(interval)
      }, speed)
    }, delay)
    return () => {
      clearTimeout(wait)
      clearInterval(interval)
    }
  }, [text, speed, delay])
  return progress.text === text ? text.slice(0, progress.count) : ''
}

export default function TourGuide() {
  const active = useActiveSection(SECTION_IDS)
  const [pastHero, setPastHero] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [started, setStarted] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Started from the welcome card: open the guide at the first stop
  useEffect(() => {
    const onOpen = () => {
      setDismissed(false)
      setStarted(true)
      setOpen(true)
      setStep(0)
      scrollToTarget(`#${STOPS[0].id}`)
    }
    window.addEventListener(TOUR_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(TOUR_OPEN_EVENT, onOpen)
  }, [])

  // Highlight the section the guide is talking about
  useEffect(() => {
    if (!open) return undefined
    const el = document.getElementById(STOPS[step].id)
    el?.classList.add('tour-highlight')
    return () => el?.classList.remove('tour-highlight')
  }, [open, step])

  const visible = (pastHero || started) && !dismissed
  const current = STOPS[step]
  const progress = useMemo(() => ((step + 1) / STOPS.length) * 100, [step])

  const activeStop = STOPS.find((s) => s.id === active)
  const pillSay = useMemo(
    () => (activeStop ? activeStop.messages[pickIndex(activeStop.messages.length)] : tour.pillPrompt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active],
  )
  const pillLine = useTyped(pillSay)
  const panelSay = useMemo(() => current.messages[pickIndex(current.messages.length)], [current])
  const panelLine = useTyped(open ? panelSay : '')
  const typing = open ? panelLine.length < panelSay.length : pillLine.length < 1

  const goTo = (index) => {
    const next = Math.max(0, Math.min(STOPS.length - 1, index))
    setStep(next)
    scrollToTarget(`#${STOPS[next].id}`)
  }

  const onPanelKey = (e) => {
    if (e.key === 'ArrowRight') goTo(step + 1)
    else if (e.key === 'ArrowLeft') goTo(step - 1)
    else if (e.key === 'Escape') setOpen(false)
  }

  const dismiss = () => {
    setOpen(false)
    setStarted(false)
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* storage unavailable: dismissal lasts only this page view */
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className="tour"
          data-open={open}
          initial={{ opacity: 0, y: 24, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(8px)', transition: { duration: 0.35, ease: EASE } }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <AnimatePresence initial={false} mode="wait">
            {!open ? (
              <m.div
                key="pill"
                className="tour-pill"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <span className="tour-buddy">
                  <ContactBuddy mood={typing ? 'typing' : 'idle'} message="" variant="welcome" />
                </span>
                <span className="tour-pill-text">
                  <span className="tour-pill-note" aria-live="polite">
                    {pillLine}
                    {typing && <span className="tour-caret" aria-hidden="true" />}
                  </span>
                  <button type="button" className="tour-pill-cta" onClick={() => setOpen(true)} aria-expanded={false}>
                    Guide me <Icon name="arrow-right" className="tour-pill-arrow" />
                  </button>
                </span>
              </m.div>
            ) : (
              <m.div
                key="panel"
                className="tour-panel card"
                role="dialog"
                tabIndex={-1}
                onKeyDown={onPanelKey}
                aria-label="Site tour"
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div className="tour-head">
                  <span className="mono tour-count">
                    Stop {step + 1} of {STOPS.length}
                  </span>
                  <button type="button" className="tour-close" onClick={() => setOpen(false)} aria-label="Minimise tour">
                    –
                  </button>
                  <button type="button" className="tour-close" onClick={dismiss} aria-label="Close tour">
                    ×
                  </button>
                </div>

                <div className="tour-bar" aria-hidden="true">
                  <m.span className="tour-bar-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: EASE }} />
                </div>

                <div className="tour-speak">
                  <span className="tour-buddy tour-buddy--panel">
                    <ContactBuddy mood={typing ? 'typing' : 'excited'} message="" variant="welcome" />
                  </span>
                  <div className="tour-bubble" aria-live="polite">
                    <p className="tour-say">
                      {panelLine || (typing && <span className="tour-thinking" aria-label={tour.loadingText}><i /><i /><i /></span>)}
                      {typing && panelLine && <span className="tour-caret" aria-hidden="true" />}
                    </p>
                  </div>
                </div>

                <div className="tour-title-row">
                  <h3 className="tour-title">{current.title}</h3>
                </div>

                <div className="tour-dots" role="tablist" aria-label="Tour stops">
                  {STOPS.map((stop, i) => (
                    <button
                      key={stop.id}
                      type="button"
                      role="tab"
                      aria-selected={i === step}
                      aria-label={`Go to ${stop.title}`}
                      className="tour-dot-btn"
                      data-active={i === step}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>

                <div className="tour-actions">
                  <button type="button" className="btn btn-ghost tour-btn" onClick={() => goTo(step - 1)} disabled={step === 0}>
                    Back
                  </button>
                  {step < STOPS.length - 1 ? (
                    <button type="button" className="btn btn-primary tour-btn" onClick={() => goTo(step + 1)}>
                      Next stop <Icon name="arrow-right" className="btn-arrow" />
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary tour-btn" onClick={dismiss}>
                      Finish <Icon name="check" />
                    </button>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </AnimatePresence>
  )
}
