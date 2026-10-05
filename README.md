# Vinay Kumar Pudi — Portfolio

React 19 + Vite 8 portfolio. Every piece of text, every image and every link comes from one config file.

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve the build locally
npm run lint
```

## Editing content

All content lives in [`src/config/portfolio.json`](src/config/portfolio.json): hero text, about, stats, skills, journey, services, projects, testimonials, contact, socials and footer.

- **Images** go in `public/images/` and are referenced as `{ "src": "images/name.webp", "alt": "...", "width": 1280, "height": 600 }`. They are all rendered by the shared `<Img>` component (`src/components/ui/Img.jsx`), which handles the base path, lazy loading, a shimmer placeholder and an error fallback. Prefer WebP at ≤1280px wide.
- **Icons** are referenced by short names (`"github"`, `"react"`, `"mobile"` …) and mapped in `src/components/ui/Icon.jsx`. To add a new icon, import it there.
- **Resume**: replace `public/files/Vinay_Kumar_Frontend_Developer_Resume.pdf` (or change `about.resume.file`; update `about.resume.size` too).
- **Years of experience** are calculated from `about.experienceStart`.

## SEO

All SEO comes from the `seo` block in `portfolio.json` (title, description, keywords, site URL, share image). At build time [`seo.plugin.js`](seo.plugin.js) generates:

- `<title>`, meta description, canonical URL, Open Graph and Twitter/X card tags
- JSON-LD structured data (`Person`, `WebSite`, `ProfilePage`) for Google
- a crawlable `<noscript>` summary (about, experience, projects, contact)
- `robots.txt` and `sitemap.xml`

If the site moves to a new address, update `seo.siteUrl`. The share image is `public/og-image.jpg` (1200×630).

## Structure

```
src/
  config/portfolio.json   ← all content
  components/             ← one component per section
  components/ui/          ← shared: Img, Icon, Reveal, Section, CountUp
  hooks/                  ← theme, active section, card spotlight
  lib/                    ← asset paths, smooth scroll (Lenis), motion presets
  index.css               ← theme tokens (dark + light) and all styles
```

## Notes

- Smooth scrolling uses Lenis; animations use `motion`. Both switch off automatically when the visitor has "reduce motion" enabled.
- `vite.config.js` uses `base: './'`, so the build works from a GitHub Pages sub-path.
- Fonts (Inter, JetBrains Mono) are self-hosted through Fontsource — no third-party font requests.
