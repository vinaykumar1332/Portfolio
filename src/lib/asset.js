// Resolve a config path (e.g. "images/about.webp") against Vite's base URL,
// so images and files work both locally and under a GitHub Pages sub-path.
export function asset(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
