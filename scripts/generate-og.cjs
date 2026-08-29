// Generates public/og-image.png (1200x630) for social share previews.
// Run: node scripts/generate-og.cjs
// Deps: satori (JSX->SVG) + sharp (SVG->PNG). Fonts are bundled with the
// harfbuzzjs package (Noto Sans Latin + Noto Sans Arabic).
const satori = require('satori').default
const sharp = require('sharp')
const { readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const React = require('react')

const el = (type, props, ...children) => React.createElement(type, props, ...children)
const box = (style, ...children) => el('div', { style }, ...children)
const text = (content, style) => el('div', { style }, content)

const element = box(
  {
    width: 1200,
    height: 630,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 55%, #312e81 100%)',
    padding: 80,
  },
  box(
    {
      width: 96,
      height: 96,
      borderRadius: 24,
      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    text('▶', { fontSize: 40, color: '#ffffff' }),
  ),
  text('AL-Azher IT Hub', {
    fontSize: 76,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: 'Noto',
  }),
  text('IT Education Platform', {
    fontSize: 34,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Noto',
  }),
  text('Video Lectures · Summaries · Sources', {
    fontSize: 26,
    color: 'rgba(148,163,184,0.9)',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Noto',
  }),
)

const FONT_DIR = 'node_modules/harfbuzzjs/test/fonts/noto'
const fonts = [
  { name: 'Noto', data: readFileSync(resolve(FONT_DIR, 'NotoSans-Regular.ttf')), weight: 400, style: 'normal' },
]

async function main() {
  const svg = await satori(element, { width: 1200, height: 630, fonts })
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  const out = resolve(process.cwd(), 'public/og-image.png')
  writeFileSync(out, png)
  console.log(`OG image written: ${out} (${png.byteLength} bytes)`)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
