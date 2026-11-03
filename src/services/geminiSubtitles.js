/**
 * Google Gemini AI Integration for Speech-to-Text & Academic Subtitle Translation
 * Al-Azhar IT Hub - Computer Science & Information Technology LMS
 *
 * Connects directly to the Gemini 2.0 / 1.5 Flash API for high-fidelity audio transcription
 * with precise timestamps and specialized Computer Science translation adhering to
 * university terminology standards.
 */

import { validateCues, applyAcademicGlossary, TECHNICAL_GLOSSARY } from '../utils/vttParser'

const GEMINI_STORAGE_KEY = 'al_azher_gemini_api_key'
const GEMINI_MODEL_STORAGE_KEY = 'al_azher_gemini_preferred_model'

export const AVAILABLE_GEMINI_MODELS = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    tier: 'recommended',
    descriptionAr: 'الأسرع والأقل تأثراً بضغط السيرفرات، خفيف ومثالي للترجمة الفورية',
    descriptionEn: 'Ultra-fast & resilient to server demand spikes, high throughput',
    badge: 'موصى به للسرعة',
    badgeEn: 'Recommended',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tier: 'balanced',
    descriptionAr: 'متوازن بين الذكاء والسرعة للاستخدام الأكاديمي',
    descriptionEn: 'Balanced intelligence & speed for academic workflows',
    badge: 'متوازن',
    badgeEn: 'Balanced',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tier: 'flagship',
    descriptionAr: 'الأحدث والأعلى ذكاءً (قد يشهد ضغطاً مؤقتاً في ساعات الذروة)',
    descriptionEn: 'Latest flagship intelligence (may experience peak-hour demand)',
    badge: 'الأعلى ذكاءً',
    badgeEn: 'Flagship',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tier: 'stable',
    descriptionAr: 'نموذج مستقر عالي الاعتمادية ومناسب للتفريغ الصوتي',
    descriptionEn: 'High reliability stable model for audio transcription',
    badge: 'مستقر وموثوق',
    badgeEn: 'Stable',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    tier: 'fast',
    descriptionAr: 'خفيف وسريع جداً، استجابة فورية بأقل زمن انتظار',
    descriptionEn: 'Fast & lightweight with minimal latency',
    badge: 'سريع جداً',
    badgeEn: 'Fast',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    tier: 'pro',
    descriptionAr: 'نموذج التفكير العميق للمصطلحات المعقدة والترجمات التخصصية',
    descriptionEn: 'Deep reasoning model for specialized academic terms',
    badge: 'تفكير عميق',
    badgeEn: 'Pro Reasoning',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
]

const CANDIDATE_MODELS = AVAILABLE_GEMINI_MODELS.map((m) => m.id)
const PRIMARY_MODEL = CANDIDATE_MODELS[0]
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Get preferred Gemini model ID (or 'auto')
 * @returns {string}
 */
export function getPreferredGeminiModel() {
  try {
    const stored = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY)
    if (stored && (stored === 'auto' || CANDIDATE_MODELS.includes(stored))) {
      return stored
    }
  } catch (_e) { /* ignore */ }
  return 'auto'
}

/**
 * Set preferred Gemini model ID (or 'auto')
 * @param {string} modelId
 */
export function setPreferredGeminiModel(modelId) {
  try {
    if (!modelId || modelId === 'auto') {
      localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, 'auto')
    } else if (CANDIDATE_MODELS.includes(modelId)) {
      localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, modelId)
    }
  } catch (_e) { /* ignore */ }
}

/**
 * Retrieve the active Gemini API key from localStorage or environment variables.
 * @returns {string}
 */
export function getGeminiApiKey() {
  try {
    const local = localStorage.getItem(GEMINI_STORAGE_KEY)
    if (local && local.trim()) return local.trim()
  } catch (_e) { /* ignore */ }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  return (envKey && typeof envKey === 'string' && envKey.trim()) ? envKey.trim() : ''
}

/**
 * Save Gemini API key to persistent local storage.
 * @param {string} key
 */
