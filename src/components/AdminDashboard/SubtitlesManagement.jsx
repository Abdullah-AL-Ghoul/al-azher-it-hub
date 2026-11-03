import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  FiFileText,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiPlay,
  FiCheckCircle,
  FiAlertCircle,
  FiUploadCloud,
  FiSearch,
  FiCheck,
  FiX,
  FiCpu,
  FiScissors,
  FiRefreshCw,
  FiShield,
  FiKey,
  FiActivity,
  FiSliders,
  FiDollarSign,
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'
import { formatVttTime, validateCues } from '../../utils/vttParser'
import {
  getAllSubtitles,
  saveSubtitle,
  importSubtitleFile,
  runSubtitleGenerationPipeline,
  translateCues,
  translateCuesWithGemini,
  translateSubtitleTrack,
  getGeminiApiKey,
  setGeminiApiKey,
  removeGeminiApiKey,
  isGeminiAvailable,
  testGeminiConnection,
  AVAILABLE_GEMINI_MODELS,
  getPreferredGeminiModel,
  setPreferredGeminiModel,
  diagnoseGeminiModels,
} from '../../services/subtitles'
import VideoPlayer from '../shared/VideoPlayer'
import { lectureVideoId } from '../../utils/helpers'

const STATUS_BADGES = {
  published: {
    labelAr: 'منشورة',
    labelEn: 'Published',
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  reviewed: {
    labelAr: 'تمت المراجعة',
    labelEn: 'Reviewed',
    cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  needs_review: {
    labelAr: 'بحاجة مراجعة',
    labelEn: 'Needs Review',
    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  ai_generated: {
    labelAr: 'توليد ذكاء اصطناعي',
    labelEn: 'AI Generated',
    cls: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
}

export default function SubtitlesManagement({
  lectures = [],
  onRefresh,
}) {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [subtitles, setSubtitles] = useState([])
  const [, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals & Panels
  const [editorSubtitle, setEditorSubtitle] = useState(null)
  const [generationModalOpen, setGenerationModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Editor states
  const [previewTime, setPreviewTime] = useState(0)
  const [isTranslatingEditor, setIsTranslatingEditor] = useState(false)
  const [editorTranslateProgress, setEditorTranslateProgress] = useState(null)
  const editorPlayerRef = useRef(null)

  // Generation Workflow states
  const [selectedLectureId, setSelectedLectureId] = useState('')
  const [audioSourceType, setAudioSourceType] = useState('upload') // 'upload' | 'authorized_source'
  const [audioFile, setAudioFile] = useState(null)
  const [authorizedConfirmation, setAuthorizedConfirmation] = useState(false)
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLangs] = useState(['ar'])
  const [selectedEngine, setSelectedEngine] = useState('gemini-flash')
  const [generationProgress, setGenerationProgress] = useState(null) // { step, label, pct }
  const [isGenerating, setIsGenerating] = useState(false)

  // Import states
  const [importLectureId, setImportLectureId] = useState('')
  const [importFormat, setImportFormat] = useState('vtt')
  const [importLang, setImportLang] = useState('ar')
  const [importContent, setImportContent] = useState('')

  // Gemini API Key & Model Diagnostics state
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getGeminiApiKey())
  const [hasGeminiKey, setHasGeminiKey] = useState(() => isGeminiAvailable())
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(!isGeminiAvailable())
  const [preferredModel, setPreferredModel] = useState(() => getPreferredGeminiModel())
  const [modelDiagnostics, setModelDiagnostics] = useState([])
  const [isDiagnosingModels, setIsDiagnosingModels] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const handleSelectPreferredModel = (modelId) => {
    setPreferredGeminiModel(modelId)
    setPreferredModel(modelId)
    const modelObj = AVAILABLE_GEMINI_MODELS.find((m) => m.id === modelId)
    const name = modelObj ? modelObj.name : (isArabic ? 'التبديل التلقائي الذكي' : 'Auto Cascade')
    toast.success(isArabic ? `تم اعتماد النموذج: ${name}` : `Preferred model set: ${name}`)
  }

  const handleRunModelDiagnostics = async () => {
    const key = geminiKeyInput.trim() || getGeminiApiKey()
    if (!key) {
      toast.error(isArabic ? 'يرجى إدخال مفتاح API أولاً لتشخيص النماذج' : 'Please provide an API key to diagnose models')
      return
    }
    setIsDiagnosingModels(true)
    setShowDiagnostics(true)
    try {
      const results = await diagnoseGeminiModels(key)
      setModelDiagnostics(results)
      const operationalCount = results.filter((r) => r.status === 'available').length
      const highDemandCount = results.filter((r) => r.status === 'high_demand').length
      if (operationalCount > 0) {
        toast.success(
          isArabic
            ? `اكتمل الفحص: ${operationalCount} نموذج جاهز للاستخدام الفوري ${highDemandCount > 0 ? `(${highDemandCount} يشهد ضغطاً)` : ''}`
            : `Diagnostics complete: ${operationalCount} models operational`
        )
      } else {
        toast.error(isArabic ? 'لم يستجب أي نموذج، يرجى التحقق من صلاحية المفتاح' : 'No operational models responded')
      }
    } catch (err) {
      toast.error(err.message || 'Diagnostics failed')
    } finally {
      setIsDiagnosingModels(false)
    }
  }

  const handleSaveAndTestGeminiKey = async () => {
    const trimmed = geminiKeyInput.trim()
    if (!trimmed) {
      removeGeminiApiKey()
      setHasGeminiKey(false)
      toast.success(isArabic ? 'تمت إزالة مفتاح Gemini' : 'Gemini key removed')
      return
    }
    setIsTestingKey(true)
    try {
      const result = await testGeminiConnection(trimmed, preferredModel)
      if (result.ok) {
        setGeminiApiKey(trimmed)
        setHasGeminiKey(true)
        setShowKeyInput(false)
        if (result.cascaded) {
          toast.success(
            isArabic
              ? `تم الاتصال بنجاح عبر النموذج البديل (${result.model}) بعد تخطي ضغط النماذج الأخرى!`
              : `Connected via fallback model (${result.model})!`
          )
        } else {
          toast.success(isArabic ? `تم الاتصال بنجاح بنموذج (${result.model})!` : `Connected to (${result.model}) successfully!`)
        }
      } else {
        toast.error(isArabic ? `فشل الاتصال: ${result.message}` : `Connection failed: ${result.message}`)
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setIsTestingKey(false)
    }
  }

  const fetchSubtitles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllSubtitles(true)
      setSubtitles(data || [])
    } catch {
      toast.error(isArabic ? 'فشل تحميل بيانات الترجمات' : 'Failed to load subtitles')
    } finally {
      setLoading(false)
    }
  }, [isArabic])

  useEffect(() => {
    fetchSubtitles()
  }, [fetchSubtitles])

  // Map lectures with subtitles
  const lecturesWithSubs = useMemo(() => {
    return lectures.map((lecture) => {
      const tracks = subtitles.filter(
        (s) =>
          s.lectureId === lecture.id ||
          s.aliasLectureId === lecture.id ||
          (lecture.aliasId && (s.lectureId === lecture.aliasId || s.aliasLectureId === lecture.aliasId)) ||
          (lecture.id === '184c887b-1d29-468a-b592-313768735783' && (s.lectureId === 'lec-ai-101' || s.aliasLectureId === 'lec-ai-101')) ||
          (lecture.id === 'lec-ai-101' && (s.lectureId === '184c887b-1d29-468a-b592-313768735783' || s.aliasLectureId === '184c887b-1d29-468a-b592-313768735783'))
      )
      return {
        ...lecture,
        tracks,
        hasSubs: tracks.length > 0,
        publishedTracks: tracks.filter((t) => t.status === 'published'),
      }
    })
  }, [lectures, subtitles])

  const filteredLectures = useMemo(() => {
    return lecturesWithSubs.filter((l) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        l.titleAr?.toLowerCase().includes(q) ||
        l.titleEn?.toLowerCase().includes(q) ||
        l.subjectAr?.toLowerCase().includes(q) ||
        l.subjectEn?.toLowerCase().includes(q)

      let matchesStatus = true
      if (statusFilter === 'has_subs') matchesStatus = l.hasSubs
      else if (statusFilter === 'missing_subs') matchesStatus = !l.hasSubs
      else if (statusFilter === 'published') matchesStatus = l.publishedTracks.length > 0
      else if (statusFilter === 'needs_review') {
        matchesStatus = l.tracks.some((t) => t.status === 'needs_review' || t.status === 'ai_generated')
      }

      return matchesSearch && matchesStatus
    })
  }, [lecturesWithSubs, search, statusFilter])

  // Metrics
  const metrics = useMemo(() => {
    const total = lectures.length
    const withSubs = lecturesWithSubs.filter((l) => l.hasSubs).length
    const published = subtitles.filter((s) => s.status === 'published').length
    const reviewNeeded = subtitles.filter((s) => s.status === 'needs_review' || s.status === 'ai_generated').length
    return { total, withSubs, published, reviewNeeded }
  }, [lectures.length, lecturesWithSubs, subtitles])

  // Generation Handler
  const handleStartGeneration = async () => {
    if (!selectedLectureId) {
      toast.error(isArabic ? 'يرجى اختيار المحاضرة أولاً' : 'Please select a lecture first')
      return
    }
    if (audioSourceType === 'upload' && !audioFile) {
      toast.error(isArabic ? 'يرجى إرفاق ملف الصوت المصرح به' : 'Please upload authorized audio file')
      return
    }
    if (!authorizedConfirmation) {
      toast.error(isArabic ? 'يرجى تأكيد امتلاك تصريح استخدام المادة الصوتية' : 'Please confirm authorization to use audio')
      return
    }

    const targetLecture = lectures.find((l) => l.id === selectedLectureId)
    setIsGenerating(true)
    try {
      await runSubtitleGenerationPipeline({
        lectureId: selectedLectureId,
        lectureTitle: targetLecture?.titleAr || targetLecture?.titleEn,
        lectureSubject: targetLecture?.subjectAr || targetLecture?.subjectEn,
        audioFile,
        sourceLang,
        targetLangs,
        engine: selectedEngine,
        onProgress: (p) => setGenerationProgress(p),
      })
      toast.success(isArabic ? 'تم توليد الترجمة ونشرها بنجاح!' : 'Subtitles generated and published successfully!')
      setGenerationModalOpen(false)
      setGenerationProgress(null)
      fetchSubtitles()
      onRefresh?.()
    } catch (err) {
      toast.error(err.message || (isArabic ? 'فشلت عملية التوليد' : 'Generation failed'))
    } finally {
      setIsGenerating(false)
    }
  }

  // Import Handler
  const handleImportSubmit = async () => {
    if (!importLectureId) {
      toast.error(isArabic ? 'يرجى اختيار المحاضرة' : 'Select a lecture')
      return
    }
    if (!importContent.trim()) {
      toast.error(isArabic ? 'يرجى إدخال محتوى الملف' : 'Please provide subtitle content')
      return
    }

    try {
      await importSubtitleFile({
        lectureId: importLectureId,
        text: importContent,
        format: importFormat,
        language: importLang,
        status: 'needs_review',
      })
      toast.success(isArabic ? 'تم استيراد ملف الترجمة بنجاح' : 'Subtitle imported successfully')
      setImportModalOpen(false)
      setImportContent('')
      fetchSubtitles()
      onRefresh?.()
    } catch (err) {
      toast.error(err.message || 'Import failed')
    }
  }

  // Subtitle Editor Cue Operations
  const handleUpdateCue = (cueId, field, val) => {
    if (!editorSubtitle) return
    const updatedCues = editorSubtitle.cues.map((c) => {
      if (c.id === cueId) {
        return {
          ...c,
          [field]: field === 'start' || field === 'end' ? Number(val) : val,
        }
      }
      return c
    })
    setEditorSubtitle({ ...editorSubtitle, cues: updatedCues })
  }

  const handleAddCue = () => {
    if (!editorSubtitle) return
    const cues = editorSubtitle.cues || []
    const lastCue = cues[cues.length - 1]
    const start = lastCue ? lastCue.end + 0.5 : 0
    const end = start + 3
    const newCue = {
      id: `cue_${Date.now()}`,
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      text: isArabic ? 'نص المقطع الجديد...' : 'New subtitle cue text...',
    }
    setEditorSubtitle({ ...editorSubtitle, cues: [...cues, newCue] })
  }

  const handleDeleteCue = (cueId) => {
    if (!editorSubtitle) return
    const cues = editorSubtitle.cues.filter((c) => c.id !== cueId)
    setEditorSubtitle({ ...editorSubtitle, cues })
  }

  const handleSplitCue = (cue) => {
    if (!editorSubtitle) return
    const duration = cue.end - cue.start
    if (duration < 1) {
      toast.error(isArabic ? 'المقطع قصير جداً لتقسيمه' : 'Cue is too short to split')
      return
    }
    const mid = Math.round((cue.start + duration / 2) * 100) / 100
    const words = cue.text.split(' ')
    const halfWords = Math.ceil(words.length / 2)
    const text1 = words.slice(0, halfWords).join(' ')
    const text2 = words.slice(halfWords).join(' ') || (isArabic ? 'مقطع جديد' : 'New cue')

    const cue1 = { ...cue, end: mid, text: text1 }
    const cue2 = { id: `cue_${Date.now()}`, start: mid + 0.05, end: cue.end, text: text2 }

    const idx = editorSubtitle.cues.findIndex((c) => c.id === cue.id)
    const newCues = [...editorSubtitle.cues]
    newCues.splice(idx, 1, cue1, cue2)
    setEditorSubtitle({ ...editorSubtitle, cues: newCues })
    toast.success(isArabic ? 'تم تقسيم المقطع إلى مقطعين' : 'Cue split into two segments')
  }

  const handleTranslateEditorCues = async () => {
    if (!editorSubtitle || !editorSubtitle.cues || editorSubtitle.cues.length === 0) {
      toast.error(isArabic ? 'لا توجد مقاطع للترجمة' : 'No cues to translate')
      return
    }

    const currentLang = editorSubtitle.language || 'en'
    const targetLang = currentLang === 'ar' ? 'en' : 'ar'

    setIsTranslatingEditor(true)
    setEditorTranslateProgress(isArabic ? 'جاري الاتصال بمحرك الترجمة...' : 'Connecting to AI Neural Translate...')

    try {
      let translatedCues = []
      if (isGeminiAvailable()) {
        setEditorTranslateProgress(isArabic ? 'جاري الترجمة بـ Google Gemini Flash...' : 'Translating with Google Gemini...')
        try {
          translatedCues = await translateCuesWithGemini(editorSubtitle.cues, targetLang, {
            onProgress: ({ pct, label }) => {
              setEditorTranslateProgress(label || `Gemini: ${pct}%`)
            },
          })
        } catch {
          translatedCues = await translateCues(
            editorSubtitle.cues,
            currentLang,
            targetLang,
            ({ current, total, pct }) => {
              setEditorTranslateProgress(
                isArabic
                  ? `ترجمة أكاديمية: ${current} من ${total} (${pct}%)`
                  : `Translating: ${current} of ${total} (${pct}%)`
              )
            }
          )
        }
      } else {
        translatedCues = await translateCues(
          editorSubtitle.cues,
          currentLang,
          targetLang,
          ({ current, total, pct }) => {
            setEditorTranslateProgress(
              isArabic
                ? `ترجمة أكاديمية: ${current} من ${total} (${pct}%)`
                : `Translating: ${current} of ${total} (${pct}%)`
            )
          }
        )
      }

      setEditorSubtitle({
        ...editorSubtitle,
        language: targetLang,
        labelAr: targetLang === 'ar' ? 'العربية (مترجمة بالذكاء الاصطناعي)' : 'الإنجليزية',
        labelEn: targetLang === 'ar' ? 'Arabic (AI Translated)' : 'English',
        sourceType: 'translation',
        cues: translatedCues,
      })

      toast.success(
        isArabic
          ? `تمت الترجمة إلى ${targetLang === 'ar' ? 'العربية' : 'الإنجليزية'} وتطبيق مصطلحات علوم الحاسوب بنجاح!`
          : `Translated to ${targetLang} with academic glossary applied!`
      )
    } catch (err) {
      toast.error(err.message || 'Translation failed')
    } finally {
      setIsTranslatingEditor(false)
      setEditorTranslateProgress(null)
    }
  }

  const handleSaveEditor = async (newStatus) => {
    if (!editorSubtitle) return
    try {
      const validated = validateCues(editorSubtitle.cues)
      await saveSubtitle({
        ...editorSubtitle,
        cues: validated,
        status: newStatus || editorSubtitle.status,
      })
      toast.success(
        newStatus === 'published'
          ? (isArabic ? 'تم اعتماد ونشر الترجمة بنجاح' : 'Subtitle published successfully')
          : (isArabic ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully')
      )
      setEditorSubtitle(null)
      fetchSubtitles()
      onRefresh?.()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    }
  }

  const selectedLectureForEditor = useMemo(() => {
    if (!editorSubtitle) return null
    return lectures.find((l) => l.id === editorSubtitle.lectureId)
  }, [editorSubtitle, lectures])

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/50">{isArabic ? 'إجمالي المحاضرات' : 'Total Lectures'}</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{metrics.total}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <FiPlay size={20} />
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/50">{isArabic ? 'محاضرات بترجمة' : 'With Subtitles'}</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">{metrics.withSubs}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <FiFileText size={20} />
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/50">{isArabic ? 'ترجمات منشورة' : 'Published'}</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{metrics.published}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/50">{isArabic ? 'بحاجة لمراجعة' : 'Needs Review'}</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{metrics.reviewNeeded}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <FiAlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-md">
            <FiSearch size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isArabic ? 'بحث باسم المحاضرة أو المادة...' : 'Search lectures...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none"
          >
            <option value="all">{isArabic ? 'كل المحاضرات' : 'All Lectures'}</option>
            <option value="has_subs">{isArabic ? 'تحتوي على ترجمة' : 'Has Subtitles'}</option>
            <option value="missing_subs">{isArabic ? 'بدون ترجمة' : 'Missing Subtitles'}</option>
            <option value="needs_review">{isArabic ? 'تحتاج مراجعة' : 'Needs Review'}</option>
            <option value="published">{isArabic ? 'منشورة للطلاب' : 'Published'}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition flex items-center gap-1.5 border border-white/10"
          >
            <FiUploadCloud size={14} className="text-cyan-400" />
            <span>{isArabic ? 'استيراد VTT / SRT' : 'Import VTT/SRT'}</span>
          </button>

          <button
            type="button"
            onClick={() => setGenerationModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-royal-600 hover:opacity-90 text-white shadow-lg transition flex items-center gap-1.5"
          >
            <FiCpu size={14} />
            <span>{isArabic ? 'توليد ترجمة ذكية (AI)' : 'Generate with AI'}</span>
          </button>
        </div>
      </div>

      {/* Lectures & Subtitle Tracks Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-black/30 border-b border-white/10 text-white/50 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-start">{isArabic ? 'المحاضرة' : 'Lecture'}</th>
                <th className="px-4 py-3.5 text-start">{isArabic ? 'المادة' : 'Course'}</th>
                <th className="px-4 py-3.5 text-center">{isArabic ? 'مسارات الترجمة' : 'Subtitle Tracks'}</th>
                <th className="px-4 py-3.5 text-center">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3.5 text-end">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/40">
                    {isArabic ? 'لا توجد محاضرات تطابق الفلتر.' : 'No lectures match the filter.'}
                  </td>
                </tr>
              ) : (
                filteredLectures.map((lecture) => (
                  <tr key={lecture.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white max-w-[280px]">
                      <div className="truncate font-semibold">{isArabic ? lecture.titleAr : lecture.titleEn}</div>
                      <span className="text-[10px] text-white/40 font-mono">ID: {lecture.id}</span>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px]">
                        {isArabic ? lecture.subjectAr : lecture.subjectEn}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lecture.tracks.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {lecture.tracks.map((t) => (
                            <span
                              key={t.id}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                STATUS_BADGES[t.status]?.cls || 'bg-white/10 text-white'
                              }`}
                              title={`${t.labelAr || t.language} - ${STATUS_BADGES[t.status]?.labelAr}`}
                            >
                              {t.language.toUpperCase()} ({t.cues?.length || 0})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/30 italic text-[11px]">
                          {isArabic ? 'غير متوفرة' : 'None'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lecture.hasSubs ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <FiCheck size={13} />
                          {isArabic ? 'جاهزة' : 'Ready'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/80 font-medium">
                          <FiAlertCircle size={13} />
                          {isArabic ? 'تحتاج ترجمة' : 'Needs Subtitles'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {lecture.tracks.some((t) => t.language === 'en') && (
                          <button
                            type="button"
                            onClick={async () => {
                              const enTrack = lecture.tracks.find((t) => t.language === 'en')
                              if (!enTrack) return
                              const toastId = `tr_${lecture.id}`
                              toast.loading(isArabic ? 'جاري ترجمة وتوحيد المصطلحات بالذكاء الاصطناعي...' : 'Translating with AI...', { id: toastId })
                              try {
                                await translateSubtitleTrack({ subtitleId: enTrack.id, targetLang: 'ar' })
                                toast.success(isArabic ? 'تم حفظ ونشر الترجمة العربية بنجاح!' : 'Arabic translation published!', { id: toastId })
                                fetchSubtitles()
                                onRefresh?.()
                              } catch (err) {
                                toast.error(err.message || 'Translation failed', { id: toastId })
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/25 transition text-[11px] flex items-center gap-1"
                            title={
                              lecture.tracks.some((t) => t.language === 'ar')
                                ? (isArabic ? 'إعادة توليد الترجمة العربية بالذكاء الاصطناعي' : 'Regenerate Arabic with AI')
                                : (isArabic ? 'توليد ترجمة عربية تلقائية من الإنجليزية' : 'Auto-translate to Arabic')
                            }
                          >
                            <span>
                              ✨ {lecture.tracks.some((t) => t.language === 'ar') ? (isArabic ? 'إعادة ترجمة' : 'Re-translate') : (isArabic ? 'ترجمة' : 'Translate')}
                            </span>
                          </button>
                        )}

                        {lecture.tracks.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setEditorSubtitle({ ...t })}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                            title={isArabic ? `تعديل ترجمة ${t.language}` : `Edit ${t.language}`}
                          >
                            <FiEdit3 size={13} />
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLectureId(lecture.id)
                            setGenerationModalOpen(true)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition text-[11px] flex items-center gap-1 border border-white/10"
                        >
                          <FiPlus size={11} />
                          <span>{isArabic ? 'إضافة' : 'Add'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subtitle Editor Modal */}
      {editorSubtitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-white/15 overflow-hidden shadow-2xl bg-slate-950">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-black/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <FiEdit3 size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {isArabic ? 'محرر الترجمة المصاحبة والتوقيتات' : 'Subtitle & Cue Editor'}
                  </h3>
                  <p className="text-[11px] text-white/50 truncate">
                    {isArabic ? selectedLectureForEditor?.titleAr : selectedLectureForEditor?.titleEn} (
                    {editorSubtitle.language.toUpperCase()})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEditor('needs_review')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                >
                  {isArabic ? 'حفظ كمسودة' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveEditor('published')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <FiCheckCircle size={14} />
                  <span>{isArabic ? 'اعتماد ونشر' : 'Publish'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditorSubtitle(null)}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split into Video Preview & Cues Editor */}
            <div className="flex-1 grid lg:grid-cols-12 overflow-hidden">
              {/* Left/Top: Live Video Preview (5 cols) */}
              <div className="lg:col-span-5 p-4 border-b lg:border-b-0 lg:border-e border-white/10 bg-black/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    {selectedLectureForEditor && (
                      <VideoPlayer
                        ref={editorPlayerRef}
                        videoId={lectureVideoId(selectedLectureForEditor)}
                        url={selectedLectureForEditor.url}
                        title={selectedLectureForEditor.titleAr}
                        autoPlay={false}
                        subtitles={[editorSubtitle]}
                        onTimeUpdate={(t) => setPreviewTime(t)}
                      />
                    )}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between text-white/50 text-[11px]">
                      <span>{isArabic ? 'التوقيت الحالي' : 'Current Time'}</span>
                      <span className="font-mono text-cyan-400 font-bold">{formatVttTime(previewTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/50 text-[11px]">
                      <span>{isArabic ? 'عدد المقاطع' : 'Total Cues'}</span>
                      <span className="font-mono text-white font-bold">{editorSubtitle.cues?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleAddCue}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <FiPlus size={13} />
                    <span>{isArabic ? 'إضافة مقطع زمني' : 'Add Cue'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const validated = validateCues(editorSubtitle.cues)
                      setEditorSubtitle({ ...editorSubtitle, cues: validated })
                      toast.success(isArabic ? 'تم التحقق من التوقيتات وحل أي تداخلات' : 'Timestamps validated & overlaps resolved')
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs flex items-center gap-1.5 transition"
                  >
                    <FiSliders size={13} />
                    <span>{isArabic ? 'تصحيح التداخلات' : 'Fix Overlaps'}</span>
                  </button>
                </div>
              </div>

              {/* Right/Bottom: Cues List & Timestamps (7 cols) */}
              <div className="lg:col-span-7 flex flex-col overflow-hidden bg-black/10">
                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/80">{isArabic ? 'المقاطع الزمنية (Cues)' : 'Transcript Cues'}</span>
                    <span className="text-[10px] text-white/40">
                      ({editorSubtitle.cues?.length || 0})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTranslateEditorCues}
                    disabled={isTranslatingEditor}
                    className="px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                  >
                    <FiRefreshCw className={isTranslatingEditor ? 'animate-spin text-cyan-400' : ''} size={12} />
                    <span>
                      {isTranslatingEditor
                        ? (editorTranslateProgress || (isArabic ? 'جاري الترجمة...' : 'Translating...'))
                        : (editorSubtitle.language === 'ar'
                            ? (isArabic ? '✨ ترجمة ذكية إلى الإنجليزية' : '✨ Translate to English')
                            : (isArabic ? '✨ ترجمة ذكية إلى العربية' : '✨ Translate to Arabic'))}
                    </span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {editorSubtitle.cues.map((cue, idx) => (
                    <div
                      key={cue.id || idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        previewTime >= cue.start && previewTime <= cue.end
                          ? 'bg-cyan-500/15 border-cyan-400/50 shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Time controls */}
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => editorPlayerRef.current?.seekTo?.(cue.start)}
                            className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 transition"
                            title={isArabic ? 'معاينة هذا المقطع' : 'Seek to cue'}
                          >
                            <FiPlay size={11} />
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            value={cue.start}
                            onChange={(e) => handleUpdateCue(cue.id, 'start', e.target.value)}
                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[11px] text-cyan-400 font-bold text-center focus:outline-none"
                          />
                          <span className="text-white/40">➔</span>
                          <input
                            type="number"
                            step="0.1"
                            value={cue.end}
                            onChange={(e) => handleUpdateCue(cue.id, 'end', e.target.value)}
                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[11px] text-cyan-400 font-bold text-center focus:outline-none"
                          />
                          <span className="text-white/30 text-[10px]">
                            ({(cue.end - cue.start).toFixed(1)}s)
                          </span>
                        </div>

                        {/* Split / Delete actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSplitCue(cue)}
                            className="p-1 rounded text-white/50 hover:text-cyan-400 hover:bg-white/10"
                            title={isArabic ? 'تقسيم المقطع' : 'Split cue'}
                          >
                            <FiScissors size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCue(cue.id)}
                            className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-white/10"
                            title={isArabic ? 'حذف المقطع' : 'Delete cue'}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={cue.text}
                        onChange={(e) => handleUpdateCue(cue.id, 'text', e.target.value)}
                        rows={2}
                        dir={editorSubtitle.language === 'ar' ? 'rtl' : 'ltr'}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Subtitle Generation Workflow Modal */}
      {generationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-xl rounded-3xl border border-white/15 p-5 sm:p-6 bg-slate-950 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-royal-600 text-white">
                  <FiCpu size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isArabic ? 'إنشاء وتوليد ترجمة بالذكاء الاصطناعي' : 'Generate Subtitles with AI'}
                  </h3>
                  <p className="text-[11px] text-white/50">
                    {isArabic ? 'معالجة الصوت والتفريغ والترجمة الأكاديمية' : 'Full STT & Academic Translation Pipeline'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isGenerating && setGenerationModalOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Workflow Steps / Options */}
            <div className="space-y-4">
              {/* 1. Select Lecture */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  1. {isArabic ? 'اختر المحاضرة المستهدفة:' : 'Target Lecture:'}
                </label>
                <select
                  value={selectedLectureId}
                  onChange={(e) => setSelectedLectureId(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">{isArabic ? '-- اختر محاضرة --' : '-- Select lecture --'}</option>
                  {lectures.map((l) => (
                    <option key={l.id} value={l.id}>
                      {isArabic ? l.titleAr : l.titleEn} ({l.subjectAr || l.subjectEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Authorized Audio Source */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center justify-between">
                  <span>2. {isArabic ? 'المصدر الصوتي المصرح به:' : 'Authorized Audio Source:'}</span>
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <FiShield size={11} />
                    {isArabic ? 'التزام بحقوق الملكية' : 'Rights Compliant'}
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAudioSourceType('upload')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition ${
                        audioSourceType === 'upload'
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}
                    >
                      {isArabic ? 'رفع ملف صوت أصلي' : 'Upload Audio File'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioSourceType('authorized_source')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition ${
                        audioSourceType === 'authorized_source'
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}
                    >
                      {isArabic ? 'مصدر المحاضر المصرح' : 'Authorized Instructor Source'}
                    </button>
                  </div>

                  {audioSourceType === 'upload' ? (
                    <div className="border border-dashed border-white/20 rounded-xl p-3 text-center bg-white/5">
                      <input
                        type="file"
                        accept="audio/*,video/mp4"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="text-xs text-white/80 file:me-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-500 file:text-white"
                      />
                      {audioFile && (
                        <p className="text-[11px] text-cyan-400 mt-1">
                          {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 leading-relaxed">
                      {isArabic
                        ? 'سيتم استخدام ملف المحاضرة المرفوع والمصرح به عبر إدارة المساق مباشرة دون انتهاك شروط أي منصة.'
                        : 'Using instructor-provided source file adhering to platform terms.'}
                    </div>
                  )}

                  {/* Legal checkbox */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorizedConfirmation}
                      onChange={(e) => setAuthorizedConfirmation(e.target.checked)}
                      className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                    />
                    <span className="text-[11px] text-white/70">
                      {isArabic
                        ? 'أؤكد أن المادة الصوتية مصرح باستخدامها وتفريغها أكاديمياً لطلاب جامعة الأزهر.'
                        : 'I confirm authorization to transcribe this audio for academic purposes.'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Gemini AI Integration Banner / Key Configuration */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-royal-600/10 border border-violet-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
                      <FiKey size={14} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {isArabic ? 'ربط مفتاح Google Gemini AI' : 'Google Gemini AI Integration'}
                        {hasGeminiKey ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <FiCheck size={10} /> {isArabic ? 'متصل ونشط' : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {isArabic ? 'اختياري / وضع المحاكاة' : 'Optional'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    {showKeyInput ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'تعديل المفتاح' : 'Configure')}
                  </button>
                </div>

                {showKeyInput && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      {isArabic
                        ? 'أدخل مفتاحك الخاص (GEMINI_API_KEY) من Google AI Studio للحصول على تفريغ صوتي حقيقي متقدم مع توقيتات دقيقة وترجمة أكاديمية.'
                        : 'Provide your GEMINI_API_KEY from Google AI Studio to unlock live Speech-to-Text audio transcription and academic translation.'}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAndTestGeminiKey}
                        disabled={isTestingKey}
                        className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition shadow"
                      >
                        {isTestingKey ? (
                          <>
                            <FiRefreshCw className="animate-spin" size={12} />
                            {isArabic ? 'اختبار...' : 'Testing...'}
                          </>
                        ) : (
                          <>
                            <FiCheck size={12} />
                            {isArabic ? 'حفظ واختبار' : 'Save & Test'}
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>{isArabic ? 'المفتاح يُحفظ محلياً في متصفحك أو كمتغير بيئة.' : 'Key stored safely in browser local storage.'}</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        {isArabic ? 'الحصول على مفتاح مجاني ↗' : 'Get free key ↗'}
                      </a>
                    </div>

                    {/* Model Selector & Live Diagnostics */}
                    <div className="pt-2 border-t border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                          <FiCpu size={13} className="text-cyan-400" />
                          <span>{isArabic ? 'النموذج المعتمد للذكاء الاصطناعي:' : 'Active Gemini Model:'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleRunModelDiagnostics}
                          disabled={isDiagnosingModels}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <FiActivity size={12} className={isDiagnosingModels ? 'animate-spin' : ''} />
                          <span>
                            {isDiagnosingModels
                              ? (isArabic ? 'جاري الفحص المباشر...' : 'Probing models...')
                              : (isArabic ? 'فحص جاهزية النماذج والسرعة' : 'Check Models Health')}
                          </span>
                        </button>
                      </div>

                      <select
                        value={preferredModel}
                        onChange={(e) => handleSelectPreferredModel(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="auto">
                          {isArabic
                            ? '⚡ التبديل الذكي التلقائي (Auto Cascade - موصى به لتفادي أي ضغط)'
                            : '⚡ Smart Auto Cascade (Recommended - bypasses overloaded models)'}
                        </option>
                        {AVAILABLE_GEMINI_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {isArabic ? m.descriptionAr : m.descriptionEn}
                          </option>
                        ))}
                      </select>

                      {/* Live Model Diagnostics Results */}
                      {showDiagnostics && modelDiagnostics.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-white/60 font-medium block">
                            {isArabic ? 'نتائج فحص النماذج المباشر مع استجابة السيرفر:' : 'Live Model Server Latency & Status:'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto overscroll-contain pr-1">
                            {modelDiagnostics.map((diag) => {
                              const isSelected = preferredModel === diag.id
                              const isGreen = diag.status === 'available'
                              const isAmber = diag.status === 'high_demand'

                              return (
                                <div
                                  key={diag.id}
                                  className={`p-2 rounded-xl border text-xs transition ${
                                    isSelected
                                      ? 'border-cyan-400/80 bg-cyan-500/10 shadow-sm'
                                      : 'border-white/10 bg-black/20 hover:border-white/20'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          isGreen ? 'bg-emerald-400 animate-pulse' : isAmber ? 'bg-amber-400' : 'bg-red-400'
                                        }`}
                                      />
                                      <span className="font-bold text-white text-[11px] truncate">{diag.name}</span>
                                    </div>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${diag.badgeColor}`}>
                                      {isArabic ? diag.badge : diag.badgeEn}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/5">
                                    <span
                                      className={`text-[10px] font-mono ${
                                        isGreen ? 'text-emerald-400' : isAmber ? 'text-amber-300' : 'text-rose-400'
                                      }`}
                                    >
                                      {isArabic ? diag.messageAr : diag.messageEn}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectPreferredModel(diag.id)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                                        isSelected
                                          ? 'bg-cyan-500 text-black font-bold'
                                          : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                                      }`}
                                    >
                                      {isSelected ? (isArabic ? 'مُعتمد ✓' : 'Selected') : (isArabic ? 'اختيار' : 'Select')}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-white/50 leading-relaxed bg-black/20 p-2 rounded-xl border border-white/5">
                        {isArabic
                          ? '💡 نصيحة: في حال ظهور رسالة ضغط مؤقت (High Demand) على نموذج معين كـ Gemini 3.8 Flash، يقوم وضع التبديل الذكي تلقائياً بنقل الطلب خلال ثوانٍ إلى Gemini 3.5 Flash-Lite أو Gemini 2.5 Flash دون انقطاع.'
                          : '💡 Tip: Smart Auto Cascade automatically fails over in seconds to Gemini 3.5 Flash-Lite or Gemini 2.5 Flash if a flagship model experiences temporary demand spikes.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Engine & Languages */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    3. {isArabic ? 'محرك التفريغ:' : 'STT Engine:'}
                  </label>
                  <select
                    value={selectedEngine}
                    onChange={(e) => setSelectedEngine(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="gemini-flash">Google Gemini 3.8 Flash (الموصى به - الأحدث والأعلى دقة)</option>
                    <option value="whisper-api">OpenAI Whisper API</option>
                    <option value="deepgram">Deepgram Nova-2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    4. {isArabic ? 'لغة المحاضرة الأصلية:' : 'Source Audio Language:'}
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="en">English (الإنجليزية)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>
              </div>

              {/* Cost & Duration Estimate */}
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <FiDollarSign size={14} />
                  <span>{isArabic ? 'التكلفة التقديرية:' : 'Estimated Cost:'}</span>
                </div>
                <div className="text-end font-mono">
                  <span className="font-bold text-white">$0.00</span>
                  <span className="text-[10px] text-cyan-400 ms-1">({isArabic ? 'مجاني / حصة تجريبية' : 'Free tier'})</span>
                </div>
              </div>

              {/* Progress bar if generating */}
              {isGenerating && generationProgress && (
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <FiRefreshCw className="animate-spin" size={13} />
                      {generationProgress.label}
                    </span>
                    <span className="font-mono font-bold">{generationProgress.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-royal-500 transition-all duration-300"
                      style={{ width: `${generationProgress.pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setGenerationModalOpen(false)}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                disabled={isGenerating || !selectedLectureId || !authorizedConfirmation}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-royal-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold shadow-lg transition flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={13} />
                    <span>{isArabic ? 'جاري المعالجة...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <FiCpu size={14} />
                    <span>{isArabic ? 'بدء التوليد والمعالجة' : 'Start Pipeline'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg rounded-3xl border border-white/15 p-5 bg-slate-950 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                {isArabic ? 'استيراد ملف ترجمة (WebVTT / SRT)' : 'Import Subtitle File'}
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded text-white/40 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 mb-1">{isArabic ? 'المحاضرة:' : 'Lecture:'}</label>
                <select
                  value={importLectureId}
                  onChange={(e) => setImportLectureId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">{isArabic ? '-- اختر المحاضرة --' : '-- Select lecture --'}</option>
                  {lectures.map((l) => (
                    <option key={l.id} value={l.id}>
                      {isArabic ? l.titleAr : l.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/70 mb-1">{isArabic ? 'اللغة:' : 'Language:'}</label>
                  <select
                    value={importLang}
                    onChange={(e) => setImportLang(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value="ar">العربية (Arabic)</option>
                    <option value="en">English (الإنجليزية)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 mb-1">{isArabic ? 'الصيغة:' : 'Format:'}</label>
                  <select
                    value={importFormat}
                    onChange={(e) => setImportFormat(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value="vtt">WebVTT (.vtt)</option>
                    <option value="srt">SubRip (.srt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 mb-1">{isArabic ? 'محتوى الملف:' : 'File Content:'}</label>
                <textarea
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  rows={6}
                  placeholder={`WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nمرحباً بكم...`}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 text-white/70 text-xs"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow"
              >
                {isArabic ? 'استيراد وحفظ' : 'Import & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
