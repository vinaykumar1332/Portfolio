import { useState } from 'react'
import config from '../config/portfolio.json'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'
import Section from './ui/Section'

const { testimonials } = config

function Card({ item, hidden }) {
  return (
    <figure className="quote card" aria-hidden={hidden || undefined}>
      <Icon name="quote" className="quote-icon" />
      <blockquote className="quote-text">{item.text}</blockquote>
      <figcaption className="quote-author mono">— {item.author}</figcaption>
    </figure>
  )
}

export default function Testimonials() {
  const [paused, setPaused] = useState(false)
  // Duplicate the list so the CSS marquee can loop seamlessly
  const loop = [...testimonials.items, ...testimonials.items]

  return (
    <Section id="testimonials" index={7} eyebrow={testimonials.eyebrow} title={testimonials.title} className="section--marquee">
      <Reveal className="marquee" data-paused={paused}>
        <div className="marquee-track" style={{ '--count': testimonials.items.length }}>
          {loop.map((item, i) => (
            <Card key={i} item={item} hidden={i >= testimonials.items.length} />
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
