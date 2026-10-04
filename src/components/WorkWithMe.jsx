import { motion } from 'motion/react'
import config from '../config/portfolio.json'
import { useSpotlight } from '../hooks/useSpotlight'
import { CONTACT_TOPIC_EVENT } from '../lib/events'
import { inViewOnce, staggerChild, staggerParent } from '../lib/motion'
import Icon from './ui/Icon'
import Section from './ui/Section'
import ResumeButton from './ResumeButton'

const { workWithMe, about } = config

function Cta({ cta }) {
  if (cta.kind === 'resume') return <ResumeButton {...about.resume} />
  const external = /^https?:/.test(cta.href)
  return (
    <a
      href={cta.href}
      className={`btn ${cta.topic ? 'btn-primary' : 'btn-ghost'}`}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      onClick={() => cta.topic && window.dispatchEvent(new CustomEvent(CONTACT_TOPIC_EVENT, { detail: cta.topic }))}
    >
      {cta.icon === 'linkedin' && <Icon name="linkedin" />}
      {cta.label}
      {cta.icon === 'arrow-right' && <Icon name="arrow-right" className="btn-arrow" />}
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  )
}

export default function WorkWithMe() {
  const spotlight = useSpotlight()
  return (
    <Section id="work-with-me" index={6} eyebrow={workWithMe.eyebrow} title={workWithMe.title} lead={workWithMe.lead}>
      <motion.div className="audiences" initial="hidden" whileInView="show" viewport={inViewOnce} variants={staggerParent}>
        {workWithMe.audiences.map((a) => (
          <motion.article key={a.id} className={`audience card audience--${a.id}`} variants={staggerChild} {...spotlight}>
            <p className="audience-label mono">
              <span className="audience-icon" aria-hidden="true">
                <Icon name={a.icon} />
              </span>
              {a.label}
            </p>
            <h3 className="audience-title">{a.title}</h3>

            <ul className="audience-points">
              {a.points.map((pt) => (
                <li key={pt}>
                  <Icon name="check-circle" className="audience-check" />
                  {pt}
                </li>
              ))}
            </ul>

            {a.facts && (
              <dl className="audience-facts">
                {a.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="mono">{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {a.process && (
              <ol className="audience-process" aria-label="How a project runs">
                {a.process.map((step, i) => (
                  <li key={step}>
                    <span className="audience-step mono">{String(i + 1).padStart(2, '0')}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}

            <div className="audience-ctas">
              {a.ctas.map((cta) => (
                <Cta key={cta.label ?? cta.kind} cta={cta} />
              ))}
            </div>
          </motion.article>
        ))}
      </motion.div>
    </Section>
  )
}
