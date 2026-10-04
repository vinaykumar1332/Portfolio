import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Icon from './ui/Icon'

// [tokenClass, text] per line — mirrors the banner's ProductCard snippet
const LINES = [
  [['kw', 'export '], ['kw', 'const '], ['fn', 'ProductCard'], ['p', ' = (']],
  [['p', '  { '], ['var', 'product'], ['p', ' }']],
  [['p', ') => {']],
  [['p', '  '], ['kw', 'const '], ['p', 'copy = '], ['fn', 'useAI'], ['p', '(']],
  [['p', '    '], ['var', 'product'], ['p', ', '], ['str', '"title"']],
  [['p', '  );']],
  [['p', '  '], ['kw', 'return'], ['p', ' (']],
  [['p', '    <'], ['fn', 'Card'], ['p', ' '], ['var', 'ai'], ['p', '>']],
  [['p', '      {copy}']],
  [['p', '    </'], ['fn', 'Card'], ['p', '>']],
  [['p', '  );']],
  [['p', '};']],
]

const lineLengths = LINES.map((l) => l.reduce((n, [, t]) => n + t.length, 0))
const TOTAL = lineLengths.reduce((a, b) => a + b, 0)
// Character count at which the "{copy}" line has been fully typed
const COPY_AT = lineLengths.slice(0, 9).reduce((a, b) => a + b, 0)

function renderTyped(count) {
  let left = count
  return LINES.map((tokens, li) => {
    const parts = []
    for (const [cls, text] of tokens) {
      if (left <= 0) break
      const slice = text.slice(0, left)
      left -= slice.length
      parts.push(
        <span key={parts.length} className={`tk-${cls}`}>
          {slice}
        </span>,
      )
    }
    return { li, parts }
  })
}

export default function CodeWindow({ file, tab, previewLabel, previewTitle, previewBadge }) {
  const reduce = useReducedMotion()
  const [typed, setCount] = useState(0)
  const count = reduce ? TOTAL : typed

  // Type one character at a time, with a slight human-like jitter
  useEffect(() => {
    if (reduce || count >= TOTAL) return
    const delay = count === 0 ? 900 : 22 + Math.random() * 38
    const timer = setTimeout(() => setCount((c) => Math.min(c + 1, TOTAL)), delay)
    return () => clearTimeout(timer)
  }, [count, reduce])

  const lines = renderTyped(count)
  // Which line the caret currently sits on
  let caretLine = 0
  for (let i = 0, acc = 0; i < lineLengths.length; i++) {
    acc += lineLengths[i]
    caretLine = i
    if (count < acc) break
  }

  const phase = count < COPY_AT ? 'idle' : count < TOTAL ? 'generating' : 'done'

  return (
    <div className="code-window">
      <div className="code-window-bar">
        <span className="win-dot win-dot--red" />
        <span className="win-dot win-dot--yellow" />
        <span className="win-dot win-dot--green" />
        <span className="code-window-file mono">{file}</span>
        <span className="code-window-sep mono">·</span>
        <span className="code-window-tab mono">{tab}</span>
      </div>

      <div className="code-window-body">
        <pre className="code mono">
          {lines.map(({ li, parts }) => (
            <span className="code-line" key={li}>
              <span className="code-ln">{li + 1}</span>
              <span className="code-src">
                {parts}
                {li === caretLine && <span className="caret" />}
              </span>
            </span>
          ))}
        </pre>

        <div className="preview">
          <p className="preview-label mono">{previewLabel}</p>
          <div className="preview-card" data-phase={phase}>
            <div className="preview-img">
              <motion.span
                animate={phase === 'done' ? { scale: [0.8, 1.08, 1], opacity: 1 } : { scale: 0.9, opacity: 0.55 }}
                transition={{ duration: 0.6 }}
              >
                <Icon name="shirt" />
              </motion.span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'done' ? (
                <motion.p
                  key="title"
                  className="preview-title"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {previewTitle}
                </motion.p>
              ) : (
                <motion.span key="sk" className="sk sk--lg" exit={{ opacity: 0 }} />
              )}
            </AnimatePresence>
            <span className="sk sk--md" />
            <span className="sk sk--sm" />
            <AnimatePresence>
              {phase === 'done' && (
                <motion.span
                  className="preview-badge"
                  initial={{ opacity: 0, scale: 0.6, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 }}
                >
                  ✦ {previewBadge}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.span
            className="preview-cursor"
            animate={reduce ? undefined : { x: [0, -38, -38, 0], y: [0, -46, -46, 0], scale: [1, 1, 0.85, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.35, 0.45, 1], ease: 'easeInOut' }}
          >
            <Icon name="cursor" />
          </motion.span>
        </div>
      </div>
    </div>
  )
}
