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
  const names = seo.alternateNames ?? []
  const geo = seo.geo ?? {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: meta.name,
        alternateName: names,
        givenName: 'Vinay Kumar',
        familyName: 'Pudi',
        jobTitle: meta.role,
        description: seo.description,
        url,
        image,
        email: `mailto:${c.contact.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' },
        homeLocation: {
          '@type': 'Place',
          name: geo.placename,
          geo: { '@type': 'GeoCoordinates', latitude: geo.latitude, longitude: geo.longitude },
        },
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
        alternateName: names,
        description: seo.description,
        inLanguage: 'en',
        author: { '@id': `${url}#person` },
        publisher: { '@id': `${url}#person` },
      },
      {
        '@type': 'ProfilePage',
        url,
        name: seo.title,
        description: seo.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${url}#website` },
        mainEntity: { '@id': `${url}#person` },
        dateModified: new Date().toISOString(),
        ...(about.resume?.file && { relatedLink: new URL(about.resume.file, url).href }),
      },
      // Question/answer pairs that AI assistants and search engines can quote
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: (seo.faq ?? []).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return [
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="keywords" content="${esc(seo.keywords.join(', '))}" />`,
    `<meta name="author" content="${esc(meta.name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<meta name="referrer" content="strict-origin-when-cross-origin" />`,
    `<meta name="application-name" content="${esc(meta.name)}" />`,
    `<meta name="apple-mobile-web-app-title" content="${esc(meta.name)}" />`,
    `<meta name="apple-mobile-web-app-capable" content="yes" />`,
    `<meta name="mobile-web-app-capable" content="yes" />`,
    `<meta name="geo.region" content="${esc(geo.region ?? 'IN-TG')}" />`,
    `<meta name="geo.placename" content="${esc(geo.placename ?? meta.location)}" />`,
    geo.latitude !== undefined && `<meta name="geo.position" content="${geo.latitude};${geo.longitude}" />`,
    geo.latitude !== undefined && `<meta name="ICBM" content="${geo.latitude}, ${geo.longitude}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(url)}" />`,
    `<link rel="sitemap" type="application/xml" href="${esc(new URL('sitemap.xml', url).href)}" />`,
    `<link rel="author" href="${esc(url)}" />`,
    // Identity links: ties the name to these profiles for search and AI engines
    ...socials.map((s) => `<link rel="me" href="${esc(s.url)}" />`),

    // Open Graph (LinkedIn, WhatsApp, Facebook, Slack…)
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${esc(meta.name)}" />`,
    ...socials.map((s) => `<meta property="og:see_also" content="${esc(s.url)}" />`),
    `<meta property="og:locale" content="${esc(seo.locale)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image)}" />`,
    `<meta property="og:image:type" content="image/${/\.png$/i.test(image) ? 'png' : /\.webp$/i.test(image) ? 'webp' : 'jpeg'}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(seo.imageAlt)}" />`,
    `<meta property="profile:first_name" content="Vinay Kumar" />`,
    `<meta property="profile:last_name" content="Pudi" />`,

    // X / Twitter
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${esc(url)}" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(seo.imageAlt)}" />`,

    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')
}

/** Plain, crawlable summary for visitors and bots without JavaScript. */
function noscriptBody(c) {
  const { meta, seo, about, contact, socials, projects, journey } = c
  const work = journey.tabs.find((t) => t.id === 'work')?.items ?? []
  return `<main style="font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;color:#eef0f5;line-height:1.6">
        <h1>${esc(meta.name)} — ${esc(meta.role)}, ${esc(seo.geo?.placename ?? meta.location)}</h1>
        <p>${esc(seo.description)}</p>
        ${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
        <h2>Skills</h2>
        <ul>${c.skills.items.map((s) => `<li>${esc(s.name)}</li>`).join('')}</ul>
        <h2>Experience</h2>
        <ul>${work.map((w) => `<li>${esc(w.title)} — ${esc(w.place)} (${esc(w.period)})</li>`).join('')}</ul>
        <h2>Projects</h2>
        <ul>${projects.items.map((p) => `<li><a style="color:#f5a623" href="${esc(p.url)}">${esc(p.title)}</a> — ${esc(p.description)}</li>`).join('')}</ul>
        <h2>Contact</h2>
        <p>Email: <a style="color:#f5a623" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a> ·
        <a style="color:#f5a623" href="./${esc(about.resume.file)}">Download resume (PDF)</a></p>
        <p>${socials.map((s) => `<a style="color:#f5a623" href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>
        <h2>Frequently asked questions</h2>
        ${(seo.faq ?? []).map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('\n        ')}
      </main>`
}

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
]

function robotsTxt(seo) {
  const bots = AI_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n')
  return `User-agent: *\nAllow: /\n\n${bots}\nSitemap: ${new URL('sitemap.xml', seo.siteUrl).href}\n`
}

/** llms.txt: a plain-text guide that AI assistants can read to answer questions about the site owner. */
function llmsTxt(c) {
  const { meta, seo, projects, contact, socials, about } = c
  const bullet = (items) => items.map((i) => `- ${i}`).join('\n')
  return `# ${meta.name}

> ${seo.description}

Also known as: ${(seo.alternateNames ?? []).join(', ')}.

## About
${about.paragraphs.map((p) => p).join('\n\n')}

## Skills
${bullet(c.skills.items.map((s) => s.name))}

## Projects
${projects.items.map((p) => `- [${p.title}](${p.url}): ${p.description}`).join('\n')}

## Frequently asked questions
${(seo.faq ?? []).map((f) => `**${f.question}**\n${f.answer}`).join('\n\n')}

## Contact
${bullet([`Email: ${contact.email}`, ...socials.map((s) => `${s.label}: ${s.url}`)])}
- Portfolio: ${seo.siteUrl}
- Resume (PDF): ${new URL(about.resume.file, seo.siteUrl).href}
`
}

// Latin subsets of the fonts used above the fold. Preloading them lets the hero
// text render in its final font without a swap (better LCP, no layout shift).
const PRELOAD_FONTS = [/inter-latin-wght-normal-.*\.woff2$/, /jetbrains-mono-latin-wght-normal-.*\.woff2$/]

function fontPreloads(bundle) {
  if (!bundle) return ''
  return Object.keys(bundle)
    .filter((file) => PRELOAD_FONTS.some((re) => re.test(file)))
    .map((file) => `<link rel="preload" href="./${file}" as="font" type="font/woff2" crossorigin />`)
    .join('\n    ')
}

export default function seoPlugin() {
  return {
    name: 'portfolio-seo',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const c = readConfig()
        return html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.seo.title)}</title>`)
          .replace('<!--SEO_HEAD-->', headTags(c))
          .replace('<!--FONT_PRELOAD-->', fontPreloads(ctx.bundle))
          .replace('<!--NOSCRIPT_BODY-->', noscriptBody(c))
          .replaceAll('%THEME_COLOR%', c.seo.themeColor)
      },
    },
    generateBundle() {
      const c = readConfig()
      const { seo } = c
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt(seo),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'llms.txt',
        source: llmsTxt(c),
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
