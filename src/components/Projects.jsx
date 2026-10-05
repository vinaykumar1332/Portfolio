import { useRef } from 'react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import config from '../config/portfolio.json'
import Icon from './ui/Icon'
import Img from './ui/Img'
import Reveal from './ui/Reveal'
import { EASE } from '../lib/motion'
import Section from './ui/Section'

const { projects } = config

function ProjectCard({ project, index }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  // Image drifts inside its frame while the card scrolls past
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-6%', '6%'])
  const external = /^https?:/.test(project.url)

  return (
    <m.li
      ref={ref}
      className={`project ${index === 0 ? 'project--featured' : ''}`}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay: (index % 2) * 0.1 }}
    >
      <a
        href={project.url}
        className="project-link card"
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        aria-label={`${project.title} — ${project.status}${external ? ' (opens in a new tab)' : ''}`}
      >
        <div className="project-media">
          <m.div className="project-media-inner" style={{ y: imgY }}>
            <Img image={project.image} className="project-img" sizes="(min-width: 900px) 50vw, 100vw" />
          </m.div>
          <span className="project-status mono" data-status={project.status.toLowerCase()}>
            <span className="project-status-dot" aria-hidden="true" />
            {project.status}
          </span>
        </div>
        <div className="project-body">
          <div className="project-head">
            <h3 className="project-title">{project.title}</h3>
            <span className="project-arrow" aria-hidden="true">
              <Icon name="arrow-up-right" />
            </span>
          </div>
          <p className="project-desc">{project.description}</p>
          <ul className="project-tags" aria-label="Tech stack">
            {project.tags.map((t) => (
              <li key={t} className="tag mono">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </a>
    </m.li>
  )
}

export default function Projects() {
  return (
    <Section id="projects" index={5} eyebrow={projects.eyebrow} title={projects.title} lead={projects.lead}>
      <ul className="projects-grid">
        {projects.items.map((p, i) => (
          <ProjectCard key={p.title} project={p} index={i} />
        ))}
      </ul>
      <Reveal className="projects-more">
        <a className="btn btn-ghost" href={config.socials.find((s) => s.icon === 'github')?.url} target="_blank" rel="noopener noreferrer">
          <Icon name="github" /> More on GitHub
        </a>
      </Reveal>
    </Section>
  )
}
