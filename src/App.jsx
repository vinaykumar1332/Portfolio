import { useEffect } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import config from './config/portfolio.json'
import { handleAnchorClick, initSmoothScroll, scrollToTarget } from './lib/smoothScroll'
import Background from './components/Background'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Journey from './components/Journey'
import Services from './components/Services'
import Projects from './components/Projects'
import WorkWithMe from './components/WorkWithMe'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import ScrollUI from './components/ScrollUI'

// Animation features load in a separate chunk so they don't block first paint
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default)

export default function App() {
  useEffect(() => {
    document.title = config.meta.title
    const destroy = initSmoothScroll()
    document.addEventListener('click', handleAnchorClick)

    // Honour a #hash in the URL on first load
    if (window.location.hash.length > 1) {
      requestAnimationFrame(() => scrollToTarget(window.location.hash))
    }
    return () => {
      destroy()
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Background />
        <ScrollUI />
        <Header />
        <main id="main" tabIndex={-1}>
          <Hero />
          <About />
          <Skills />
          <Journey />
          <Services />
          <Projects />
          <WorkWithMe />
          <Testimonials />
          <Contact />
        </main>
        <Footer />
      </MotionConfig>
    </LazyMotion>
  )
}
