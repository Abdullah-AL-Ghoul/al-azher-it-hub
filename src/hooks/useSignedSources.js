import { useEffect, useState } from 'react'
import { getSources } from '../services/sources'
import { getSignedSourceUrls } from '../services/sourceStorage'
import { getSourceFiles } from '../utils/helpers'

/**
 * Loads sources and resolves temporary signed URLs for every storage-backed
 * file. Returns { sources, signed, loading, error, reload } where `signed`
 * maps storage path → short-lived download URL (falls back to the stored
 * `url` for external links that are not storage objects).
 */
export function useSignedSources() {
  const [sources, setSources] = useState([])
  const [signed, setSigned] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        const rows = await getSources()
        if (!mounted) return
        setSources(rows)

        const paths = [...new Set(rows.flatMap((s) => getSourceFiles(s).map((f) => f.path).filter(Boolean)))]
        if (paths.length === 0) {
          setSigned({})
          return
        }
        const map = await getSignedSourceUrls(paths)
        if (mounted) setSigned(map)
      } catch (err) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [reloadKey])

  const reload = () => setReloadKey((k) => k + 1)
  return { sources, signed, loading, error, reload }
}

// Resolves the best available URL for a source file entry:
// signed URL (fresh, preferred) → stored url (external link or fallback).
export function resolveFileUrl(file, signed) {
  return (file.path && signed[file.path]) || file.url || '#'
}
