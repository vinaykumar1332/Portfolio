import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import ContactBuddy from './ContactBuddy'
import { EASE } from '../lib/motion'
import { scrollToTarget } from '../lib/smoothScroll'
import { TOUR_OPEN_EVENT } from '../lib/events'

const CHOICES = [
  { label: 'Guide me', href: '#tour', mood: 'excited', message: 'Follow me, I will show you around!', tour: true },
  { label: 'See my work', href: '#projects', mood: 'projects', message: 'Coming right up!' },
  { label: "I'm hiring", href: '#work-with-me', mood: 'hiring', message: 'Wonderful, let’s talk!' },
  { label: 'Start a project', href: '#contact', mood: 'sent', message: 'Exciting! Let’s make it happen!' },
]

export default function WelcomeToast() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [mood, setMood] = useState('idle')
  const [message, setMessage] = useState('What brings you by?')
  const timerRef = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 1200)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(timerRef.current)
    }
  }, [])

  const chooseDestination = (event, choice) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMood(choice.mood)
    setMessage(choice.message)
    timerRef.current = window.setTimeout(() => {
      setVisible(false)
      if (choice.tour) window.dispatchEvent(new CustomEvent(TOUR_OPEN_EVENT))
      else scrollToTarget(choice.href)
    }, 900)
  }

  const dismiss = () => {
    if (busy) return
    setBusy(true)
    setMood('farewell')
    setMessage('Bye for now — see you around!')
    timerRef.current = window.setTimeout(() => setVisible(false), 850)
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <m.aside
          className="welcome-toast card"
          aria-labelledby="welcome-toast-title"
          style={{ transformOrigin: '100% 100%' }}
          initial={{ opacity: 0, y: 26, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{
            opacity: [1, 1, 0],
            scaleX: [1, 0.94, 0.7],
            scaleY: [1, 0.9, 0.34],
            y: [0, 6, 22],
            filter: ['blur(0px)', 'blur(0px)', 'blur(8px)'],
            transition: { duration: 0.5, ease: EASE, times: [0, 0.35, 1] },
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }}
        >
          <ContactBuddy mood={mood} message="" variant="welcome" />
          <div className="welcome-toast-content">
            <button
              className="welcome-toast-close"
              type="button"
              onClick={dismiss}
              disabled={busy}
              aria-label="Dismiss welcome message"
            >
              ×
            </button>
            <p className="welcome-toast-eyebrow mono">A quick hello</p>
            <h2 id="welcome-toast-title">Hi, welcome!</h2>
            <p className="welcome-toast-message" aria-live="polite">{message}</p>
            <nav className="welcome-toast-choices" aria-label="Choose where to go">
              {CHOICES.map((choice) => (
                <a
                  key={choice.href}
                  data-tour={choice.tour ? 'true' : undefined}
                  href={choice.href}
                  aria-disabled={busy}
                  onClick={(event) => chooseDestination(event, choice)}
                >
                  {choice.label}
                </a>
              ))}
            </nav>
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  )
}
