import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'

function ParallaxGlows() {
  const { scrollYProgress } = useScroll()
  const amberY = useTransform(scrollYProgress, [0, 1], ['0vh', '70vh'])
  const tealY = useTransform(scrollYProgress, [0, 1], ['0vh', '-50vh'])

  return (
    <>
      <m.div className="bg-glow bg-glow--parallax bg-glow--amber" style={{ y: amberY }} />
      <m.div className="bg-glow bg-glow--parallax bg-glow--teal" style={{ y: tealY }} />
    </>
  )
}

/** Fixed dot grid + subtle scroll parallax, disabled for reduced-motion users. */
export default function Background() {
  const reduce = useReducedMotion()

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-dots" />
      {reduce ? (
        <>
          <div className="bg-glow bg-glow--amber" />
          <div className="bg-glow bg-glow--teal" />
        </>
      ) : (
        <ParallaxGlows />
      )}
    </div>
  )
}
