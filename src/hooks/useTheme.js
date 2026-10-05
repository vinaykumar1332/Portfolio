import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'

const KEY = 'vk-theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')

  const toggle = useCallback(
    (event) => {
      const next = theme === 'dark' ? 'light' : 'dark'
      const apply = () => {
        flushSync(() => setTheme(next))
        document.documentElement.dataset.theme = next
        try {
          localStorage.setItem(KEY, next)
        } catch {
          /* storage unavailable — theme still applies for this visit */
        }
      }

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!document.startViewTransition || reduce || !event) return apply()

      // Circular reveal that grows out of the toggle button
      const rect = event.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

      document.startViewTransition(apply).ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
    },
    [theme],
  )

  return { theme, toggle }
}
