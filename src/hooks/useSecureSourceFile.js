import { useState, useRef, useEffect } from 'react'

/**
 * Hardened source-file access. Files are fetched as authenticated blobs in
 * memory and opened as `blob:` URLs — those are session-scoped (die with the
 * page), cannot be copied to another browser/device, and no Supabase URL
 * (signed or otherwise) is ever exposed to the user.
 *
 * Usage: const open = useSecureSourceFile()
 *        <button onClick={() => open(path, { name })}>تحميل</button>
 *
 * The caller passes the file's storage path; the hook signs it server-side
 * (authenticated-only via RLS), fetches the bytes, and releases them from
 * the object URL when the viewer tab closes.
 */

// Central registry so repeated opens of the same path reuse the in-memory
// bytes within the session instead of re-downloading a 50MB PDF.
const blobCache = new Map() // path → { blobUrl, size, name }

function releaseBlob(path) {
  const entry = blobCache.get(path)
  if (entry) {
    URL.revokeObjectURL(entry.blobUrl)
    blobCache.delete(path)
  }
}

export function useSecureSourceFile() {
  const [busyPath, setBusyPath] = useState(null)
  const activeRef = useRef([])

  // Revoke everything this session opened when the component tree unmounts
  // (page close/refresh clears blob: URLs automatically as well).
  useEffect(() => {
    const active = activeRef.current
    return () => { active.forEach((p) => releaseBlob(p)) }
  }, [])

  /**
   * Fetch + open/download a source file securely.
   * @param {string} path storage object path
   * @param {{ name?: string, mode?: 'view'|'download', signIn?: (p:string, opts?:any)=>Promise<{data:{signedUrl:string}}|null> }} opts
   *   signIn: async signer that resolves a one-time fetch URL for the path.
   */
  const open = async (path, { name, mode = 'view', signIn } = {}) => {
    if (!path) return
    setBusyPath(path)

    try {
      let entry = blobCache.get(path)

      if (!entry) {
        if (!signIn) throw new Error('no-signer')
        const { data } = (await signIn(path, { download: mode === 'download' })) || {}
        const fetchUrl = data?.signedUrl
        if (!fetchUrl) throw new Error('not-signed')

        const res = await fetch(fetchUrl, { mode: 'cors' })
        if (!res.ok) throw new Error('fetch-failed-' + res.status)
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        entry = { blobUrl, size: blob.size, name: name || path }
        blobCache.set(path, entry)
        activeRef.current.push(path)
      }

      if (mode === 'download') {
        const a = document.createElement('a')
        a.href = entry.blobUrl
        a.download = entry.name || name || 'file'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        window.open(entry.blobUrl, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setBusyPath(null)
    }
  }

  return { open, busyPath }
}

export default useSecureSourceFile
