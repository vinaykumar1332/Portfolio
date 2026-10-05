import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { EASE } from '../../lib/motion'

const format = (v, suffix) => `${Math.round(v).toString().padStart(2, '0')}${suffix}`

/** Counts from 0 to `value` the first time it scrolls into view. */
export default function CountUp({ value, suffix = '', duration = 1.6 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!inView || !ref.current) return
    if (reduce) {
      ref.current.textContent = format(value, suffix)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v, suffix)
      },
    })
    return () => controls.stop()
  }, [inView, value, suffix, duration, reduce])

  return <span ref={ref}>{format(0, suffix)}</span>
}
