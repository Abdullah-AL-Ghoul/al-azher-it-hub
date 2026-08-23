import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { uploadSourceFile, validateFiles } from '../services/sourceStorage'

export function useFileUpload() {
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({})
  const [errors, setErrors] = useState([])
  const [uploading, setUploading] = useState(false)

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
      setProgress(prev => ({ ...prev, [file.name]: { progress: 0, status: 'uploading' } }))
      try {
        const result = await uploadSourceFile(file, ({ progress: p, status }) => {
          setProgress(prev => ({ ...prev, [file.name]: { progress: p, status } }))
        })
        uploaded.push(result)
        setFiles(prev => [...prev, result])
        toast.success(isArabic ? `تم رفع ${file.name}` : `${file.name} uploaded`)
      } catch (err) {
        setProgress(prev => ({ ...prev, [file.name]: { progress: 0, status: 'failed' } }))
        toast.error(isArabic ? `فشل رفع ${file.name}` : `Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    return { ok: true, uploaded }
  }, [])

  return { files, progress, errors, uploading, uploadFiles, removeFile, reset, setFiles }
}
