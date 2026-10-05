import { Fragment, useEffect, useRef, useState } from 'react'
import { m, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import config from '../config/portfolio.json'
import CodeWindow from './CodeWindow'
import Icon from './ui/Icon'
import { EASE } from '../lib/motion'

const { hero, meta, socials } = config

const wordVariant = {
  hidden: { y: '110%' },
  show: (i) => ({ y: '0%', transition: { duration: 0.9, ease: EASE, delay: 0.25 + i * 0.07 } }),
}

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
})

function SplitWords({ text, startIndex = 0, className }) {
  // The space must sit outside the inline-block mask or it collapses
  return text.split(' ').map((word, i) => (
    <Fragment key={`${word}-${i}`}>
      <span className="word-mask">
        <m.span className={`word ${className ?? ''}`} custom={startIndex + i} variants={wordVariant}>
          {word}
        </m.span>
      </span>{' '}
    </Fragment>
  ))
}

// Live viewport width, isolated so resizing only re-renders this label (rAF-throttled)
function ViewportWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setW(window.innerWidth))
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return w
}

export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  // Scroll-linked parallax as the hero leaves the viewport
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const visualY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.92])

  // Pointer tilt for the code window (fine pointers only)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 150, damping: 18 })

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onPointerLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const headlineWords = hero.headline.join(' ').split(' ').length

  return (
    <section ref={ref} id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-ruler container" aria-hidden="true">
        <span className="mono">
          &lt;Header <b>width</b>={<ViewportWidth />} /&gt;
        </span>
        <m.span
          className="hero-ruler-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        />
      </div>

      <div className="hero-grid container">
        <m.div className="hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
          <m.p className="hero-status" {...fadeUp(0)}>
            <span className="hero-status-dot" aria-hidden="true" />
            {hero.availability}
          </m.p>
          <m.p className="hero-eyebrow mono" {...fadeUp(0.1)}>
            <span className="hero-eyebrow-name">{meta.name}</span>
            <span className="hero-eyebrow-sep" aria-hidden="true">
              /
            </span>
            <span>{meta.location}</span>
          </m.p>

          {/* Name + role lead the h1 for search engines; the visible words animate in */}
          <m.h1
            id="hero-title"
            className="hero-title"
            initial="hidden"
            animate="show"
            aria-label={`${meta.name}, ${meta.role}. ${hero.headline.join(' ')} ${hero.headlineAccent}`}
          >
            <span className="sr-only">
              {meta.name}, {meta.role}:{' '}
            </span>
            <span aria-hidden="true">
              <SplitWords text={hero.headline.join(' ')} />
              <br className="hero-br" />
              <SplitWords text={hero.headlineAccent} startIndex={headlineWords} className="accent" />
            </span>
          </m.h1>

          <m.p className="hero-desc" {...fadeUp(0.7)}>
            {hero.description}
          </m.p>

          <m.ul
            className="chips"
            aria-label="Core skills"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.85 } } }}
          >
            {hero.chips.map((chip) => (
              <m.li
                key={chip.label}
                className="chip"
                data-tone={chip.tone}
                variants={{ hidden: { opacity: 0, y: 14, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
              >
                <span className="chip-dot" aria-hidden="true" />
                {chip.label}
              </m.li>
            ))}
          </m.ul>

          <m.div className="hero-ctas" {...fadeUp(1.1)}>
            <a href={hero.primaryCta.href} className="btn btn-primary">
              {hero.primaryCta.label}
              <Icon name="arrow-right" className="btn-arrow" />
            </a>
            <a href={hero.secondaryCta.href} className="btn btn-ghost">
              {hero.secondaryCta.label}
            </a>
          </m.div>

          <m.ul className="hero-socials" aria-label="Social profiles" {...fadeUp(1.25)}>
            {socials.map((s) => (
              <li key={s.label}>
                <a className="icon-btn" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`}>
                  <Icon name={s.icon} />
                </a>
              </li>
            ))}
          </m.ul>
        </m.div>

        <m.div
          className="hero-visual"
          aria-hidden="true"
          style={{ y: visualY, scale: visualScale }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <m.div
            className="hero-visual-inner"
            style={{ rotateX, rotateY }}
            initial={{ opacity: 0, y: 60, rotateX: 18 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
          >
            <CodeWindow {...hero.codeWindow} />
          </m.div>
          <p className="hero-site mono">
            {meta.siteLabel}
            <b>{meta.siteLabelAccent}</b>
          </p>
        </m.div>
      </div>

      <m.a
        href="#about"
        className="scroll-cue"
        aria-label="Scroll to About section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <span className="scroll-cue-mouse">
          <span />
        </span>
        <span className="mono">scroll</span>
      </m.a>
    </section>
  )
}
