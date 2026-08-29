import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { uploadSourceFile, validateFiles, validateMagicBytes } from '../services/sourceStorage'

export function useFileUpload() {
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({})
  const [errors, setErrors] = useState([])
  const [uploading, setUploading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const reset = useCallback(() => {
    setFiles([])
    setProgress({})
    setErrors([])
  }, [])

  const removeFile = useCallback(async (idx) => {
    const f = files[idx]
    if (!f) return
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setProgress(prev => {
      const next = { ...prev }
      delete next[f.name]
      return next
    })
  }, [files])

  const uploadFiles = useCallback(async (inputFiles, isArabic = false) => {
    const { valid, errors } = validateFiles(inputFiles)
    if (errors.length) {
      for (const e of errors) {
        if (e.reason === 'too_large') {
          toast.error(isArabic ? `الملف "${e.file}" أكبر من 100 ميجا` : `"${e.file}" exceeds 100 MB`)
        } else if (e.reason === 'invalid_type') {
          toast.error(isArabic ? `الملف "${e.file}" نوع غير مدعوم` : `"${e.file}" type not supported`)
        }
      }
      setErrors(errors)
    }

    if (!valid.length) return { ok: false, uploaded: [] }

    setUploading(true)
    const uploaded = []

    for (const file of valid) {
      // Reject files whose content doesn't match their declared type (stored-XSS prevention).
      const magicOk = await validateMagicBytes(file)
      if (!mountedRef.current) return { ok: false, uploaded }
      if (!magicOk) {
        toast.error(isArabic ? `الملف "${file.name}" محتواه لا يتطابق مع نوعه` : `"${file.name}" content doesn't match its type`)
        setProgress(prev => ({ ...prev, [file.name]: { progress: 0, status: 'failed' } }))
        continue
      }
      setProgress(prev => ({ ...prev, [file.name]: { progress: 0, status: 'uploading' } }))
      try {
        const result = await uploadSourceFile(file, ({ progress: p, status }) => {
          // Guard against state updates after the component unmounts (React 18
          // tolerates it, but it's wasted work and noisy in dev).
          if (!mountedRef.current) return
          setProgress(prev => ({ ...prev, [file.name]: { progress: p, status } }))
        })
        if (!mountedRef.current) return { ok: false, uploaded }
        uploaded.push(result)
        setFiles(prev => [...prev, result])
        toast.success(isArabic ? `تم رفع ${file.name}` : `${file.name} uploaded`)
      } catch (err) {
        if (!mountedRef.current) return { ok: false, uploaded }
        setProgress(prev => ({ ...prev, [file.name]: { progress: 0, status: 'failed' } }))
        toast.error(isArabic ? `فشل رفع ${file.name}` : `Failed to upload ${file.name}`)
      }
    }

    if (!mountedRef.current) return { ok: false, uploaded }
    setUploading(false)
    return { ok: true, uploaded }
  }, [])

  return { files, progress, errors, uploading, uploadFiles, removeFile, reset, setFiles }
}
