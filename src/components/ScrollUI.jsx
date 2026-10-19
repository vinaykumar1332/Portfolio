import { useState } from 'react'
import { AnimatePresence, m, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import Icon from './ui/Icon'

/** Top progress bar + back-to-top button with a progress ring. */
export default function ScrollUI() {
  const { scrollY, scrollYProgress } = useScroll()
  const dash = useTransform(scrollYProgress, (p) => 126 * (1 - p))
  const [show, setShow] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => setShow(y > window.innerHeight * 0.8))

  return (
    <>
      <m.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      <AnimatePresence>
        {show && (
          <m.a
            href="#home"
            className="to-top"
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.92 }}
          >
            <svg className="to-top-ring" viewBox="0 0 44 44" aria-hidden="true">
              <circle cx="22" cy="22" r="20" className="to-top-track" />
              <m.circle cx="22" cy="22" r="20" className="to-top-bar" strokeDasharray="126" style={{ strokeDashoffset: dash }} />
            </svg>
            <Icon name="arrow-up" />
          </m.a>
        )}
      </AnimatePresence>
    </>
  )
}
