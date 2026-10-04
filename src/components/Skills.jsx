import { useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import config from '../config/portfolio.json'
import CountUp from './ui/CountUp'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'
import { EASE, inViewOnce } from '../lib/motion'
import Section from './ui/Section'
import { useSpotlight } from '../hooks/useSpotlight'

const { skills } = config

export default function Skills() {
  const spotlight = useSpotlight()
  const gridRef = useRef(null)
  const inView = useInView(gridRef, inViewOnce)
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? skills.items : skills.items.filter((s) => s.category === filter)

  return (
    <Section id="skills" index={2} eyebrow={skills.eyebrow} title={skills.title} lead={skills.lead}>
      <Reveal className="filters" role="group" aria-label="Filter skills">
        {skills.filters.map((f) => {
          const count = f.id === 'all' ? skills.items.length : skills.items.filter((s) => s.category === f.id).length
          const active = f.id === filter
          return (
            <button key={f.id} type="button" className="filter" aria-pressed={active} onClick={() => setFilter(f.id)}>
              {active && <motion.span layoutId="skill-filter" className="filter-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="filter-text">
                {f.label} <span className="filter-count mono">{count}</span>
              </span>
            </button>
          )
        })}
      </Reveal>

      {/* One in-view trigger for the grid; bars fill via CSS so none can miss it */}
      <ul ref={gridRef} className="skills-grid" data-inview={inView}>
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((s, i) => (
            <motion.li
              key={s.name}
              layout
              className="skill card"
              style={{ '--skill': s.color, '--level': s.level / 100, '--delay': `${0.15 + i * 0.05}s` }}
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ duration: 0.55, ease: EASE, delay: Math.min(i * 0.04, 0.4) }}
              {...spotlight}
            >
              <div className="skill-top">
                <span className="skill-icon">
                  <Icon name={s.icon} />
                </span>
                <span className="skill-name">{s.name}</span>
                <span className="skill-pct mono">
                  <CountUp value={s.level} suffix="%" />
                </span>
              </div>
              <p className="skill-note">{s.note}</p>
              <div
                className="skill-bar"
                role="progressbar"
                aria-label={`${s.name} proficiency`}
                aria-valuenow={s.level}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="skill-bar-fill" />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Section>
  )
}
