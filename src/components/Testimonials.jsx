import { useLayoutEffect, useRef, useState } from 'react'
import config from '../config/portfolio.json'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'
import Section from './ui/Section'

const { testimonials } = config

function Card({ item }) {
  return (
    <figure className="quote card">
      <Icon name="quote" className="quote-icon" />
      <blockquote className="quote-text">{item.text}</blockquote>
      <figcaption className="quote-author mono">— {item.author}</figcaption>
    </figure>
  )
}

/**
 * How many copies of the card set are needed so the track always covers the
 * viewport, plus one spare copy to slide in. With few cards on a wide screen a
 * single duplicate isn't enough and a gap would appear after the last card.
 */
function useCopies(groupRef) {
  const [copies, setCopies] = useState(2)

  useLayoutEffect(() => {
    // Card width is viewport-based, so re-measuring on resize is enough.
    // Read the ref each time: the track remounts when the copy count changes.
    const update = () => {
      const setWidth = groupRef.current?.offsetWidth
      if (!setWidth) return
      setCopies(Math.max(2, Math.ceil(window.innerWidth / setWidth) + 1))
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [groupRef])

  return copies
}

export default function Testimonials() {
  const [paused, setPaused] = useState(false)
  const groupRef = useRef(null)
  const copies = useCopies(groupRef)

  return (
    <Section id="testimonials" index={7} eyebrow={testimonials.eyebrow} title={testimonials.title} className="section--marquee">
      <Reveal className="marquee" data-paused={paused}>
        {/* The track slides left by exactly one set, then restarts — identical sets make the loop seamless */}
        <div key={copies} className="marquee-track" style={{ '--count': testimonials.items.length, '--copies': copies }}>
          {Array.from({ length: copies }, (_, copy) => (
            <div key={copy} ref={copy === 0 ? groupRef : undefined} className="marquee-group" aria-hidden={copy > 0 || undefined}>
              {testimonials.items.map((item, i) => (
                <Card key={i} item={item} />
              ))}
            </div>
          ))}
        </div>
      </Reveal>
      <div className="marquee-controls">
        <button type="button" className="btn btn-ghost btn-sm" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          <Icon name={paused ? 'play' : 'pause'} /> {paused ? 'Play' : 'Pause'} scrolling
        </button>
      </div>
    </Section>
  )
}
