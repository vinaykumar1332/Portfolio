import config from '../config/portfolio.json'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'

const { meta, nav, socials, footer } = config
const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <Reveal className="container footer-inner">
        <div className="footer-brand">
          <p className="footer-name">{meta.name}</p>
          <p className="footer-role mono">{footer.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="footer-links">
            {nav.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="footer-socials" aria-label="Social profiles">
          {socials.map((s) => (
            <li key={s.label}>
              <a className="icon-btn" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`}>
                <Icon name={s.icon} />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
      <div className="container footer-bottom mono">
        <span>
          © {YEAR} · {footer.credit}
        </span>
        <span>
          {meta.siteLabel}
          <b>{meta.siteLabelAccent}</b>
        </span>
      </div>
    </footer>
  )
}
