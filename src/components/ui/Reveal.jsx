import { m } from 'motion/react'
import { EASE } from '../../lib/motion'

const OFFSETS = {
  up: { y: 40 },
  left: { x: -48 },
  right: { x: 48 },
  scale: { scale: 0.94 },
}

/** Fades + slides children into view once, as the user scrolls. */
export default function Reveal({ as = 'div', from = 'up', delay = 0, className, children, ...rest }) {
  const Tag = m[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, ...OFFSETS[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
