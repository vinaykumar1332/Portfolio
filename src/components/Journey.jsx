import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import config from '../config/portfolio.json'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'
import { EASE } from '../lib/motion'
import Section from './ui/Section'

const { journey } = config

export default function Journey() {
  const [activeId, setActiveId] = useState(journey.tabs[0].id)
  const tabRefs = useRef([])
  const timelineRef = useRef(null)
  const active = journey.tabs.find((t) => t.id === activeId)

  // Timeline line "draws" itself as you scroll through it
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start 80%', 'end 55%'] })
  const lineScale = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  // WAI-ARIA tabs keyboard pattern
  const onKeyDown = (e, i) => {
    const n = journey.tabs.length
    const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    setActiveId(journey.tabs[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <Section id="journey" index={3} eyebrow={journey.eyebrow} title={journey.title} className="section--narrow">
      <Reveal className="tabs">
        <div className="tab-list" role="tablist" aria-label={journey.title}>
          {journey.tabs.map((tab, i) => {
            const selected = tab.id === activeId
            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[i] = el)}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                className="tab"
                onClick={() => setActiveId(tab.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                {selected && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="tab-text">
                  <Icon name={tab.icon} /> {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </Reveal>

      <div ref={timelineRef} className="timeline-wrap">
        <span className="timeline-track" aria-hidden="true">
          <motion.span className="timeline-progress" style={{ scaleY: lineScale }} />
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.ol
            key={active.id}
            id={`panel-${active.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${active.id}`}
            className="timeline"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {active.items.map((item) => (
              <motion.li
                key={item.title}
                className="timeline-item"
                variants={{
                  hidden: { opacity: 0, x: -24 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
                }}
              >
                <span className="timeline-dot" aria-hidden="true" />
                <div className="timeline-card card">
                  <p className="timeline-period mono">
                    <Icon name="calendar" /> {item.period}
                  </p>
                  <h3 className="timeline-title">{item.title}</h3>
                  <p className="timeline-place">
                    <Icon name="pin" /> {item.place}
                  </p>
                  {item.focus && <p className="timeline-focus">{item.focus}</p>}
                  {item.points && (
                    <ul className="timeline-points">
                      {item.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>
    </Section>
  )
}