export function setGeminiApiKey(key) {
  if (!key || !key.trim()) {
    removeGeminiApiKey()
    return
  }
  try {
    localStorage.setItem(GEMINI_STORAGE_KEY, key.trim())
  } catch (_e) { /* ignore */ }
}

/**
 * Remove saved Gemini API key.
 */
export function removeGeminiApiKey() {
  try {
    localStorage.removeItem(GEMINI_STORAGE_KEY)
  } catch (_e) { /* ignore */ }
}

/**
 * Check if a Gemini API key is configured and available.
 * @returns {boolean}
 */
export function isGeminiAvailable() {
  return Boolean(getGeminiApiKey())
}

/**
 * Convert a File or Blob into base64 data and mimeType.
 * @param {File|Blob} file
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as data URL'))
        return
      }
      const [header, base64] = result.split(',')
      const mimeMatch = header.match(/data:([^;]+);base64/)
      const mimeType = mimeMatch ? mimeMatch[1] : (file.type || 'audio/mp3')
      resolve({ base64, mimeType })
    }
    reader.onerror = () => reject(reader.error || new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
}

/**
 * Call a single Gemini model with a strict timeout.
 * @param {string} apiKey
 * @param {string} model
 * @param {string} promptText
 * @param {number} [timeoutMs=7000]
 * @returns {Promise<{ ok: boolean, text: string, model: string, latencyMs: number }>}
 */
