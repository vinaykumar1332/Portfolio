import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import config from '../config/portfolio.json'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'
import Section from './ui/Section'

const { skills } = config

// Set "listView": true in portfolio.json to show the list (with a switch to the orbit)
const HAS_LIST = skills.listView === true

// Tier 0 = daily driver … last tier = working knowledge
const tierOf = (level) => skills.tiers.findIndex((t) => level >= t.min)
const RING_RADIUS = [0.42, 0.66, 0.89] // fraction of the orbit's half-width
const RING_SECONDS = [80, 110, 140] // one full turn; alternating directions

const TIERS = skills.tiers.map((tier, ti) => ({
  tier,
  items: skills.items.filter((s) => tierOf(s.level) === ti),
}))
const CATEGORY_LABEL = Object.fromEntries(skills.filters.map((f) => [f.id, f.label]))

/** Signal-strength bars: all lit = daily driver. */
function TierBars({ tierIndex }) {
  return (
    <span className="skill-tier-bars" aria-hidden="true">
      {skills.tiers.map((t, i) => (
        <span key={t.id} data-on={i >= tierIndex} />
      ))}
    </span>
  )
}

/* ---------- List view ---------- */

function SkillList({ inFilter }) {
  return (
    <div className="skill-list">
      {TIERS.map(({ tier, items }, ti) => {
        const shown = items.filter(inFilter)
        if (!shown.length) return null
        return (
          <section key={tier.id} className="skill-group card" aria-labelledby={`tier-${tier.id}`}>
            <header className="skill-group-head">
              <TierBars tierIndex={ti} />
              <h3 id={`tier-${tier.id}`} className="skill-group-title">
                {tier.label}
              </h3>
              <span className="skill-group-count mono">{shown.length}</span>
            </header>
            <p className="skill-group-hint">{tier.hint}</p>
            <ul className="skill-rows">
              {shown.map((s, i) => (
                <li key={s.name} className="skill-row" style={{ '--skill': s.color, '--i': i }}>
                  <span className="skill-row-icon" aria-hidden="true">
                    <Icon name={s.icon} />
                  </span>
                  <span className="skill-row-body">
                    <span className="skill-row-name">{s.name}</span>
                    <span className="skill-row-note">{s.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/* ---------- Orbit view ---------- */

function Planet({ skill, angle, index, active, dimmed, onSelect }) {
  const tier = skills.tiers[tierOf(skill.level)]
  return (
    <li className="planet" style={{ '--a': `${angle}deg`, '--skill': skill.color, '--d': `${0.2 + index * 0.05}s` }}>
      <span className="planet-spin">
        <button
          type="button"
          className="planet-face"
          aria-pressed={active}
          aria-label={`${skill.name}, ${tier.label}`}
          disabled={dimmed}
          data-dim={dimmed || undefined}
          onClick={() => onSelect(skill.name)}
          onFocus={() => onSelect(skill.name)}
          onPointerEnter={(e) => e.pointerType === 'mouse' && onSelect(skill.name)}
        >
          <Icon name={skill.icon} />
        </button>
      </span>
    </li>
  )
}

function SkillOrbit({ inFilter, selected, onSelect }) {
  const orbitRef = useRef(null)
  const [seen, setSeen] = useState(false)
  const [onScreen, setOnScreen] = useState(false)

  // Spin only while visible; reveal the planets the first time it's seen
  useEffect(() => {
    const el = orbitRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setOnScreen(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const skill = skills.items.find((s) => s.name === selected)
  const tierIndex = tierOf(skill.level)
  const tier = skills.tiers[tierIndex]
  let planetIndex = 0

  return (
    <div className="skills-layout">
      <div ref={orbitRef} className="orbit" data-seen={seen} data-run={onScreen}>
        {TIERS.map(({ tier: t, items }, ti) => (
          <ul
            key={t.id}
            className="orbit-ring"
            aria-label={t.label}
            style={{
              '--r': RING_RADIUS[ti],
              '--dur': `${RING_SECONDS[ti]}s`,
              '--dir': ti % 2 ? 'reverse' : 'normal',
              '--dir-rev': ti % 2 ? 'normal' : 'reverse',
              '--ring-d': `${ti * 0.12}s`,
            }}
          >
            {items.map((s, i) => (
              <Planet
                key={s.name}
                skill={s}
                // Offset each ring so planets don't line up in spokes
                angle={(360 / items.length) * i + ti * 23 - 90}
                index={planetIndex++}
                active={s.name === selected}
                dimmed={!inFilter(s)}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ))}

        <div className="orbit-core" style={{ '--skill': skill.color }} aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={skill.name}
              className="orbit-core-icon"
              initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              <Icon name={skill.icon} />
            </m.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="skills-side">
        <div className="skill-detail card" style={{ '--skill': skill.color }} aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={skill.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="skill-detail-cat mono">{CATEGORY_LABEL[skill.category]}</p>
              <h3 className="skill-detail-name">{skill.name}</h3>
              <p className="skill-detail-note">{skill.note}</p>
              <div className="skill-tier">
                <TierBars tierIndex={tierIndex} />
                <span>
                  <b>{tier.label}</b>
                  <span className="skill-tier-hint">{tier.hint}</span>
                </span>
              </div>
            </m.div>
          </AnimatePresence>
        </div>

        <ol className="orbit-legend">
          {TIERS.map(({ tier: t, items }, ti) => (
            <li key={t.id} style={{ '--ring': ti }}>
              <span className="orbit-legend-swatch" aria-hidden="true" />
              <span className="orbit-legend-label">{t.label}</span>
              <span className="orbit-legend-count mono">{items.filter(inFilter).length}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* ---------- Section ---------- */

export default function Skills() {
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState(HAS_LIST ? 'list' : 'orbit')
  const [selected, setSelected] = useState(skills.items[0].name)

  const inFilter = (s) => filter === 'all' || s.category === filter

  const changeFilter = (id) => {
    setFilter(id)
    // Keep the orbit's detail card on a skill that is still visible
    const current = skills.items.find((s) => s.name === selected)
    if (id !== 'all' && current.category !== id) setSelected(skills.items.find((s) => s.category === id).name)
  }

  return (
    <Section id="skills" index={2} eyebrow={skills.eyebrow} title={skills.title} lead={skills.lead}>
      <Reveal className="skills-toolbar">
        <div className="filters" role="group" aria-label="Filter skills">
          {skills.filters.map((f) => {
            const count = f.id === 'all' ? skills.items.length : skills.items.filter((s) => s.category === f.id).length
            const active = f.id === filter
            return (
              <button key={f.id} type="button" className="filter" aria-pressed={active} onClick={() => changeFilter(f.id)}>
                {active && <m.span layoutId="skill-filter" className="filter-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="filter-text">
                  {f.label} <span className="filter-count mono">{count}</span>
                </span>
              </button>
            )
          })}
        </div>

        {HAS_LIST && (
          <div className="view-toggle" role="group" aria-label="Skills layout">
            {[
              ['list', 'List'],
              ['orbit', 'Orbit'],
            ].map(([id, label]) => (
              <button key={id} type="button" className="view-toggle-btn" aria-pressed={view === id} onClick={() => setView(id)}>
                <Icon name={id} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </Reveal>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={view}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {view === 'list' ? (
            <SkillList inFilter={inFilter} />
          ) : (
            <SkillOrbit inFilter={inFilter} selected={selected} onSelect={setSelected} />
          )}
        </m.div>
      </AnimatePresence>
    </Section>
  )
}
