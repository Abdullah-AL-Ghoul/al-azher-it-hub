import { test, expect } from '@playwright/test'

test.describe('Sources & Past Exams Archive Suite', () => {
  test('navigates to sources, tests tabs, exam filtering, and preview modal', async ({ page }) => {
    const mockSources = [
      {
        id: 'src-1',
        titleAr: 'امتحان نهائي لمساق هياكل البيانات 2024',
        titleEn: 'Final Exam Data Structures 2024',
        subjectAr: 'تراكيب البيانات',
        subjectEn: 'Data Structures',
        category: 'final',
        files: [{ name: 'Data_Structures_Final_2024.pdf', path: 'exams/ds_final_2024.pdf', size: 102400 }],
        fileData: 'https://example.com/ds_final_2024.pdf',
        fileName: 'Data_Structures_Final_2024.pdf',
        date: '2024-06-15',
      },
      {
        id: 'src-2',
        titleAr: 'امتحان نصفي لمساق نظم قواعد البيانات 2024',
        titleEn: 'Midterm Exam Database Systems 2024',
        subjectAr: 'نظم قواعد بيانات',
        subjectEn: 'Database Systems',
        category: 'midterm',
        files: [{ name: 'Database_Midterm_2024.pdf', path: 'exams/db_midterm_2024.pdf', size: 81920 }],
        fileData: 'https://example.com/db_midterm_2024.pdf',
        fileName: 'Database_Midterm_2024.pdf',
        date: '2024-04-10',
      },
      {
        id: 'src-3',
        titleAr: 'ملخص شامل لمساق شبكات الحاسوب (1)',
        titleEn: 'Comprehensive Summary Computer Networks I',
        subjectAr: 'شبكات الحاسوب',
        subjectEn: 'Computer Networks',
        category: 'summary',
        files: [{ name: 'Networks_Summary.pdf', path: 'summaries/networks.pdf', size: 204800 }],
        fileData: 'https://example.com/networks.pdf',
        fileName: 'Networks_Summary.pdf',
        date: '2024-05-01',
      },
    ]

    // Intercept Supabase users API
    await page.route('**/rest/v1/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ studentId: '20241001', name: 'عبدالله طارق', role: 'student' }]),
      })
    })

    // Intercept Supabase sources API
    await page.route('**/rest/v1/sources*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-2/3' },
        body: JSON.stringify(mockSources),
      })
    })

    // Set logged-in student mock session
    await page.addInitScript(() => {
      sessionStorage.setItem('al_azher_lang', 'ar')
      sessionStorage.setItem(
        'al_azher_session',
        JSON.stringify({
          studentId: '20241001',
          name: 'عبدالله طارق',
          role: 'student',
        })
      )
    })

    // Visit /sources
    await page.goto('/sources')

    // 1. Verify Page Title
    await expect(page.locator('h1')).toBeVisible()

    // 2. Verify Academic Mode Navigation Tabs exist
    const allTab = page.getByRole('button', { name: /جميع المصادر والمراجع|All Study Sources/i })
    const examsTab = page.getByRole('button', { name: /أرشيف الامتحانات السابقة|Past Exams Archive/i })
    const summariesTab = page.getByRole('button', { name: /الملخصات والتفريغات|Summaries & Notes/i })
    await expect(allTab).toBeVisible()
    await expect(examsTab).toBeVisible()
    await expect(summariesTab).toBeVisible()

    // 3. Verify category badges on cards
    await expect(page.locator('text=امتحان نهائي').first()).toBeVisible()
    await expect(page.locator('text=امتحان نصفي').first()).toBeVisible()
    await expect(page.locator('text=ملخص دراسي').first()).toBeVisible()

    // 4. Switch to Past Exams Archive
    await examsTab.click()
    // Sub-type bar should appear
    await expect(page.locator('text=تصنيف نماذج الامتحانات')).toBeVisible()
    await expect(page.getByRole('button', { name: /امتحانات نهائية|Final Exams/i })).toBeVisible()

    // In exams mode, only exams should appear, summary should be filtered out
    await expect(page.locator('text=امتحان نهائي لمساق هياكل البيانات 2024')).toBeVisible()
    await expect(page.locator('text=ملخص شامل لمساق شبكات الحاسوب (1)')).not.toBeVisible()

    // 5. Test in-app preview modal
    const previewBtn = page.getByTitle('معاينة المستند').first()
    await expect(previewBtn).toBeVisible()
    await previewBtn.click()

    // Modal dialog should open
    const modalDialog = page.getByRole('dialog')
    await expect(modalDialog).toBeVisible()
    await expect(modalDialog.locator('text=مستند PDF معتمد')).toBeVisible()

    // Close preview modal
    const closeBtn = modalDialog.getByTitle('إغلاق')
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
    await expect(modalDialog).not.toBeVisible()
  })
})
