import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'

/** Fixed dot grid + glows that drift with scroll, like the banner. */
export default function Background() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const amberY = useTransform(scrollYProgress, [0, 1], ['0vh', reduce ? '0vh' : '70vh'])
  const tealY = useTransform(scrollYProgress, [0, 1], ['0vh', reduce ? '0vh' : '-50vh'])

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-dots" />
      <m.div className="bg-glow bg-glow--amber" style={{ y: amberY }} />
      <m.div className="bg-glow bg-glow--teal" style={{ y: tealY }} />
    </div>
  )
}
