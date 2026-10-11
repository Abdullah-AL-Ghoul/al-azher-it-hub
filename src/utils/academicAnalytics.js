/**
 * Al-Azhar IT Hub — Academic Analytics & Graduation Predictor Engine
 */

/**
 * Evaluates curriculum progress broken down by official requirement categories:
 * - university (متطلبات جامعة)
 * - college (متطلبات كلية)
 * - major (إجباري تخصص)
 * - elective (اختياري تخصص)
 */
export function calculateCategoryBreakdown(curriculum = [], progressState = {}) {
  const breakdown = {
    university: { id: 'university', labelAr: 'متطلبات جامعة', labelEn: 'University Requirements', totalHours: 0, passedHours: 0, totalCourses: 0, passedCourses: 0, color: 'emerald' },
    college: { id: 'college', labelAr: 'متطلبات كلية', labelEn: 'College Requirements', totalHours: 0, passedHours: 0, totalCourses: 0, passedCourses: 0, color: 'sky' },
    major: { id: 'major', labelAr: 'إجباري تخصص', labelEn: 'Major Core', totalHours: 0, passedHours: 0, totalCourses: 0, passedCourses: 0, color: 'royal' },
    elective: { id: 'elective', labelAr: 'اختياري تخصص', labelEn: 'Major Electives', totalHours: 0, passedHours: 0, totalCourses: 0, passedCourses: 0, color: 'amber' },
  }

  curriculum.forEach(yr => {
    yr.semesters?.forEach(sem => {
      sem.courses?.forEach(course => {
        const type = course.type || 'major'
        const category = breakdown[type] || breakdown.major
        const hours = Number(course.hours) || 0
        const isPassed = progressState[course.id] === 'passed'

        category.totalHours += hours
        category.totalCourses += 1

        if (isPassed) {
          category.passedHours += hours
          category.passedCourses += 1
        }
      })
    })
  })

  // Compute percentages
  Object.values(breakdown).forEach(cat => {
    cat.percentage = cat.totalHours > 0 ? Math.min(100, Math.round((cat.passedHours / cat.totalHours) * 100)) : 0
  })

  return breakdown
}

/**
 * Calculates the required future average across remaining hours to hit a target graduation GPA.
 * Formula: (targetGpa * totalHours - currentGpa * completedHours) / remainingHours
 */
export function calculateTargetGpaRequirement(totalHours, completedHours, currentGpa, targetGpa) {
  const total = Number(totalHours) || 136
  const completed = Number(completedHours) || 0
  const curr = Number(currentGpa) || 0
  const target = Number(targetGpa) || 0

  const remaining = Math.max(0, total - completed)

  if (remaining === 0) {
    return {
      achievable: curr >= target,
      requiredGpa: null,
      maxPossibleGpa: curr,
      messageAr: 'لقد أكملت جميع الساعات المعتمدة في الخطة الدراسية.',
      messageEn: 'You have completed all curriculum credit hours.',
    }
  }

  const maxPossible = Number((((curr * completed) + (100 * remaining)) / total).toFixed(2))
  const neededAverage = Number((((target * total) - (curr * completed)) / remaining).toFixed(2))

  if (neededAverage > 100) {
    return {
      achievable: false,
      requiredGpa: neededAverage,
      maxPossibleGpa: maxPossible,
      messageAr: `المعدل المستهدف (${target}%) يتجاوز الحد الأقصى الممكن رياضياً (${maxPossible}%).`,
      messageEn: `Target GPA (${target}%) exceeds maximum mathematically possible (${maxPossible}%).`,
    }
  }

  if (neededAverage <= 50) {
    return {
      achievable: true,
      requiredGpa: 50,
      maxPossibleGpa: maxPossible,
      messageAr: `هدف في المتناول! تحتاج فقط للنجاح بحد أدنى 50% في الساعات المتبقية.`,
      messageEn: `Well on track! You only need to pass with minimum 50% in remaining courses.`,
    }
  }

  return {
    achievable: true,
    requiredGpa: neededAverage,
    maxPossibleGpa: maxPossible,
    messageAr: `تحتاج لتحقيق متوسط ${neededAverage}% في الساعات المتبقية (${remaining} ساعة) لتحقيق هدفك.`,
    messageEn: `You need an average of ${neededAverage}% across remaining ${remaining} hours.`,
  }
}

/**
 * Returns academic honor roll status according to Al-Azhar University standards.
 */
export function getHonorRollStanding(pct) {
  const num = Number(pct) || 0
  if (num >= 90) return { labelAr: 'امتياز مع مرتبة الشرف 🌟', labelEn: 'Excellent with High Honors 🌟', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' }
  if (num >= 85) return { labelAr: 'امتياز (A) 🎖️', labelEn: 'Excellent (A) 🎖️', badge: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30' }
  if (num >= 80) return { labelAr: 'جيد جداً مرتفع (B+) ✨', labelEn: 'Very Good High (B+) ✨', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' }
  if (num >= 75) return { labelAr: 'جيد جداً (B)', labelEn: 'Very Good (B)', badge: 'bg-royal-500/15 text-royal-600 dark:text-cyan-400 border-royal-500/30' }
  if (num >= 70) return { labelAr: 'جيد مرتفع (C+)', labelEn: 'Good High (C+)', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' }
  if (num >= 65) return { labelAr: 'جيد (C)', labelEn: 'Good (C)', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' }
  if (num >= 60) return { labelAr: 'مقبول مرتفع (D+)', labelEn: 'Satisfactory High (D+)', badge: 'bg-orange-500/15 text-orange-600 border-orange-500/30' }
  if (num >= 50) return { labelAr: 'مقبول (D)', labelEn: 'Satisfactory (D)', badge: 'bg-rose-500/15 text-rose-600 border-rose-500/30' }
  return { labelAr: 'إنذار أكاديمي / راسب (F)', labelEn: 'Academic Warning (F)', badge: 'bg-rose-500/20 text-rose-500 border-rose-500/40' }
}
