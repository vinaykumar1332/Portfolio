import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Builds all <head> SEO tags, structured data, the no-JS fallback,
// robots.txt and sitemap.xml from src/config/portfolio.json.
const CONFIG_PATH = fileURLToPath(new URL('./src/config/portfolio.json', import.meta.url))

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
}

function headTags(c) {
  const { seo, meta, socials, about } = c
  const url = seo.siteUrl
  const image = new URL(seo.image, url).href
  const sameAs = socials.map((s) => s.url)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: meta.name,
        jobTitle: meta.role,
        description: seo.description,
        url,
        image,
        email: `mailto:${c.contact.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressCountry: 'IN' },
        worksFor: { '@type': 'Organization', name: 'Tata Consultancy Services' },
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'West Godavari Institute of Science and Engineering' },
        knowsAbout: c.skills.items.map((s) => s.name),
        sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: `${meta.name} — Portfolio`,
        inLanguage: 'en',
        author: { '@id': `${url}#person` },
      },
      {
        '@type': 'ProfilePage',
        url,
        name: seo.title,
        mainEntity: { '@id': `${url}#person` },
        ...(about.resume?.file && { relatedLink: new URL(about.resume.file, url).href }),
      },
    ],
  }

  return [
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="keywords" content="${esc(seo.keywords.join(', '))}" />`,
    `<meta name="author" content="${esc(meta.name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${esc(url)}" />`,

    // Open Graph (LinkedIn, WhatsApp, Facebook, Slack…)
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${esc(meta.name)}" />`,
    `<meta property="og:locale" content="${esc(seo.locale)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(seo.imageAlt)}" />`,
    `<meta property="profile:first_name" content="Vinay Kumar" />`,
    `<meta property="profile:last_name" content="Pudi" />`,

    // X / Twitter
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(seo.imageAlt)}" />`,

    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

/** Plain, crawlable summary for visitors and bots without JavaScript. */
function noscriptBody(c) {
  const { meta, seo, about, contact, socials, projects, journey } = c
  const work = journey.tabs.find((t) => t.id === 'work')?.items ?? []
  return `<main style="font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;color:#eef0f5;line-height:1.6">
        <h1>${esc(meta.name)} — ${esc(meta.role)}</h1>
        <p>${esc(seo.description)}</p>
        ${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
        <h2>Experience</h2>
        <ul>${work.map((w) => `<li>${esc(w.title)} — ${esc(w.place)} (${esc(w.period)})</li>`).join('')}</ul>
        <h2>Projects</h2>
        <ul>${projects.items.map((p) => `<li><a style="color:#f5a623" href="${esc(p.url)}">${esc(p.title)}</a> — ${esc(p.description)}</li>`).join('')}</ul>
        <h2>Contact</h2>
        <p>Email: <a style="color:#f5a623" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a> ·
        <a style="color:#f5a623" href="./${esc(about.resume.file)}">Download resume (PDF)</a></p>
        <p>${socials.map((s) => `<a style="color:#f5a623" href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>
      </main>`
}

export default function seoPlugin() {
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      const c = readConfig()
      return html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.seo.title)}</title>`)
        .replace('<!--SEO_HEAD-->', headTags(c))
        .replace('<!--NOSCRIPT_BODY-->', noscriptBody(c))
        .replaceAll('%THEME_COLOR%', c.seo.themeColor)
    },
    generateBundle() {
      const { seo } = readConfig()
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', seo.siteUrl).href}\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${seo.siteUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}