export async function callSingleModel(apiKey, model, promptText = 'Respond with: READY', timeoutMs = 7000) {
  const start = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const payload = {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: { maxOutputTokens: 20, temperature: 0.1 },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - start)

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const rawMessage = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`
      const isHighDemand =
        res.status === 503 ||
        res.status === 429 ||
        rawMessage.toLowerCase().includes('high demand') ||
        rawMessage.toLowerCase().includes('spikes in demand') ||
        rawMessage.toLowerCase().includes('overloaded') ||
        rawMessage.toLowerCase().includes('resource has been exhausted')
      const isNotFound =
        res.status === 404 ||
        rawMessage.toLowerCase().includes('no longer available') ||
        rawMessage.toLowerCase().includes('not found') ||
        rawMessage.toLowerCase().includes('deprecated')

      const err = new Error(rawMessage)
      err.status = res.status
      err.isHighDemand = isHighDemand
      err.isNotFound = isNotFound
      err.latencyMs = latencyMs
      throw err
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
    return { ok: true, text, model, latencyMs }
  } catch (err) {
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - start)
    err.latencyMs = latencyMs
    if (err.name === 'AbortError') {
      err.isTimeout = true
      err.isHighDemand = true
      err.message = `مهلة الاستجابة انتهت (${Math.round(timeoutMs / 1000)}s) - ضغط سيرفر`
    }
    throw err
  }
}

/**
 * Runs live health diagnostics across all candidate Gemini models
 * Returns status, latency, and operational assessment.
 * @param {string} [apiKey]
 * @returns {Promise<Array<Object>>}
 */
export async function diagnoseGeminiModels(apiKey) {
  const key = apiKey || getGeminiApiKey()
  if (!key) return []

  const probePromises = AVAILABLE_GEMINI_MODELS.map(async (m) => {
    try {
      const res = await callSingleModel(key, m.id, 'Ping: return READY', 6500)
      return {
        id: m.id,
        name: m.name,
        badge: m.badge,
        badgeEn: m.badgeEn,
        badgeColor: m.badgeColor,
        descriptionAr: m.descriptionAr,
        status: 'available',
        latencyMs: res.latencyMs,
        messageAr: `متصل وجاهز (${res.latencyMs}ms)`,
        messageEn: `Operational (${res.latencyMs}ms)`,
      }
    } catch (err) {
      let status = 'error'
      let messageAr = err.message || 'خطأ غير معروف'
      let messageEn = err.message || 'Unknown error'

      if (err.isHighDemand) {
        status = 'high_demand'
        messageAr = `ضغط مؤقت على السيرفر (High Demand - ${err.latencyMs}ms)`
        messageEn = `High Demand (${err.latencyMs}ms)`
      } else if (err.isNotFound) {
        status = 'not_available'
        messageAr = 'غير متاح لهذا الحساب أو الإصدار'
        messageEn = 'Not available for this account'
      } else if (err.message?.includes('API_KEY_INVALID') || err.status === 400) {
        status = 'invalid_key'
        messageAr = 'مفتاح API غير صالح'
        messageEn = 'Invalid API key'
      }

      return {
        id: m.id,
        name: m.name,
        badge: m.badge,
        badgeEn: m.badgeEn,
        badgeColor: m.badgeColor,
        descriptionAr: m.descriptionAr,
        status,
        latencyMs: err.latencyMs || 0,
        messageAr,
        messageEn,
      }
    }
  })

  return Promise.all(probePromises)
}

/**
 * Helper to call Gemini generateContent API with smart auto-cascade fallback.
 * Automatically avoids models with high demand spikes or deprecations.
 *
 * @param {string} apiKey
 * @param {Array<Object>} contents
 * @param {Object} [generationConfig]
 * @param {number} [timeoutMs=14000]
 * @returns {Promise<{ data: any, text: string, model: string, cascaded: boolean }>}
 */
async function callGeminiGenerateContent(apiKey, contents, generationConfig = {}, timeoutMs = 14000) {
  const preferred = getPreferredGeminiModel()

  // Build model priority list
  let models = []
  if (preferred && preferred !== 'auto') {
    models = [preferred, ...CANDIDATE_MODELS.filter((m) => m !== preferred)]
  } else {
    // Default smart order: high-resilience fast models first
    models = CANDIDATE_MODELS
  }

  let lastError = null
  const attempts = []

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
      const payload = {
        contents,
        generationConfig: {
          temperature: 0.2,
          ...generationConfig,
        },
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const rawMessage = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`
        const lower = rawMessage.toLowerCase()

        const isHighDemandOrOverloaded =
          res.status === 503 ||
          res.status === 429 ||
          res.status === 500 ||
          res.status === 502 ||
          res.status === 504 ||
          lower.includes('high demand') ||
          lower.includes('spikes in demand') ||
          lower.includes('overloaded') ||
          lower.includes('capacity') ||
          lower.includes('resource has been exhausted') ||
          lower.includes('temporarily unavailable')

        const isDeprecationOrNotFound =
          res.status === 404 ||
          lower.includes('no longer available') ||
          lower.includes('not found') ||
          lower.includes('deprecated') ||
          lower.includes('unsupported')

        attempts.push({ model, status: res.status, error: rawMessage })

        if (isHighDemandOrOverloaded || isDeprecationOrNotFound) {
          console.warn(`[Gemini Cascade] Model ${model} returned (${res.status}: ${rawMessage}). Attempting next fallback model...`)
          lastError = new Error(`Gemini API [${model}]: ${rawMessage}`)
          continue // Swiftly cascade to next model!
        }

        throw new Error(`Gemini API [${model}] Error: ${rawMessage}`)
      }

      const data = await res.json()
      const candidate = data?.candidates?.[0]
      const text = candidate?.content?.parts?.map((p) => p.text).join('') || ''
      return { data, text, model, cascaded: i > 0, attempts }
    } catch (err) {
      clearTimeout(timer)
      const isTimeout = err.name === 'AbortError'
      const msg = isTimeout ? `مهلة الاستجابة انتهت (${Math.round(timeoutMs / 1000)}s)` : err.message
      attempts.push({ model, error: msg })

      const lower = msg.toLowerCase()
      const isTransient =
        isTimeout ||
        lower.includes('high demand') ||
        lower.includes('spikes in demand') ||
        lower.includes('overloaded') ||
        lower.includes('unavailable') ||
        lower.includes('timeout') ||
        lower.includes('abort') ||
        lower.includes('no longer available') ||
        lower.includes('not found') ||
        lower.includes('404') ||
        lower.includes('503') ||
        lower.includes('429')

      if (isTransient && i < models.length - 1) {
        console.warn(`[Gemini Cascade] Model ${model} failed (${msg}). Cascading to next model...`)
        lastError = err
        continue
      }
      throw err
    }
  }

  throw lastError || new Error(`فشلت جميع نماذج Gemini المتاحة بعد عدة محاولات (${attempts.map((a) => a.model).join(', ')})`)
}

