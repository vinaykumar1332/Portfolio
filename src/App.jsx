import { lazy, Suspense, useEffect } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import config from './config/portfolio.json'
import { handleAnchorClick, initSmoothScroll, scrollToTarget } from './lib/smoothScroll'
import Background from './components/Background'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Footer from './components/Footer'
import ScrollUI from './components/ScrollUI'
import WelcomeToast from './components/WelcomeToast'

// Animation features load in a separate chunk so they don't block first paint
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default)

// Below-the-fold sections load as their own chunks, so the first screen arrives sooner
const sectionLoaders = {
  skills: () => import('./components/Skills'),
  journey: () => import('./components/Journey'),
  services: () => import('./components/Services'),
  projects: () => import('./components/Projects'),
  'work-with-me': () => import('./components/WorkWithMe'),
  testimonials: () => import('./components/Testimonials'),
  contact: () => import('./components/Contact'),
}
const Skills = lazy(sectionLoaders.skills)
const Journey = lazy(sectionLoaders.journey)
const Services = lazy(sectionLoaders.services)
const Projects = lazy(sectionLoaders.projects)
const WorkWithMe = lazy(sectionLoaders['work-with-me'])
const Testimonials = lazy(sectionLoaders.testimonials)
const Contact = lazy(sectionLoaders.contact)

/** Reserves the section's space while its chunk loads, so the page doesn't jump. */
function SectionPlaceholder({ id }) {
  return <div className="section-placeholder" data-section={id} aria-hidden="true" />
}

/** Scroll to a #hash on first load, waiting for a lazy section to mount first. */
function scrollToHashWhenReady(hash, tries = 0) {
  if (document.querySelector(hash) || tries > 120) {
    scrollToTarget(hash)
    return
  }
  requestAnimationFrame(() => scrollToHashWhenReady(hash, tries + 1))
}

export default function App() {
  useEffect(() => {
    document.title = config.meta.title
    const destroy = initSmoothScroll()
    document.addEventListener('click', handleAnchorClick)

    // Honour a #hash in the URL on first load
    if (window.location.hash.length > 1) {
      scrollToHashWhenReady(window.location.hash)
    }

    // Fetch the remaining sections once the first screen has settled,
    // so scrolling and nav links rarely have to wait for a chunk
    const prefetch = window.setTimeout(() => {
      Object.values(sectionLoaders).forEach((load) => load())
    }, 1200)

    return () => {
      window.clearTimeout(prefetch)
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
        <WelcomeToast />
        <Header />
        <main id="main" tabIndex={-1}>
          <Hero />
          <About />
          <Suspense fallback={<SectionPlaceholder id="skills" />}>
            <Skills />
          </Suspense>
          <Suspense fallback={<SectionPlaceholder id="journey" />}>
            <Journey />
          </Suspense>
          <Suspense fallback={<SectionPlaceholder id="services" />}>
            <Services />
          </Suspense>
          <Suspense fallback={<SectionPlaceholder id="projects" />}>
            <Projects />
          </Suspense>
          <Suspense fallback={<SectionPlaceholder id="work-with-me" />}>
            <WorkWithMe />
          </Suspense>
          <Suspense fallback={<SectionPlaceholder id="testimonials" />}>
            <Testimonials />
          </Suspense>
          <Suspense fallback={<SectionPlaceholder id="contact" />}>
            <Contact />
          </Suspense>
        </main>
        <Footer />
      </MotionConfig>
    </LazyMotion>
  )
}
