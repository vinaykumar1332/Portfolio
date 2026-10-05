import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Builds all <head> SEO tags, structured data, the no-JS fallback, robots.txt,
// sitemap.xml and llms.txt from src/config/portfolio.json.
const CONFIG_PATH = fileURLToPath(new URL('./src/config/portfolio.json', import.meta.url))

// Real photo for structured data (Google prefers a face for a Person); og-image stays the share card
const PROFILE_PHOTO = { src: 'images/profile.webp', width: 500, height: 500 }
const ONLINE_PLATFORMS = ['Coursera', 'Udemy', 'edX']

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
}

const abs = (path, base) => new URL(path, base).href
const tierOf = (skills, level) => skills.tiers.findIndex((t) => level >= t.min)
const faqItems = (c) => (c.faq?.show ? c.faq.items : [])

function structuredData(c) {
  const { seo, meta, socials, about, skills, journey, projects, contact } = c
  const url = seo.siteUrl
  const person = `${url}#person`
  const work = journey.tabs.find((t) => t.id === 'work')?.items ?? []
  const education = journey.tabs.find((t) => t.id === 'education')?.items ?? []
  const [givenName, ...rest] = meta.name.split(' ')
  const familyName = rest.pop()
  const faq = faqItems(c)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': person,
        name: meta.name,
        alternateName: seo.alternateNames,
        givenName: [givenName, ...rest].join(' '),
        familyName,
        jobTitle: meta.role,
        description: seo.description,
        url,
        mainEntityOfPage: { '@id': `${url}#profile` },
        image: {
          '@type': 'ImageObject',
          url: abs(PROFILE_PHOTO.src, url),
          width: PROFILE_PHOTO.width,
          height: PROFILE_PHOTO.height,
          caption: meta.name,
        },
        email: `mailto:${contact.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' },
        homeLocation: { '@type': 'Place', name: meta.location },
        worksFor: { '@type': 'Organization', name: 'Tata Consultancy Services', alternateName: 'TCS', url: 'https://www.tcs.com/' },
        hasOccupation: {
          '@type': 'Occupation',
          name: meta.role,
          occupationLocation: { '@type': 'City', name: 'Hyderabad' },
          skills: skills.items.map((s) => s.name).join(', '),
          description: work[0]?.focus,
        },
        // Online course platforms are credentials, not schools you're an alumnus of
        alumniOf: education
          .filter((e) => !ONLINE_PLATFORMS.includes(e.place))
          .map((e) => ({ '@type': 'EducationalOrganization', name: e.place.split(',')[0] })),
        hasCredential: education.map((e) => ({
          '@type': 'EducationalOccupationalCredential',
          name: e.title,
          recognizedBy: { '@type': 'Organization', name: e.place.split(',')[0] },
        })),
        knowsAbout: skills.items
          .filter((s) => tierOf(skills, s.level) <= 1)
          .map((s) => s.name)
          .concat(['Frontend development', 'Generative AI interfaces', 'Accessibility', 'Core Web Vitals']),
        knowsLanguage: ['en'],
        sameAs: socials.map((s) => s.url),
        subjectOf: about.resume?.file && {
          '@type': 'DigitalDocument',
          name: `${meta.name} — Resume`,
          encodingFormat: 'application/pdf',
          url: abs(about.resume.file, url),
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: `${meta.name} — Portfolio`,
        description: meta.description,
        inLanguage: 'en',
        author: { '@id': person },
        publisher: { '@id': person },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        name: seo.title,
        description: seo.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${url}#website` },
        mainEntity: { '@id': person },
        primaryImageOfPage: { '@type': 'ImageObject', url: abs(seo.image, url) },
        dateModified: new Date().toISOString(),
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#projects`,
        name: `Projects by ${meta.name}`,
        itemListElement: projects.items.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            name: p.title,
            description: p.description,
            url: p.url,
            keywords: p.tags?.join(', '),
            creator: { '@id': person },
          },
        })),
      },
      ...(faq.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${url}#faq`,
              mainEntity: faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]
        : []),
    ],
  }
}