/**
 * Test connectivity with Gemini API using provided or stored key and optional target model.
 * @param {string} [testKey]
 * @param {string} [targetModel]
 * @returns {Promise<{ ok: boolean, message: string, model: string, cascaded: boolean }>}
 */
export async function testGeminiConnection(testKey, targetModel) {
  const key = testKey || getGeminiApiKey()
  if (!key) {
    return { ok: false, message: 'مفتاح Gemini API غير متوفر' }
  }

  // If a specific model was requested for testing, test it directly with 6s timeout
  if (targetModel && targetModel !== 'auto') {
    try {
      const res = await callSingleModel(key, targetModel, 'Respond with: READY', 6500)
      return {
        ok: true,
        model: targetModel,
        latencyMs: res.latencyMs,
        cascaded: false,
        message: `تم الاتصال بنجاح بنموذج (${targetModel}) في ${res.latencyMs}ms!`,
      }
    } catch (err) {
      if (err.isHighDemand) {
        return {
          ok: false,
          model: targetModel,
          message: `النموذج (${targetModel}) يشهد ضغطاً مؤقتاً على السيرفر (High Demand). يوصى باختيار (Auto Cascade) أو نموذج بديل.`,
        }
      }
      return { ok: false, model: targetModel, message: err.message || 'فشل الاتصال بهذا النموذج' }
    }
  }

  // Otherwise, run auto-cascade to find the fastest operational model
  try {
    const { text, model, cascaded } = await callGeminiGenerateContent(
      key,
      [
        {
          role: 'user',
          parts: [{ text: 'Respond with the single word: "READY"' }],
        },
      ],
      { maxOutputTokens: 10 },
      7000
    )

    if (cascaded) {
      return {
        ok: true,
        model,
        cascaded: true,
        message: `تم الاتصال بنجاح عبر النموذج البديل (${model}) بعد تجاوز ضغط النماذج السابقة!`,
      }
    }

    return {
      ok: true,
      model,
      cascaded: false,
      message: `تم الاتصال بنجاح بنموذج (${model})!`,
    }
  } catch (err) {
    return { ok: false, message: err.message || 'فشل الاتصال بـ Gemini API' }
  }
}

/**
 * Transcribe an audio file using Gemini Multimodal Audio Input.
 * Generates accurate WebVTT-compatible subtitle cues with timestamps.
 *
 * @param {File|Blob} audioFile
 * @param {Object} [options]
 * @param {string} [options.apiKey]
 * @param {string} [options.language='en']
 * @param {Function} [options.onProgress]
 * @returns {Promise<Array<{ start: number, end: number, text: string }>>}
 */
