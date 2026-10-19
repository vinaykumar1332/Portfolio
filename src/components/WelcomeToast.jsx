import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import ContactBuddy from './ContactBuddy'
import { EASE } from '../lib/motion'
import { scrollToTarget } from '../lib/smoothScroll'

const CHOICES = [
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
      scrollToTarget(choice.href)
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
          initial={{ opacity: 0, x: 28, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 28, scale: 0.97 }}
          transition={{ duration: 0.55, ease: EASE }}
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
