import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { asset } from '../lib/asset'

const MIN_DURATION = 1800 // keep the animation readable even when the file is cached
const RESET_AFTER = 3600

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

/** Paper icon that fills with "liquid" as the download progresses. */
function DocIcon({ state, progress }) {
  const clipId = useId()
  const fillY = 26 - 22 * progress
  return (
    <svg className="doc" viewBox="0 0 24 28" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M3 3a2 2 0 0 1 2-2h10l6 6v18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </clipPath>
      </defs>
      <path className="doc-body" d="M3 3a2 2 0 0 1 2-2h10l6 6v18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <g clipPath={`url(#${clipId})`}>
        <motion.path
          className="doc-liquid"
          initial={false}
          animate={{ y: state === 'done' ? -30 : state === 'loading' ? fillY - 26 : 0, x: [0, -8, 0] }}
          transition={{ y: { duration: 0.25, ease: 'linear' }, x: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } }}
          d="M-4 26 q 4 -2.5 8 0 t 8 0 t 8 0 t 8 0 t 8 0 V70 H-4z"
        />
      </g>
      <path className="doc-fold" d="M15 1v4a2 2 0 0 0 2 2h4" />
      <AnimatePresence mode="wait" initial={false}>
        {state === 'done' ? (
          <motion.path
            key="check"
            className="doc-mark"
            d="M7.5 15.5l3 3 6-6.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          />
        ) : (
          <motion.g
            key="arrow"
            className="doc-mark"
            initial={{ y: -6, opacity: 0 }}
            animate={state === 'loading' ? { y: [0, 4, 0], opacity: 1 } : { y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0, transition: { duration: 0.15 } }}
            transition={state === 'loading' ? { duration: 0.8, repeat: Infinity } : { duration: 0.3 }}
          >
            <path d="M12 10v8" />
            <path d="M8.5 15l3.5 3.5 3.5-3.5" />
          </motion.g>
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
  const href = asset(file)
  const statusId = useId()

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const onClick = async (e) => {
    e.preventDefault()
    if (state === 'loading') return
    clearTimeout(resetTimer.current)
    setState('loading')
    setProgress(0)

    // Visual progress eases toward 92% while the real download runs
    const started = performance.now()
    let real = 0
    const duration = reduce ? 300 : MIN_DURATION
    const ticker = setInterval(() => {
      const t = Math.min((performance.now() - started) / duration, 1)
      setProgress(Math.max(real * 0.92, 0.92 * (1 - Math.pow(1 - t, 3))))
    }, 30)

    try {
      const blob = await fetchWithProgress(href, (p) => (real = p))
      const elapsed = performance.now() - started
      if (elapsed < duration) await sleep(duration - elapsed)
      clearInterval(ticker)
      setProgress(1)
      await sleep(reduce ? 0 : 250)
      saveBlob(blob, downloadName)
      setState('done')
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
  const meta = state === 'loading' ? `${Math.round(progress * 100)}%` : state === 'done' ? '✓' : `PDF · ${size}`

  return (
    <>
      <motion.a
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
        <span className="btn-download-ring" aria-hidden="true" />
        <span className="btn-download-shine" aria-hidden="true" />

        <span className="btn-download-icon">
          <DocIcon state={state} progress={progress} />
        </span>

        <span className="btn-download-label">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              initial={{ y: '110%', opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-110%', opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {text}
            </motion.span>
          </AnimatePresence>
        </span>

        <span className="btn-download-meta mono">{meta}</span>

        {state === 'done' && !reduce && (
          <span className="dl-burst" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ '--i': i, '--d': `${40 + (i % 3) * 14}px` }} />
            ))}
          </span>
        )}
      </motion.a>
      <span id={statusId} className="sr-only" role="status" aria-live="polite">
        {state === 'done' ? 'Resume downloaded.' : state === 'error' ? 'Download failed, opening the resume in a new tab.' : ''}
      </span>
    </>
  )
}