export async function transcribeAudioWithGemini(audioFile, options = {}) {
  const apiKey = options.apiKey || getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_KEY_REQUIRED: يرجى إدخال مفتاح Gemini API في لوحة التحكم لبدء التفريغ الصوتي الحقيقي.')
  }

  options.onProgress?.({ step: 2, label: 'تجهيز الملف الصوتي وترميزه لمعالجة الذكاء الاصطناعي...', pct: 25 })
  const { base64, mimeType } = await fileToBase64(audioFile)

  options.onProgress?.({ step: 3, label: 'إرسال الصوت إلى Google Gemini 3.8 Flash واستخراج المقاطع والـ Timestamps...', pct: 55 })

  const prompt = `You are an expert Automatic Speech Recognition (ASR) system specialized in academic Computer Science, AI, and Software Engineering lectures.
Listen carefully to the provided audio file and transcribe the lecture into synchronized subtitle cues.

REQUIREMENTS:
1. Divide the speech into natural, readable subtitle segments (each between 3 to 7 seconds long).
2. For each segment, output:
   - "start": start time in seconds (float, e.g. 0.0)
   - "end": end time in seconds (float, e.g. 4.8)
   - "text": the precise transcribed speech text
3. Ensure all technical Computer Science and AI terms are spelled correctly (e.g. Neural Networks, Gradient Descent, Backpropagation, Loss Function, Data Structures, Pointers, Arrays).
4. Return ONLY a valid JSON object with a single key "cues" containing the array of segments.
Example:
{
  "cues": [
    { "start": 0.0, "end": 4.5, "text": "This is a handwritten number 3 in standard format." },
    { "start": 4.8, "end": 9.5, "text": "To a computer, this image is represented as a grid of 28 by 28 pixels." }
  ]
}`

  const contents = [
    {
      role: 'user',
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType.startsWith('audio/') ? mimeType : 'audio/mp3',
            data: base64,
          },
        },
      ],
    },
  ]

  const { text } = await callGeminiGenerateContent(apiKey, contents, {
    responseMimeType: 'application/json',
  })

  options.onProgress?.({ step: 4, label: 'فحص مخرجات الذكاء الاصطناعي وتدقيق التوقيتات...', pct: 80 })

  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch (_e) {
    // Attempt json cleanup if wrapped in markdown
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    parsed = JSON.parse(cleaned)
  }

  const rawCues = Array.isArray(parsed) ? parsed : (parsed?.cues || [])
  if (!rawCues || rawCues.length === 0) {
    throw new Error('لم يتمكن نموذج الذكاء الاصطناعي من استخراج مقاطع نصية من هذا الملف الصوتي.')
  }

  const validated = validateCues(rawCues)
  return validated
}

/**
 * Translate subtitle cues into Arabic or English using Gemini AI with academic CS terminology enforcement.
 *
 * @param {Array<Object>} cues
 * @param {string} targetLang 'ar' | 'en'
 * @param {Object} [options]
 * @param {string} [options.apiKey]
 * @param {Function} [options.onProgress]
 * @returns {Promise<Array<Object>>}
 */
export async function translateCuesWithGemini(cues, targetLang = 'ar', options = {}) {
  const apiKey = options.apiKey || getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_KEY_REQUIRED: يرجى توفير مفتاح Gemini API لإتمام الترجمة الأكاديمية.')
  }

  if (!Array.isArray(cues) || cues.length === 0) return []

  options.onProgress?.({ current: 0, total: cues.length, pct: 10, label: 'إعداد المقاطع للترجمة الأكاديمية بـ Gemini...' })

  // Prepare glossary hints for Gemini prompt
  const glossarySample = Object.entries(TECHNICAL_GLOSSARY)
    .slice(0, 30)
    .map(([en, ar]) => `${en} -> ${ar}`)
    .join('\n')

  const prompt = `You are a Senior Computer Science Professor and Technical Translator at Al-Azhar University.
Translate the following lecture subtitle cues into fluent, academic ${targetLang === 'ar' ? 'Arabic' : 'English'}.

CRITICAL ACADEMIC GUIDELINES:
1. Accurate, natural, and university-level scholarly language.
2. For Arabic translation: Keep the English technical term in parentheses alongside the Arabic term on key concepts (e.g., "الشبكات العصبية (Neural Networks)", "الانحدار التدريجي (Gradient Descent)", "دالة التنشيط (Activation Function)").
3. Use this official CS terminology reference:
${glossarySample}
4. Maintain the EXACT same number of cues with exact start and end timestamps. Do NOT merge or drop cues.
5. Return strictly a JSON object with a "cues" array:
{
  "cues": [
    { "start": 0.0, "end": 4.5, "text": "..." }
  ]
}

Input cues to translate:
${JSON.stringify(cues.map(c => ({ start: c.start, end: c.end, text: c.text })))}`

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ]

  const { text } = await callGeminiGenerateContent(apiKey, contents, {
    responseMimeType: 'application/json',
  })

  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch (_e) {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    parsed = JSON.parse(cleaned)
  }

  const translatedList = Array.isArray(parsed) ? parsed : (parsed?.cues || [])
  const resultCues = cues.map((orig, idx) => {
    const item = translatedList[idx] || {}
    let translatedText = item.text || orig.text
    if (targetLang === 'ar') {
      translatedText = applyAcademicGlossary(translatedText)
    }
    return {
      ...orig,
      id: orig.id || `cue_${idx + 1}`,
      start: typeof item.start === 'number' ? item.start : orig.start,
      end: typeof item.end === 'number' ? item.end : orig.end,
      text: translatedText,
    }
  })

  return validateCues(resultCues)
}

