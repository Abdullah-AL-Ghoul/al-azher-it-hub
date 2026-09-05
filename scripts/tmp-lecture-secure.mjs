// One-off: migrate LectureDetail.jsx to the secure blob-based file access.
import fs from 'fs'

let s = fs.readFileSync('src/pages/LectureDetail.jsx', 'utf8')

const oldEffect = ` // Storage-backed source files are private: resolve short-lived signed URLs.
 const [sourceSigned, setSourceSigned] = useState({})
 useEffect(() => {
  let active = true
  const paths = [...new Set(relatedSources.flatMap(s => getSourceFiles(s).map(f => f.path).filter(Boolean)))]
  if (paths.length === 0) { setSourceSigned({}); return }
  getSignedSourceUrls(paths).then(map => { if (active) setSourceSigned(map) }).catch(() => {})
  return () => { active = false }
 }, [relatedSources])`

const newBlock = ` // Storage-backed source files are private: bytes are fetched per access
 // under the user's session and opened as blob URLs (nothing shareable).
 const secureFile = useSecureSourceFile()
 const signer = (path, opts) => signSourceForFetch(path, { download: opts?.download === true, name: opts?.name })
 const openSourceSecure = async (f, mode) => {
  if (!f.path) { if (f.url) window.open(f.url, '_blank', 'noopener,noreferrer'); return }
  try { await secureFile.open(f.path, { name: f.name || 'file', mode, signIn: signer }) }
  catch { toast.error(isArabic ? 'تعذّر الوصول للملف. أعد المحاولة.' : 'Could not open the file. Try again.') }
 }`

if (!s.includes(oldEffect)) { console.log('EFFECT-MISS'); process.exit(1) }
s = s.replace(oldEffect, newBlock)

const oldFiles = / {2,}\{files\.slice\(0, 3\)\.map\(\(f, i\) => \{\n {16}const fileUrl = resolveFileUrl\(f, sourceSigned\)\n {16}return \(\n {16}<div key=\{i\} className="flex items-center gap-1\.5 text-xs">\n {17}<FiFile size=\{10\} className="text-emerald-500 flex-shrink-0" \/>\n {17}<span className="text-slate-600 dark:text-white\/60 truncate flex-1">\{f\.name\}<\/span>\n {17}<a href=\{fileUrl\}[^>]*><FiExternalLink size=\{11\} \/><\/a>\n {17}<button onClick=\{\(\) => downloadFile\(fileUrl, f\.name\)\}[^>]*><FiDownload size=\{11\} \/><\/button>\n {16}<\/div>\n {16}\)\n {15}\}\)/

if (!oldFiles.test(s)) { console.log('FILES-MISS'); process.exit(1) }
s = s.replace(oldFiles, ` {files.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                 <FiFile size={10} className="text-emerald-500 flex-shrink-0" />
                 <span className="text-slate-600 dark:text-white/60 truncate flex-1">{f.name}</span>
                 <button onClick={() => openSourceSecure(f, 'view')} className="p-0.5 rounded text-cyan-500 hover:bg-cyan-500/10" aria-label={isArabic ? \`فتح \${f.name}\` : \`Open \${f.name}\`}><FiExternalLink size={11} /></button>
                 <button onClick={() => openSourceSecure(f, 'download')} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10" aria-label={isArabic ? \`تحميل \${f.name}\` : \`Download \${f.name}\`}><FiDownload size={11} /></button>
                </div>
               ))}`)

s = s.replace(
  "import { getLectures, getSources, getFavorites, getRatings, getViewed, toggleFavorite, setRating, markViewed, addStudentLog, getSignedSourceUrls } from '../services'",
  "import { getLectures, getSources, getFavorites, getRatings, getViewed, toggleFavorite, setRating, markViewed, addStudentLog, signSourceForFetch } from '../services'"
)
s = s.replace("import { resolveFileUrl } from '../hooks/useSignedSources'", "import useSecureSourceFile from '../hooks/useSecureSourceFile'")

fs.writeFileSync('src/pages/LectureDetail.jsx', s)
console.log('LectureDetail migrated')
