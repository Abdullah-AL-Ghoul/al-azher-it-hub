// One-off probe: check real lecture videoIds against YouTube thumbnail CDN.
const url = process.argv[2]
const key = process.argv[3]

;(async () => {
  const r = await fetch(url.trim() + '/rest/v1/lectures?select=id,titleAr,url,videoId&limit=10', {
    headers: { apikey: key.trim(), Authorization: 'Bearer ' + key.trim() },
  })
  const data = await r.json()
  if (!Array.isArray(data)) {
    console.log('ERR:', JSON.stringify(data).slice(0, 300))
    return
  }
  console.log('total rows probed:', data.length)
  for (const l of data) {
    let vid = l.videoId || null
    if (!vid && l.url) {
      const m = String(l.url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
      vid = m ? m[1] : null
    }
    let status = 'no-id'
    if (vid) {
      const t = await fetch('https://img.youtube.com/vi/' + vid + '/mqdefault.jpg', { method: 'HEAD' })
      status = t.status + ' ' + (t.headers.get('content-type') || '?')
    }
    console.log(
      (l.videoId ? 'field' : l.url ? 'url' : 'NONE').padEnd(6),
      String(vid).padEnd(13),
      status.padEnd(24),
      (l.titleAr || '').slice(0, 28)
    )
  }
})().catch((e) => console.log('FATAL:', e.message))
