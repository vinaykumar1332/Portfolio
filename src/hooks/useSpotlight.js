/** Pointer-follow glow for cards: sets --mx / --my CSS variables on hover. */
export function useSpotlight() {
  return {
    onPointerMove: (e) => {
      if (e.pointerType !== 'mouse') return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    },
  }
}
