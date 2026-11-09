import { m } from 'motion/react'
import { EASE } from '../../lib/motion'

const OFFSETS = {
  up: { y: 28 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.96 },
}

/** Fades + slides children into view once, as the user scrolls. */
export default function Reveal({ as = 'div', from = 'up', delay = 0, className, children, ...rest }) {
  const Tag = m[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, filter: 'blur(8px)', ...OFFSETS[from] }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.1, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
