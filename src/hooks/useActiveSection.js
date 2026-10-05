import { useEffect, useState } from 'react'

/** Returns the id of the section currently crossing the middle band of the viewport. */
export function useActiveSection(ids) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => observer.observe(s))

    // Clear the highlight when back at the hero
    const home = document.getElementById('home')
    const homeObserver = new IntersectionObserver(([e]) => e.isIntersecting && setActive(''), {
      rootMargin: '-45% 0px -50% 0px',
    })
    if (home) homeObserver.observe(home)

    return () => {
      observer.disconnect()
      homeObserver.disconnect()
    }
  }, [ids])

  return active
}
