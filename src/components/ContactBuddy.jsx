import { useEffect, useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'

// Deterministic confetti pieces: [x, y, rotate, colour, delay]
const CONFETTI = [
  [-70, -60, 140, 'var(--amber)', 0],
  [-40, -95, -80, 'var(--teal)', 0.04],
  [-10, -110, 200, 'var(--pink)', 0.02],
  [25, -100, -150, 'var(--blue)', 0.06],
  [55, -80, 90, 'var(--amber)', 0.03],
  [80, -50, -200, 'var(--teal)', 0.08],
  [-90, -25, 60, 'var(--pink)', 0.05],
  [95, -15, 170, 'var(--blue)', 0.01],
  [-55, -120, -40, 'var(--amber-2)', 0.07],
  [40, -130, 120, 'var(--pink)', 0.09],
  [-25, -70, 250, 'var(--blue)', 0.1],
  [10, -60, -120, 'var(--teal)', 0.03],
]

/** Where the text caret roughly is inside a field, so the eyes can follow typing. */
function caretPoint(el) {
  const r = el.getBoundingClientRect()
  if (!('value' in el) || el.type === 'radio') return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  const charW = 8
  const perLine = Math.max(1, Math.floor((r.width - 32) / charW))
  const len = el.value.length
  if (el.tagName === 'TEXTAREA') {
    const line = Math.floor(len / perLine)
    return { x: r.left + 16 + (len % perLine) * charW, y: r.top + 22 + Math.min(line * 24, r.height - 30) }
  }
  return { x: r.left + 16 + Math.min(len * charW, r.width - 32), y: r.top + r.height / 2 }
}

/**
 * A little character peeking over the contact form. Its eyes follow the mouse,
 * or the caret of the field being typed in, and it reacts to the form's state.
 */
export default function ContactBuddy({ mood, message, formRef }) {
  const rootRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let frame = 0
    let visible = false
    let pointer = null

    const aim = () => {
      frame = 0
      const r = svgRef.current.getBoundingClientRect()
      const hx = r.left + r.width / 2
      const hy = r.top + r.height * 0.55
      const active = document.activeElement
      const target = formRef.current?.contains(active) ? caretPoint(active) : pointer
      let lx = 0
      let ly = 0
      if (target) {
        const dx = target.x - hx
        const dy = target.y - hy
        const dist = Math.hypot(dx, dy) || 1
        const k = Math.min(1, dist / 220)
        lx = (dx / dist) * k
        ly = (dy / dist) * k
      }
      root.style.setProperty('--lx', lx.toFixed(3))
      root.style.setProperty('--ly', ly.toFixed(3))
      root.style.setProperty('--tilt', `${(lx * 7).toFixed(2)}deg`)
    }
    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(aim)
    }
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      pointer = { x: e.clientX, y: e.clientY }
      schedule()
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      schedule()
    })
    io.observe(root)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    document.addEventListener('input', schedule)
    document.addEventListener('focusin', schedule)
    document.addEventListener('focusout', schedule)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', schedule)
      document.removeEventListener('input', schedule)
      document.removeEventListener('focusin', schedule)
      document.removeEventListener('focusout', schedule)
    }
  }, [formRef])

  return (
    <div ref={rootRef} className="buddy" data-mood={mood} aria-hidden="true">
      <svg ref={svgRef} className="buddy-svg" viewBox="0 0 220 132" focusable="false">
        <defs>
          <clipPath id="buddy-edge">
            <rect x="0" y="-40" width="220" height="160" />
          </clipPath>
        </defs>

        <g clipPath="url(#buddy-edge)">
          <g className="buddy-track">
            <g className="buddy-head">
              <rect className="buddy-skin-shade" x="95" y="96" width="30" height="40" rx="10" />
              <circle className="buddy-skin" cx="66" cy="76" r="10" />
              <circle className="buddy-skin" cx="154" cy="76" r="10" />
              <ellipse className="buddy-skin" cx="110" cy="72" rx="44" ry="48" />
              <path
                className="buddy-hair"
                d="M64 74C58 36 86 18 112 19c28 0 50 18 44 54-5-14-14-24-30-28-9 9-28 11-44 6-8 4-15 12-18 23Z"
              />
              <ellipse className="buddy-cheek" cx="83" cy="91" rx="7" ry="4" />
              <ellipse className="buddy-cheek" cx="137" cy="91" rx="7" ry="4" />

              <g className="buddy-brows">
                <path className="buddy-brow buddy-brow--l" d="M85 59q9-6 18 0" />
                <path className="buddy-brow buddy-brow--r" d="M117 59q9-6 18 0" />
              </g>

              <ellipse className="buddy-eye" cx="94" cy="75" rx="8.5" ry="9.5" />
              <ellipse className="buddy-eye" cx="126" cy="75" rx="8.5" ry="9.5" />
              <g className="buddy-pupils">
                <circle cx="94" cy="76" r="4.3" />
                <circle cx="126" cy="76" r="4.3" />
                <circle className="buddy-glint" cx="95.6" cy="74.4" r="1.3" />
                <circle className="buddy-glint" cx="127.6" cy="74.4" r="1.3" />
              </g>
              <ellipse className="buddy-lid" cx="94" cy="75" rx="9" ry="10" />
              <ellipse className="buddy-lid" cx="126" cy="75" rx="9" ry="10" />

              <path className="buddy-nose" d="M110 81q-4 7 1 9" />

              <path className="buddy-mouth buddy-mouth--smile" d="M99 98q11 9 22 0" />
              <path className="buddy-mouth buddy-mouth--small" d="M103 99q7 5 14 0" />
              <path className="buddy-mouth buddy-mouth--open" d="M97 96q13 17 26 0Z" />
              <ellipse className="buddy-mouth buddy-mouth--o" cx="110" cy="100" rx="4.5" ry="5.5" />
              <path className="buddy-mouth buddy-mouth--flat" d="M101 101q4-3 9 0t9 0" />
              <path className="buddy-mouth buddy-mouth--sad" d="M100 104q10-8 20 0" />

              <path className="buddy-sweat" d="M156 52q5 7 0 11-5-4 0-11Z" />
            </g>
          </g>
        </g>

        <g className="buddy-plane">
          <path d="M0 0 24-9 9 7Z" />
          <path className="buddy-plane-fold" d="m9 7 2 7 3-9" />
        </g>

        <g className="buddy-hand buddy-hand--l">
          <rect x="-17" y="-8" width="34" height="18" rx="9" />
          <path d="M-7-6v7M1-6v7M9-6v7" />
        </g>
        <g className="buddy-hand buddy-hand--r">
          <rect x="-17" y="-8" width="34" height="18" rx="9" />
          <path d="M-9-6v7M-1-6v7M7-6v7" />
        </g>
        <g className="buddy-wave">
          <rect x="-11" y="-22" width="22" height="30" rx="11" />
          <path d="M-4-20v-6M2-21v-7M8-18v-5" />
        </g>
      </svg>

      <div className="buddy-bubble">
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={message}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            {message}
          </m.span>
        </AnimatePresence>
      </div>

      <span className="buddy-confetti">
        {CONFETTI.map(([x, y, r, c, d], i) => (
          <i key={i} style={{ '--x': `${x}px`, '--y': `${y}px`, '--r': `${r}deg`, '--c': c, '--d': `${d}s` }} />
        ))}
      </span>
    </div>
  )
}