function headTags(c) {
  const { seo, meta, socials } = c
  const url = seo.siteUrl
  const image = abs(seo.image, url)

  return [
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="keywords" content="${esc(seo.keywords.join(', '))}" />`,
    `<meta name="author" content="${esc(meta.name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `<meta name="referrer" content="strict-origin-when-cross-origin" />`,
    `<meta name="application-name" content="${esc(meta.name)}" />`,
    `<meta name="apple-mobile-web-app-title" content="${esc(meta.name)}" />`,
    `<meta name="apple-mobile-web-app-capable" content="yes" />`,
    `<meta name="mobile-web-app-capable" content="yes" />`,
    `<meta name="geo.region" content="IN-TG" />`,
    `<meta name="geo.placename" content="${esc(meta.location)}" />`,
    seo.googleVerification && `<meta name="google-site-verification" content="${esc(seo.googleVerification)}" />`,
    seo.bingVerification && `<meta name="msvalidate.01" content="${esc(seo.bingVerification)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(url)}" />`,
    `<link rel="sitemap" type="application/xml" href="${esc(abs('sitemap.xml', url))}" />`,
    // Plain-text summary for AI assistants / answer engines
    `<link rel="alternate" type="text/plain" title="LLM summary" href="${esc(abs('llms.txt', url))}" />`,
    // Identity links: tell crawlers these profiles are the same person
    ...socials.map((s) => `<link rel="me" href="${esc(s.url)}" />`),

    // Open Graph (LinkedIn, WhatsApp, Facebook, Slack…)
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${esc(meta.name)}" />`,
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

    `<script type="application/ld+json">${JSON.stringify(structuredData(c)).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')
}

/**
 * Plain, crawlable version of the page. Most AI crawlers (and some search bots)
 * don't run JavaScript, so this is what they read: keep it complete.
 */
function noscriptBody(c) {
  const { meta, seo, about, contact, socials, projects, journey, skills, services } = c
  const work = journey.tabs.find((t) => t.id === 'work')?.items ?? []
  const education = journey.tabs.find((t) => t.id === 'education')?.items ?? []
  const link = 'style="color:#f5a623"'
  const faq = faqItems(c)
  return `<main style="font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;color:#eef0f5;line-height:1.6">
        <h1>${esc(meta.name)} — ${esc(meta.role)}</h1>
        <p>${esc(seo.description)}</p>
        ${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
        <h2>Experience</h2>
        ${work
          .map(
            (w) => `<h3>${esc(w.title)}</h3><p>${esc(w.place)} · ${esc(w.period)}</p>${
              w.points ? `<ul>${w.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''
            }`,
          )
          .join('\n        ')}
        <h2>Skills</h2>
        ${skills.tiers
          .map((t, ti) => {
            const items = skills.items.filter((s) => tierOf(skills, s.level) === ti)
            return `<h3>${esc(t.label)}</h3><ul>${items.map((s) => `<li>${esc(s.name)}: ${esc(s.note)}</li>`).join('')}</ul>`
          })
          .join('\n        ')}
        <h2>Services</h2>
        <ul>${services.items.map((s) => `<li><strong>${esc(s.title)}</strong>: ${esc(s.text)}</li>`).join('')}</ul>
        <h2>Projects</h2>
        <ul>${projects.items.map((p) => `<li><a ${link} href="${esc(p.url)}">${esc(p.title)}</a>: ${esc(p.description)}</li>`).join('')}</ul>
        <h2>Education</h2>
        <ul>${education.map((e) => `<li>${esc(e.title)}, ${esc(e.place)} (${esc(e.period)})</li>`).join('')}</ul>
        ${
          faq.length
            ? `<h2>FAQ</h2>\n        ${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('\n        ')}`
            : ''
        }
        <h2>Contact</h2>
        <p>Email: <a ${link} href="mailto:${esc(contact.email)}">${esc(contact.email)}</a> ·
        <a ${link} href="./${esc(about.resume.file)}">Download resume (PDF)</a></p>
        <p>${socials.map((s) => `<a ${link} href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>
      </main>`
}

/** llms.txt: a Markdown summary AI assistants can read in one request (llmstxt.org). */
function llmsTxt(c) {
  const { meta, seo, about, contact, socials, projects, journey, skills } = c
  const url = seo.siteUrl
  const work = journey.tabs.find((t) => t.id === 'work')?.items ?? []
  const education = journey.tabs.find((t) => t.id === 'education')?.items ?? []
  const faq = faqItems(c)
  const lines = [
    `# ${meta.name} — ${meta.role}`,
    '',
    `> ${seo.description}`,
    '',
    `Based in ${meta.location}. Website: ${url}`,
    '',
    '## About',
    '',
    ...about.paragraphs.flatMap((p) => [p, '']),
    '## Experience',
    '',
    ...work.flatMap((w) => [`### ${w.title}`, `${w.place} · ${w.period}`, '', ...(w.points ?? []).map((p) => `- ${p}`), '']),
    '## Skills',
    '',
    ...skills.tiers.map((t, ti) => {
      const names = skills.items.filter((s) => tierOf(skills, s.level) === ti).map((s) => s.name)
      return `- **${t.label}:** ${names.join(', ')}`
    }),
    '',
    '## Projects',
    '',
    ...projects.items.map((p) => `- [${p.title}](${p.url}): ${p.description}`),
    '',
    '## Education',
    '',
    ...education.map((e) => `- ${e.title}, ${e.place} (${e.period})`),
    '',
    ...(faq.length ? ['## FAQ', '', ...faq.flatMap((f) => [`### ${f.q}`, f.a, ''])] : []),
    '## Links',
    '',
    `- [Resume (PDF)](${abs(about.resume.file, url)})`,
    ...socials.map((s) => `- [${s.label}](${s.url})`),
    `- Email: ${contact.email}`,
    '',
  ]
  return lines.join('\n')
}

function sitemap(c) {
  const { seo, about } = c
  const url = seo.siteUrl
  const today = new Date().toISOString().slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${esc(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${esc(abs(PROFILE_PHOTO.src, url))}</image:loc>
    </image:image>
    <image:image>
      <image:loc>${esc(abs(seo.image, url))}</image:loc>
    </image:image>
  </url>${
    about.resume?.file
      ? `
  <url>
    <loc>${esc(abs(about.resume.file, url))}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
      : ''
  }
</urlset>
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
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml', seo.siteUrl)}\n`,
      })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(c) })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(c) })
    },
  }
}
