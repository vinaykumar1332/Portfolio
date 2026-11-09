// Vercel serverless function: validates and forwards contact-form submissions.
// Browsers post to /api/contact; the real FormSubmit endpoint lives only here.

const FORWARD_URL = 'https://formsubmit.co/ajax/cc5b87a9c6061b6362d9231d23f3789c'
const TOPICS = ['Job opportunity', 'Freelance project', 'Just saying hi']
const ALLOWED_ORIGINS = ['https://vinaytech.space', 'https://www.vinaytech.space']
const LOCALHOST_ORIGIN = /^https?:\/\/localhost(:\d+)?$/
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/
const MAX_BODY_BYTES = 8 * 1024
const FORWARD_TIMEOUT_MS = 10000

// Best-effort rate limit: per warm instance, so it is a speed bump, not a hard guarantee.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const MAX_TRACKED_IPS = 5000
const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  const limited = recent.length >= MAX_PER_WINDOW
  if (!limited) recent.push(now)
  hits.set(ip, recent)
  if (hits.size > MAX_TRACKED_IPS) hits.clear()
  return limited
}

// Remove control characters (including newlines, which could inject mail headers).
// oxlint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g
// oxlint-disable-next-line no-control-regex
const MESSAGE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

const clean = (value, max) =>
  String(value ?? '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max)

const cleanMessage = (value, max) =>
  String(value ?? '')
    .replace(MESSAGE_CONTROL_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max)

function parseBody(req) {
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null
}

/** Returns an error response descriptor for requests that must not reach the form logic, or null. */
function checkRequest(req, ip) {
  if (req.method !== 'POST') return { status: 405, error: 'Method not allowed', allow: 'POST' }

  const origin = req.headers.origin
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !LOCALHOST_ORIGIN.test(origin)) {
    return { status: 403, error: 'Forbidden origin' }
  }
  if (rateLimited(ip)) return { status: 429, error: 'Too many messages. Please try again later.' }

  const contentType = String(req.headers['content-type'] || '')
  if (!contentType.includes('application/json')) return { status: 415, error: 'Unsupported content type' }

  if (JSON.stringify(req.body ?? '').length > MAX_BODY_BYTES) {
    return { status: 413, error: 'Message is too large' }
  }
  return null
}

/** Cleans the submitted fields and collects validation messages. */
function readFields(body) {
  const fields = {
    name: clean(body.name, 100),
    email: clean(body.email, 254),
    message: cleanMessage(body.message, 3000),
    topic: clean(body.topic, 60),
  }
  const errors = {}
  if (fields.name.length < 2) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(fields.email)) errors.email = 'Please enter a valid email address.'
  if (fields.message.length < 10) errors.message = 'Please write at least 10 characters.'
  if (!TOPICS.includes(fields.topic)) errors.topic = 'Please choose a topic.'
  return { fields, errors }
}

async function forward({ name, email, message, topic }) {
  const upstream = await fetch(FORWARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name,
      email,
      message,
      topic,
      _subject: `Portfolio · ${topic} · ${name}`.slice(0, 200),
      _captcha: 'false',
    }),
    signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
  })
  if (!upstream.ok) throw new Error(`upstream ${upstream.status}`)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const rejected = checkRequest(req, ip)
  if (rejected) {
    if (rejected.allow) res.setHeader('Allow', rejected.allow)
    return res.status(rejected.status).json({ ok: false, error: rejected.error })
  }

  const body = parseBody(req)
  if (!body) return res.status(400).json({ ok: false, error: 'Invalid request' })

  // Honeypot: bots fill hidden fields. Pretend success so they learn nothing.
  // The field name is fixed by the form, so the underscore rule does not apply.
  // oxlint-disable-next-line no-underscore-dangle
  if (body._honey) return res.status(200).json({ ok: true })

  const { fields, errors } = readFields(body)
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors })

  try {
    await forward(fields)
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(502).json({ ok: false, error: 'Could not send right now' })
  }
}
