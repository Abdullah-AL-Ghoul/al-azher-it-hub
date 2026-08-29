// Deploy the project source to Vercel via the REST API (Vercel installs deps
// and runs `vite build` server-side, using the project's configured env vars).
// Used because the provided token is team-scoped (vcp_): the CLI requires a
// user token, but the API accepts teamId + Bearer token.
// Usage: node scripts/deploy-prebuilt.cjs <token> <teamId> <projectName>
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const [token, teamId, projectName] = process.argv.slice(2)
if (!token || !teamId || !projectName) {
  console.error('Usage: node scripts/deploy-prebuilt.cjs <token> <teamId> <projectName>')
  process.exit(1)
}

const ROOT = path.join(__dirname, '..')

// Build-relevant sources only: never ship .env* / keys / local artifacts.
const ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'vite.config.js',
  'vercel.json',
  'index.html',
  'tailwind.config.js',
  'postcss.config.js',
]
const DIRS = ['src', 'public']
const SKIP_IN_DIRS = /(^|\/)(__tests__|__snapshots__)(\/|$)/

const api = (p) => `https://api.vercel.com${p}${p.includes('?') ? '&' : '?'}teamId=${teamId}`
const headers = { Authorization: `Bearer ${token}` }

function walk(dir, base = '') {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel))
    else if (!SKIP_IN_DIRS.test(rel)) out.push(rel)
  }
  return out
}

async function createDeployment(files) {
  const res = await fetch(api('/v13/deployments'), {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      target: 'production',
      files: files.map(({ file, sha, size }) => ({ file, sha, size })),
    }),
  })
  const body = await res.json()
  if (res.ok) return body
  if (res.status === 400 && body.error?.code === 'missing_files') {
    return { missing: body.error.missing || [] }
  }
  console.error('Create failed:', res.status, JSON.stringify(body).slice(0, 500))
  process.exit(1)
}

async function uploadFile(f) {
  const up = await fetch(api('/v2/files'), {
    method: 'POST',
    headers: { ...headers, 'Content-Length': f.size, 'x-vercel-digest': f.sha, 'Content-Type': 'application/octet-stream' },
    body: f.buf,
  })
  if (!up.ok) {
    console.error(`Upload failed for ${f.file}:`, up.status, (await up.text()).slice(0, 200))
    process.exit(1)
  }
}

async function main() {
  const relPaths = [
    ...ROOT_FILES,
    ...DIRS.flatMap((d) => walk(path.join(ROOT, d), d)),
  ]
  const files = relPaths.map((f) => {
    const buf = fs.readFileSync(path.join(ROOT, f))
    return { file: f, sha: crypto.createHash('sha1').update(buf).digest('hex'), size: buf.length, buf }
  })
  console.log(`Collected ${files.length} files, total ${Math.round(files.reduce((a, f) => a + f.size, 0) / 1024)} KB`)

  // Vercel flow: first create returns 400 missing_files; upload those, then
  // re-create — the second create actually provisions the deployment.
  const bySha = new Map(files.map((f) => [f.sha, f]))
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await createDeployment(files)
    if (result.id) {
      var created = result
      break
    }
    const missing = result.missing || []
    console.log(`Attempt ${attempt + 1}: uploading ${missing.length} missing files...`)
    for (const sha of missing) {
      const f = bySha.get(sha)
      if (f) await uploadFile(f)
    }
  }
  if (!created) {
    console.error('Deployment was not created after uploads')
    process.exit(1)
  }
  console.log('Deployment created:', created.id, created.url || '')

  // 3. Poll until the deployment is ready.
  const deadline = Date.now() + 5 * 60 * 1000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000))
    const st = await (await fetch(api(`/v13/deployments/${created.id}`), { headers })).json()
    const state = st.readyState || st.status
    console.log('State:', state)
    if (state === 'READY' || st.ready === true) {
      console.log('DEPLOYED:', st.url)
      process.exit(0)
    }
    if (state === 'ERROR' || state === 'CANCELED') {
      console.error('Deployment failed:', JSON.stringify(st).slice(0, 800))
      process.exit(1)
    }
  }
  console.error('Timed out waiting for deployment')
  process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
