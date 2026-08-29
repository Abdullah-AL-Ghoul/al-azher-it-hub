// Downloads Cairo + Inter woff2 subsets from Google Fonts and emits a
// self-hosted fonts.css. Run: node scripts/download-fonts.cjs
// Removes the render-blocking external stylesheet (fonts.googleapis.com)
// and the cross-origin font fetches (fonts.gstatic.com) from the critical path.
const { writeFileSync, mkdirSync, existsSync } = require('node:fs')
const { resolve } = require('node:path')

const FONT_DIR = resolve(process.cwd(), 'public/fonts')
const OUT_CSS = resolve(process.cwd(), 'public/fonts/fonts.css')

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Inter:wght@400;600;700&display=swap'

const UA_WOFF2 =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Detect the subset from Google's unicode-range hex values (the range string
// does NOT contain the word "arabic" — it is a list of hex ranges).
// Returns null for subsets we don't need (cyrillic/greek/vietnamese) so they
// are skipped entirely — the app is Arabic/English only.
function detectSubset(range) {
  if (/U\+0[6-8][0-9A-F]{2}|U\+FB50|U\+FE70|U\+1EE00/i.test(range)) return 'arabic'
  if (/U\+0100-02BA|U\+1E00-1E9F|U\+A720-A7FF/i.test(range)) return 'latin-ext'
  if (/U\+0000-00FF|U\+0131|U\+0152/i.test(range)) return 'latin'
  return null
}

async function main() {
  mkdirSync(FONT_DIR, { recursive: true })
  const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA_WOFF2 } })
  if (!res.ok) throw new Error(`Google Fonts CSS failed: ${res.status}`)
  const css = await res.text()

  const blocks = css.match(/@font-face\s*{[^}]+}/g) || []
  if (!blocks.length) throw new Error('No @font-face blocks found')

  const rules = []
  const seen = new Map() // url -> local filename
  let downloaded = 0

  for (const block of blocks) {
    const family = (block.match(/font-family:\s*'([^']+)'/) || [])[1]
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1] || '400'
    const style = (block.match(/font-style:\s*(\w+)/) || [])[1] || 'normal'
    const range = (block.match(/unicode-range:\s*([^;]+)/) || [])[1] || ''
    const url = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1]
    if (!family || !url) continue

    const subset = detectSubset(range)
    if (!subset) continue
    let fname = seen.get(url)
    if (!fname) {
      fname = `${slugify(family)}-${weight}-${style !== 'normal' ? style + '-' : ''}${subset}.woff2`
      // Avoid clobbering when a variable font is declared at several weights
      // but served from one file: suffix collisions get a counter.
      if (existsSync(resolve(FONT_DIR, fname))) {
        let i = 2
        while (existsSync(resolve(FONT_DIR, fname))) {
          fname = `${slugify(family)}-${weight}-${style !== 'normal' ? style + '-' : ''}${subset}-${i}.woff2`
          i++
        }
      }
      const f = await fetch(url, { headers: { 'User-Agent': UA_WOFF2 } })
      if (!f.ok) throw new Error(`Font download failed: ${fname} (${f.status})`)
      writeFileSync(resolve(FONT_DIR, fname), Buffer.from(await f.arrayBuffer()))
      seen.set(url, fname)
      downloaded++
    }

    rules.push(`@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${fname}') format('woff2');
  unicode-range: ${range};
}`)
  }

  writeFileSync(OUT_CSS, rules.join('\n') + '\n')
  console.log(`Downloaded ${downloaded} unique woff2 files -> public/fonts/`)
  console.log(`Wrote ${OUT_CSS} (${rules.length} @font-face rules)`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
