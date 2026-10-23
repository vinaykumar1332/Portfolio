import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { asset } from '../lib/asset'

const MIN_DURATION = 1600 // keep the animation readable even when the file is cached
const RESET_AFTER = 3800

/** Fetch the file while reporting real byte progress (when the server sends a length). */
async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length')) || 0
  if (!res.body || !total) return res.blob()

  const reader = res.body.getReader()
  const chunks = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(received / total)
  }
  return new Blob(chunks, { type: res.headers.get('content-type') || 'application/pdf' })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

const PAGE_PATH = 'M3 3a2 2 0 0 1 2-2h10l6 6v18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'

/**
 * A copy of the document flies in an arc to where the browser shows downloads:
 * the toolbar (top right) on desktop, the bottom bar on phones.
 */
function flyToDownloads(fromEl) {
  const r = fromEl.getBoundingClientRect()
  const phone = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
  const to = phone ? { x: window.innerWidth / 2, y: window.innerHeight - 28 } : { x: window.innerWidth - 56, y: 20 }
  const from = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  const dx = to.x - from.x
  const dy = to.y - from.y

  const page = document.createElement('div')
  page.className = 'dl-fly'
  page.setAttribute('aria-hidden', 'true')
  page.innerHTML = `<svg viewBox="0 0 24 28"><path d="${PAGE_PATH}"/><path class="dl-fly-lines" d="M7 12h10M7 16h10M7 20h6"/></svg>`
  page.style.left = `${from.x}px`
  page.style.top = `${from.y}px`
  document.body.appendChild(page)

  // Arc: rise up first (or dip down on phones), then sweep to the target
  const lift = phone ? 90 : -110
  const flight = page.animate(
    [
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% + ${dy * 0.2 + lift}px)) scale(1.25) rotate(-14deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${dx * 0.9}px), calc(-50% + ${dy * 0.9}px)) scale(0.6) rotate(4deg)`, opacity: 1, offset: 0.85 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4) rotate(8deg)`, opacity: 0 },
    ],
    { duration: 1100, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' },
  )

  flight.finished
    .then(() => {
      page.remove()
      // Ping where it "lands"
      const ping = document.createElement('div')
      ping.className = 'dl-ping'
      ping.setAttribute('aria-hidden', 'true')
      ping.style.left = `${to.x}px`
      ping.style.top = `${to.y}px`
      document.body.appendChild(ping)
      ping
        .animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0.9 },
            { transform: 'translate(-50%, -50%) scale(2.4)', opacity: 0 },
          ],
          { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )
        .finished.finally(() => ping.remove())
    })
    .catch(() => page.remove())
}

/** Page icon: an arrow drops into it while loading, then it turns into a check. */
function DocIcon({ state }) {
  return (
    <svg className="doc" viewBox="0 0 24 28" aria-hidden="true">
      <path className="doc-body" d={PAGE_PATH} />
      <path className="doc-fold" d="M15 1v4a2 2 0 0 0 2 2h4" />
      <AnimatePresence mode="wait" initial={false}>
        {state === 'done' ? (
          <m.path
            key="check"
            className="doc-mark"
            d="M7.5 16l3 3 6-6.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          />
        ) : (
          <m.g
            key="arrow"
            className="doc-mark"
            initial={{ y: -6, opacity: 0 }}
            animate={state === 'loading' ? { y: [-3, 3, -3], opacity: 1 } : { y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0, transition: { duration: 0.15 } }}
            transition={state === 'loading' ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <path d="M12 10v8" />
            <path d="M8.5 15l3.5 3.5 3.5-3.5" />
          </m.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

export default function ResumeButton({ file, downloadName, size, label, busyLabel, doneLabel, errorLabel }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [progress, setProgress] = useState(0)
  const reduce = useReducedMotion()
  const resetTimer = useRef()
  const iconRef = useRef(null)
  const href = asset(file)
  const statusId = useId()

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const onClick = async (e) => {
    e.preventDefault()
    if (state === 'loading') return
    clearTimeout(resetTimer.current)
    setState('loading')
    setProgress(0)

    // The counter eases to 100% over the animation, but never runs ahead of the
    // real byte progress (or past 94% when the server doesn't report a size)
    const started = performance.now()
    let real = null
    const duration = reduce ? 300 : MIN_DURATION
    const ticker = setInterval(() => {
      const t = Math.min((performance.now() - started) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.min(eased, real === null ? 0.94 : Math.max(real, 0.05)))
    }, 30)

    try {
      const blob = await fetchWithProgress(href, (p) => (real = p))
      const elapsed = performance.now() - started
      if (elapsed < duration) await sleep(duration - elapsed)
      clearInterval(ticker)
      setProgress(1)
      await sleep(reduce ? 0 : 220)
      saveBlob(blob, downloadName)
      setState('done')
      if (!reduce && iconRef.current) flyToDownloads(iconRef.current)
    } catch {
      clearInterval(ticker)
      setState('error')
      window.open(href, '_blank', 'noopener')
    }
    resetTimer.current = setTimeout(() => {
      setState('idle')
      setProgress(0)
    }, RESET_AFTER)
  }

  const text = { idle: label, loading: busyLabel, done: doneLabel, error: errorLabel }[state]
  const meta = state === 'loading' ? `${Math.round(progress * 100)}%` : state === 'done' ? 'PDF ✓' : `PDF · ${size}`

  return (
    <>
      <m.a
        href={href}
        download={downloadName}
        className="btn btn-download"
        data-state={state}
        style={{ '--p': progress }}
        onClick={onClick}
        aria-describedby={statusId}
        aria-busy={state === 'loading'}
        whileTap={{ scale: 0.96 }}
        animate={state === 'error' && !reduce ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* progress fills the whole pill from left to right */}
        <span className="btn-download-fill" aria-hidden="true" />

        <span ref={iconRef} className="btn-download-icon">
          <DocIcon state={state} />
        </span>

        <span className="btn-download-label">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={state}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-110%', opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {text}
            </m.span>
          </AnimatePresence>
        </span>

        <span className="btn-download-meta mono">{meta}</span>
      </m.a>
      <span id={statusId} className="sr-only" role="status" aria-live="polite">
        {state === 'done' ? 'Resume downloaded.' : state === 'error' ? 'Download failed, opening the resume in a new tab.' : ''}
      </span>
    </>
  )
}
