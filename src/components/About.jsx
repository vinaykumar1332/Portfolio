import { motion } from 'motion/react'
import config from '../config/portfolio.json'
import CountUp from './ui/CountUp'
import Icon from './ui/Icon'
import Img from './ui/Img'
import Reveal from './ui/Reveal'
import { inViewOnce, staggerChild, staggerParent } from '../lib/motion'
import Section from './ui/Section'
import ResumeButton from './ResumeButton'

const { about } = config

function yearsSince(isoDate) {
  const start = new Date(isoDate)
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) years--
  return Math.max(years, 0)
}

export default function About() {
  return (
    <Section id="about" index={1} eyebrow={about.eyebrow} title={about.title}>
      <div className="about-grid">
        <Reveal as="figure" from="left" className="about-media">
          <div className="about-frame">
            <Img image={about.image} className="about-img" />
            <span className="about-frame-corner about-frame-corner--tl" aria-hidden="true" />
            <span className="about-frame-corner about-frame-corner--br" aria-hidden="true" />
          </div>
        </Reveal>

        <div className="about-body">
          <Reveal as="ul" className="about-highlights">
            {about.highlights.map((h) => (
              <li key={h.text} className="about-highlight">
                <Icon name={h.icon} /> {h.text}
              </li>
            ))}
          </Reveal>
          <motion.div className="about-text" initial="hidden" whileInView="show" viewport={inViewOnce} variants={staggerParent}>
            {about.paragraphs.map((p) => (
              <motion.p key={p.slice(0, 24)} variants={staggerChild}>
                {p}
              </motion.p>
            ))}
          </motion.div>

          <motion.dl className="stats" initial="hidden" whileInView="show" viewport={inViewOnce} variants={staggerParent}>
            {about.stats.map((stat) => (
              <motion.div className="stat" key={stat.label} variants={staggerChild}>
                <dt className="stat-label">{stat.label}</dt>
                <dd className="stat-value">
                  <CountUp value={stat.type === 'experience' ? yearsSince(about.experienceStart) : stat.value} suffix={stat.suffix} />
                </dd>
              </motion.div>
            ))}
          </motion.dl>

          <Reveal className="about-actions">
            <ResumeButton {...about.resume} />
            <a href="#contact" className="btn btn-ghost">
              Contact me <Icon name="arrow-right" className="btn-arrow" />
            </a>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
