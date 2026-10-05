import Reveal from './Reveal'

/** Common section shell: numbered mono eyebrow, title and optional lead. */
export default function Section({ id, index, eyebrow, title, lead, className = '', children }) {
  const titleId = `${id}-title`
  return (
    <section id={id} className={`section ${className}`} aria-labelledby={titleId}>
      <div className="container">
        <Reveal as="header" className="section-head">
          <p className="section-eyebrow mono">
            <span className="section-index">{String(index).padStart(2, '0')}</span>
            <span className="section-slash">//</span>
            {eyebrow}
          </p>
          <h2 className="section-title" id={titleId}>
            {title}
          </h2>
          {lead && <p className="section-lead">{lead}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