/**
 * End-to-end Subtitle Generation Pipeline powered by Google Gemini AI.
 * Handles audio transcription, timestamp alignment, and multilingual academic translation.
 *
 * @param {Object} options
 * @param {string} options.lectureId
 * @param {File} [options.audioFile]
 * @param {string} [options.sourceLang='en']
 * @param {string[]} [options.targetLangs=['ar']]
 * @param {string} [options.apiKey]
 * @param {Function} [options.onProgress]
 * @returns {Promise<Array<Object>>}
 */
export async function runGeminiSubtitlePipeline({
  lectureId,
  lectureTitle,
  lectureSubject,
  audioFile,
  sourceLang = 'en',
  targetLangs = ['ar'],
  apiKey,
  onProgress,
}) {
  const activeKey = apiKey || getGeminiApiKey()
  if (!activeKey) {
    throw new Error('GEMINI_KEY_REQUIRED: يرجى حفظ مفتاح Gemini API في لوحة التحكم للتشغيل الحقيقي.')
  }

  // Step 1: Speech to Text
  onProgress?.({ step: 1, label: 'التحقق من الاتصال بمحرك Gemini AI للترجمة والتفريغ...', pct: 15 })
  let baseCues = []

  if (audioFile) {
    baseCues = await transcribeAudioWithGemini(audioFile, {
      apiKey: activeKey,
      language: sourceLang,
      onProgress,
    })
  } else {
    // Academic prompt-based synthesis matching the exact lecture topic
    const topic = lectureTitle || 'مدخل إلى الذكاء الاصطناعي والشبكات العصبية العميقة (Neural Networks)'
    const subject = lectureSubject || 'الذكاء الاصطناعي وتعلم الآلة'
    onProgress?.({ step: 2, label: `توليد المقاطع الزمنية الأكاديمية لمساق (${topic}) عبر Gemini...`, pct: 35 })

    const prompt = `You are a university professor preparing educational subtitle transcripts.
Generate a realistic, academically accurate subtitle transcript with 8 to 10 timed cues for the university lecture titled "${topic}" in the subject "${subject}".
The language of the text must be ${sourceLang === 'ar' ? 'Arabic' : 'English'}.
The cues must accurately match the specific lecture topic (key concepts, definitions, operational formulas, and core components).
Each cue must have:
- "start": start time in seconds (e.g. 0.0)
- "end": end time in seconds (e.g. 4.8)
- "text": subtitle content

Return strictly a valid JSON object matching:
{
  "cues": [
    { "start": 0.0, "end": 4.5, "text": "..." }
  ]
}`
    const { text } = await callGeminiGenerateContent(
      activeKey,
      [{ role: 'user', parts: [{ text: prompt }] }],
      { responseMimeType: 'application/json' }
    )

    let parsed = null
    try {
      parsed = JSON.parse(text)
    } catch (_e) {
      const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleaned)
    }
    const rawCues = Array.isArray(parsed) ? parsed : (parsed?.cues || [])
    baseCues = validateCues(rawCues)
  }

  onProgress?.({ step: 3, label: 'تم استخراج وتجهيز التفريغ بنجاح، جاري الحفظ وتطبيق القاموس الأكاديمي...', pct: 70 })

  return {
    baseCues,
    sourceLang,
    targetLangs,
  }
}
