import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import config from '../config/portfolio.json'
import ContactBuddy from './ContactBuddy'
import Icon from './ui/Icon'
import Reveal from './ui/Reveal'
import { inViewOnce, staggerChild, staggerParent } from '../lib/motion'
import Section from './ui/Section'
import { CONTACT_TOPIC_EVENT } from '../lib/events'

const { contact, socials } = config
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  if (values.message.trim().length < 10) errors.message = 'Please write at least 10 characters.'
  return errors
}

function Field({ id, label, error, as = 'input', ...props }) {
  const Tag = as
  return (
    <div className="field" data-invalid={!!error}>
      <Tag id={id} name={id} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      <label htmlFor={id}>{label}</label>
      <AnimatePresence>
        {error && (
          <m.p id={`${id}-err`} className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Icon name="alert" /> {error}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Contact() {
  const [values, setValues] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [copied, setCopied] = useState(false)
  const [topic, setTopic] = useState(contact.topics[0].id)
  const formRef = useRef(null)
  const activeTopic = contact.topics.find((t) => t.id === topic)

  // Signals for the character above the form
  const [focused, setFocused] = useState(null)
  const [typing, setTyping] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [hoverSend, setHoverSend] = useState(false)
  const typingTimer = useRef(0)
  const invalidTimer = useRef(0)
  useEffect(() => () => {
    clearTimeout(typingTimer.current)
    clearTimeout(invalidTimer.current)
  }, [])

  // "Start a project" / similar CTAs preselect a topic
  useEffect(() => {
    const onTopic = (e) => contact.topics.some((t) => t.id === e.detail) && setTopic(e.detail)
    window.addEventListener(CONTACT_TOPIC_EVENT, onTopic)
    return () => window.removeEventListener(CONTACT_TOPIC_EVENT, onTopic)
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
    if (status === 'sent' || status === 'error') setStatus('idle')
    setTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 800)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (e.target._honey.value) return // bot trap
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) {
      setInvalid(true)
      clearTimeout(invalidTimer.current)
      invalidTimer.current = setTimeout(() => setInvalid(false), 2200)
      formRef.current?.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus()
      return
    }
    setStatus('sending')
    try {
      const res = await fetch(contact.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...values, topic: activeTopic.label, _subject: `Portfolio · ${activeTopic.label} · ${values.name}` }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('sent')
      setValues({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
    } catch {
      const t = document.createElement('textarea')
      t.value = contact.email
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sending = status === 'sending'

  const mood =
    status === 'sending' ? 'sending'
    : status === 'sent' ? 'sent'
    : status === 'error' ? 'error'
    : invalid ? 'invalid'
    : typing ? 'typing'
    : focused ? 'watching'
    : hoverSend ? 'excited'
    : 'idle'
  const bubble =
    ['sending', 'sent', 'error', 'invalid', 'excited'].includes(mood) ? contact.buddy[mood]
    : contact.buddy[focused] ?? activeTopic.greeting

  return (
    <Section id="contact" index={9} eyebrow={contact.eyebrow} title={contact.title}>
      <div className="contact-grid">
        <Reveal from="left" className="contact-side">
          <h3 className="contact-heading">{contact.heading}</h3>
          <p className="contact-text">{contact.text}</p>
          {contact.location && (
            <p className="contact-location">
              <Icon name="pin" /> Based in {contact.location} · open to remote
            </p>
          )}

          <div className="email-card card">
            <span className="email-card-icon" aria-hidden="true">
              <Icon name="mail" />
            </span>
            <div className="email-card-body">
              <span className="email-card-label mono">EMAIL</span>
              <a className="email-card-value" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </div>
            <button type="button" className="icon-btn copy-btn" onClick={copyEmail} aria-label="Copy email address" data-copied={copied}>
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={copied ? 'ok' : 'copy'} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <Icon name={copied ? 'check' : 'copy'} />
                </m.span>
              </AnimatePresence>
            </button>
            <span className="sr-only" role="status" aria-live="polite">
              {copied ? 'Email address copied' : ''}
            </span>
            <AnimatePresence>
              {copied && (
                <m.span className="copy-tip mono" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} aria-hidden="true">
                  Copied!
                </m.span>
              )}
            </AnimatePresence>
          </div>

          <m.ul className="contact-socials" initial="hidden" whileInView="show" viewport={inViewOnce} variants={staggerParent}>
            {socials.map((s) => (
              <m.li key={s.label} variants={staggerChild}>
                <a className="social-card card" href={s.url} target="_blank" rel="noopener noreferrer">
                  <span className="social-card-icon" aria-hidden="true">
                    <Icon name={s.icon} />
                  </span>
                  <span className="social-card-body">
                    <span className="social-card-label">{s.label}</span>
                    <span className="social-card-handle mono">@{s.handle}</span>
                  </span>
                  <Icon name="arrow-up-right" className="social-card-arrow" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </m.li>
            ))}
          </m.ul>
        </Reveal>

        <Reveal from="right" className="contact-form-wrap">
          <ContactBuddy mood={mood} message={bubble} formRef={formRef} />
          <form
            ref={formRef}
            className="contact-form card"
            onSubmit={onSubmit}
            onFocus={(e) => setFocused(e.target.name || null)}
            onBlur={() => setFocused(null)}
            noValidate
          >
            <fieldset className="topics">
              <legend className="topics-legend mono">I'm reaching out about</legend>
              {contact.topics.map((t) => (
                <label key={t.id} className="topic" data-active={t.id === topic}>
                  <input type="radio" name="topic" value={t.id} checked={t.id === topic} onChange={() => setTopic(t.id)} />
                  {t.id === topic && <m.span layoutId="topic-pill" className="topic-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <span className="topic-text">{t.label}</span>
                </label>
              ))}
            </fieldset>
            <Field id="name" label="Your name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} required />
            <Field id="email" label="Email address" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} required />
            <Field id="message" as="textarea" label={activeTopic.placeholder} rows={5} value={values.message} onChange={onChange} error={errors.message} required />
            <input type="text" name="_honey" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <button
              type="submit"
              className="btn btn-primary btn-send"
              data-status={status}
              disabled={sending}
              onPointerEnter={() => setHoverSend(true)}
              onPointerLeave={() => setHoverSend(false)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={status} className="btn-send-inner" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {sending ? (
                    <>
                      Sending <Icon name="loader" className="spin" />
                    </>
                  ) : status === 'sent' ? (
                    <>
                      Sent <Icon name="check" />
                    </>
                  ) : (
                    <>
                      Send message <Icon name="send" className="btn-send-icon" />
                    </>
                  )}
                </m.span>
              </AnimatePresence>
            </button>

            <p className="form-status" role="status" aria-live="polite" data-status={status}>
              {status === 'sent' && contact.successMessage}
              {status === 'error' && (
                <>
                  {contact.errorMessage} <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </>
              )}
            </p>
          </form>
        </Reveal>
      </div>
    </Section>
  )
}
