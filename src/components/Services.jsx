import { motion } from 'motion/react'
import config from '../config/portfolio.json'
import { useSpotlight } from '../hooks/useSpotlight'
import Icon from './ui/Icon'
import { inViewOnce, staggerChild, staggerParent } from '../lib/motion'
import Section from './ui/Section'

const { services } = config

export default function Services() {
  const spotlight = useSpotlight()
  return (
    <Section id="services" index={4} eyebrow={services.eyebrow} title={services.title} lead={services.lead}>
      <motion.ul className="services-grid" initial="hidden" whileInView="show" viewport={inViewOnce} variants={staggerParent}>
        {services.items.map((s, i) => (
          <motion.li key={s.title} className="service card" variants={staggerChild} {...spotlight}>
            <span className="service-num mono" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="service-icon">
              <Icon name={s.icon} />
            </span>
            <h3 className="service-title">{s.title}</h3>
            <p className="service-text">{s.text}</p>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  )
}
