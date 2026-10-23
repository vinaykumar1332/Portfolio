import { useId, useState } from 'react'
import config from '../config/portfolio.json'
import Reveal from './ui/Reveal'
import Section from './ui/Section'

const { faq } = config

/**
 * Accordion that animates both opening and closing (native <details> can't
 * animate closing). Answers stay in the DOM when collapsed, so search engines
 * still read them; the same Q&A feeds the FAQPage structured data in seo.plugin.js.
 */
export default function Faq() {
  const [open, setOpen] = useState(0)
  const baseId = useId()
  if (!faq?.show) return null

  return (
    <Section id="faq" index={8} eyebrow={faq.eyebrow} title={faq.title} lead={faq.lead} className="section--narrow">
      <Reveal className="faq-list">
        {faq.items.map((item, i) => {
          const isOpen = open === i
          const qId = `${baseId}-q${i}`
          const aId = `${baseId}-a${i}`
          return (
            <div key={item.q} className="faq-item" data-open={isOpen}>
              <h3 className="faq-heading">
                <button
                  type="button"
                  id={qId}
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden="true" />
                </button>
              </h3>
              <div id={aId} className="faq-panel" role="region" aria-labelledby={qId} inert={!isOpen}>
                <div className="faq-panel-inner">
                  <p className="faq-a">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </Reveal>
    </Section>
  )
}
