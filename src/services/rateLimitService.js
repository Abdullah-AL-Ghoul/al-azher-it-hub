// Rate Limiting Service for API Requests
// يمنع التلاعب بالبيانات وإعادة التحميل المفرط

const RATE_LIMIT_CONFIG = {
  // 3 requests في الدقيقة (3 requests per minute) لكل طالب
  STUDENT_RATE_LIMIT: 3,
  // 10 requests في الدقيقة (10 requests per minute) لكل مصدر
  SOURCE_RATE_LIMIT: 10,
  // لا يمكن تجاوز التعليقات
  COMMENTS_PER_MINUTE: 2,
  // لا يمكن متابعة أكثر من 10 في الدقيقة
  FAVORITES_PER_MINUTE: 10,
  // إعادة تعيين كلمة المرور: 3 محاولات في الدقيقة
  PASSWORD_RESET_PER_MINUTE: 3
}

// Rate limiting cache
const rateLimitCache = new Map()

// Helper: تحديد الرابط الفريد (Route + Method)
function getCacheKey(path, method = 'GET') {
  if (!path.startsWith('/api/')) {
    // Convert '/lectures' to 'GET:/lectures'
    return `${method.toUpperCase()}:${path}`
  }
  return path
}

// Helper: التحقق من Rate Limit
function checkRateLimit(userId, path, configLimit) {
  const cacheKey = `${userId}:${getCacheKey(path)}`
  const now = Date.now()
  const cached = rateLimitCache.get(cacheKey)
  
  if (!cached) {
    // لا يوجد سجل من قبل - مفوح
    rateLimitCache.set(cacheKey, {
      count: 1,
      resetTime: now + 60000 // 60 seconds
    })
    return { allowed: true, remaining: configLimit - 1 }
  }
  
  // تحديث العداد إذا كان الوقت أقل من 1 دقيقة
  if (now < cached.resetTime) {
    const newCount = cached.count + 1
    rateLimitCache.set(cacheKey, {
      count: newCount,
      resetTime: cached.resetTime
    })
    
    if (newCount > configLimit) {
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter: Math.ceil((cached.resetTime - now) / 1000) + 1
      }
    }
    
    return { 
      allowed: true, 
      remaining: configLimit - newCount 
    }
  }
  
  // إعادة ضبط العداد إذا انتهت الدقيقة
  rateLimitCache.set(cacheKey, {
    count: 1,
    resetTime: now + 60000
  })
  
  return { allowed: true, remaining: configLimit - 1 }
}

// Cleanup expired entries every 30s (avoid 1s busy loop)
let cleanupTimer = null
function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitCache.entries()) {
      if (now >= value.resetTime) rateLimitCache.delete(key)
    }
    if (rateLimitCache.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }, 30000)
  if (cleanupTimer.unref) cleanupTimer.unref()
}
startCleanup()

export const RateLimitService = {
  config: RATE_LIMIT_CONFIG,
  // debounce helper for UI actions (300ms default)
  debounce: (fn, ms = 300) => {
    let t
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn(...args), ms)
    }
  },
  // التحقق من Rate Limit للطلاب
  checkStudentRateLimit: (studentId, path) => {
    if (!studentId) return { allowed: true }
    const r = checkRateLimit(studentId, path, RATE_LIMIT_CONFIG.STUDENT_RATE_LIMIT)
    if (rateLimitCache.size > 0) startCleanup()
    return r
  },
  
  // التحقق من Rate Limit للمصادر
  checkSourceRateLimit: (studentId, path) => {
    if (!studentId) return { allowed: true }
    return checkRateLimit(studentId, path, RATE_LIMIT_CONFIG.SOURCE_RATE_LIMIT)
  },
  
  // التحقق من Rate Limit للتعليقات
  checkCommentRateLimit: (studentId) => {
    if (!studentId) return { allowed: true }
    const cacheKey = `comments:${studentId}`
    const now = Date.now()
    const cached = rateLimitCache.get(cacheKey)
    
    if (!cached) {
      rateLimitCache.set(cacheKey, {
        count: 1,
        resetTime: now + 60000
      })
      return { allowed: true, remaining: RATE_LIMIT_CONFIG.COMMENTS_PER_MINUTE - 1 }
    }
    
    if (now < cached.resetTime) {
      const newCount = cached.count + 1
      rateLimitCache.set(cacheKey, {
        count: newCount,
        resetTime: cached.resetTime
      })
      
      if (newCount > RATE_LIMIT_CONFIG.COMMENTS_PER_MINUTE) {
        return { 
          allowed: false, 
          remaining: 0,
          retryAfter: Math.ceil((cached.resetTime - now) / 1000) + 1
        }
      }
      
      return { allowed: true, remaining: RATE_LIMIT_CONFIG.COMMENTS_PER_MINUTE - newCount }
    }
    
    rateLimitCache.set(cacheKey, {
      count: 1,
      resetTime: now + 60000
    })
    
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.COMMENTS_PER_MINUTE - 1 }
  },
  
  // تحديث Rate Limit (للفيديوهات والمفضلة)
  updateStudentLimit: (studentId, path, count = 1) => {
    if (!studentId) return { allowed: true }
    const cacheKey = `${studentId}:${getCacheKey(path)}`
    const now = Date.now()
    const cached = rateLimitCache.get(cacheKey)
    
    if (!cached) {
      rateLimitCache.set(cacheKey, {
        count,
        resetTime: now + 60000
      })
      return { allowed: true, remaining: RATE_LIMIT_CONFIG.STUDENT_RATE_LIMIT - count }
    }
    
    if (now < cached.resetTime) {
      const newCount = cached.count + count
      rateLimitCache.set(cacheKey, {
        count: newCount,
        resetTime: cached.resetTime
      })
      
      if (newCount > RATE_LIMIT_CONFIG.STUDENT_RATE_LIMIT) {
        return { 
          allowed: false, 
          remaining: 0,
          retryAfter: Math.ceil((cached.resetTime - now) / 1000) + 1
        }
      }
      
      return { allowed: true, remaining: RATE_LIMIT_CONFIG.STUDENT_RATE_LIMIT - newCount }
    }
    
    rateLimitCache.set(cacheKey, {
      count,
      resetTime: now + 60000
    })
    
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.STUDENT_RATE_LIMIT - count }
  },
  
  // تسجيل الخروج (Clean up)
  cleanup: (studentId) => {
    if (!studentId) return
    // حذف كافة السجلات المرتبطة بهذا المستخدم
    for (const key of rateLimitCache.keys()) {
      if (key.startsWith(`${studentId}:`)) {
        rateLimitCache.delete(key)
      }
    }
  }
}