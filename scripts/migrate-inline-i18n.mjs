// One-shot migration: inline `isArabic ? '…' : '…'` ternaries → t('inline.<file>.<slug>')
// Only string-literal pairs migrate; data-driven ternaries and JSX conditionals stay.
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('.')
const ar = JSON.parse(fs.readFileSync('src/i18n/ar.json', 'utf8'))
const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'))
ar.inline = ar.inline || {}
en.inline = en.inline || {}

const FILES = process.argv.slice(2)
if (!FILES.length) {
  console.error('usage: node scripts/migrate-inline-i18n.mjs <file.jsx> ...')
  process.exit(1)
}

// matches: isArabic ? '<ar>' : '<en>'  (or double quotes), allowing newlines
// after `isArabic` or `?`. Escape sequences \' \" \\ are honored.
const TAIL = String.raw`(?:\s*\?\s*)(?<ar>('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*"))(?:\s*:\s*)(?<en>('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*"))`
const RX = new RegExp(String.raw`\bisArabic` + TAIL, 'g')

function unquote(s) {
  return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}
function slugFrom(text) {
  const words = text
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return 'text'
  let slug = words.slice(0, 4).join(' ').toLowerCase().replace(/\s+/g, '-')
  if (slug.length > 48) slug = slug.slice(0, 48).replace(/-[^-]*$/, '')
  return slug || 'text'
}

let totalMigrated = 0
let totalSkipped = 0

for (const rel of FILES) {
  const file = path.join(ROOT, rel)
  let src = fs.readFileSync(file, 'utf8')
  const fileNs = path.basename(rel, '.jsx')
    .replace(/\.jsx$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

  ar.inline[fileNs] = ar.inline[fileNs] || {}
  en.inline[fileNs] = en.inline[fileNs] || {}
  const arNs = ar.inline[fileNs]
  const enNs = en.inline[fileNs]

  let migrated = 0
  const usedKeys = new Set(Object.keys(arNs))

  src = src.replace(RX, (...args) => {
    const match = args[0]
    const groups = args[args.length - 1] || {}
    const arLit = groups.ar
    const enLit = groups.en
    if (!arLit || !enLit) return match
    // Skip pairs where either side is empty (pure-conditional markup choices).
    const arText = unquote(arLit)
    const enText = unquote(enLit)
    if (!arText.trim() || !enText.trim()) {
      totalSkipped++
      return match
    }
    // Interpolation placeholders ({x}) cannot survive the JSON interpolator.
    if (arText.includes('${') || enText.includes('${')) {
      totalSkipped++
      return match
    }
    let slug = slugFrom(enText)
    let key = slug
    let n = 2
    while (usedKeys.has(key) && arNs[key] !== arText) key = `${slug}-${n++}`
    usedKeys.add(key)
    arNs[key] = arText
    enNs[key] = enText
    migrated++
    return `t('inline.${fileNs}.${key}')`
  })

  if (migrated > 0) {
    // Ensure `t` is available: files that use isArabic already import
    // useLanguage; add t to the destructure if missing.
    if (!/\bt\(/.test(src.replace(/t\('inline\./g, ''))) {
      // No pre-existing t( usage besides ours → wire it in.
      if (/const \{[^}]*\} = useLanguage\(\)/.test(src) && !/const \{[^}]*\bt\b[^}]*\} = useLanguage\(\)/.test(src)) {
        src = src.replace(/const \{([^}]*)\} = useLanguage\(\)/, (m, inner) => `const { t,${inner}} = useLanguage()`)
      } else if (/useLanguage\(\)/.test(src) && !/= useLanguage\(\)/.test(src)) {
        // e.g. `useLanguage()` bare — replace with destructure
        src = src.replace(/useLanguage\(\)/, 'const { t } = useLanguage()')
      } else if (!/useLanguage\(\)/.test(src)) {
        // No useLanguage at all — flag for manual wiring.
        console.error(`MANUAL-WIRE: ${rel} has no useLanguage import/usage`)
      }
    }
    fs.writeFileSync(file, src)
    totalMigrated += migrated
    console.log(`${rel}: ${migrated} migrated`)
  } else {
    console.log(`${rel}: nothing to migrate`)
  }
}

// Keep key order stable per namespace (insertion order) — write JSONs with 2-space indent.
fs.writeFileSync('src/i18n/ar.json', JSON.stringify(ar, null, 2) + '\n')
fs.writeFileSync('src/i18n/en.json', JSON.stringify(en, null, 2) + '\n')
console.log(`TOTAL migrated: ${totalMigrated}, skipped: ${totalSkipped}`)
