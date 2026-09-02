// Convert the bogus `, t` second component param into a proper hook call.
import fs from 'fs'

const FILES = [
  'src/components/AdminDashboard/AdminDashboardContent.jsx',
  'src/components/AdminDashboard/FormActions.jsx',
  'src/components/AdminDashboard/AdminSearch.jsx',
  'src/components/AdminDashboard/Pagination.jsx',
  'src/components/AdminDashboard/OverviewPanel.jsx',
  'src/components/AdminDashboard/StudentLogs.jsx',
  'src/components/AdminDashboard/CoursesTable.jsx',
  'src/components/AdminDashboard/SettingsPanel.jsx',
  'src/components/auth/SocialAuth.jsx',
  'src/components/auth/AuthLayout.jsx',
  'src/components/shared/VideoPlayer.jsx',
  'src/components/spatial/SpatialInput.jsx',
]

for (const f of FILES) {
  let s = fs.readFileSync(f, 'utf8')

  // Remove the appended `, t` (possibly `, t `) from the component signature.
  s = s.replace(/,(\s*)t(\s*\))/g, '$1$2')

  // Insert the hook as the first statement of that function body.
  // Find the function declaration we flagged, then insert after its `{`.
  const fnRe = /(export default (?:memo\()?\s*function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{)/
  if (!fnRe.test(s)) {
    console.log(`${f}: NO-FN`)
    continue
  }
  s = s.replace(fnRe, `$1\n const { t } = useLanguage()`)

  if (!/from '.*LanguageContext'/.test(s)) {
    const lines = s.split('\n')
    let lastImport = -1
    lines.forEach((l, i) => { if (/^import /.test(l)) lastImport = i })
    lines.splice(lastImport + 1, 0, `import { useLanguage } from '../../context/LanguageContext'`)
    s = lines.join('\n')
  }
  fs.writeFileSync(f, s)
  console.log(`${f}: wired`)
}
console.log('done')
