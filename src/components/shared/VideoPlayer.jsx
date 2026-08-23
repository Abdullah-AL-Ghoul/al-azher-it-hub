import { useState } from 'react'
import { FiPlay, FiExternalLink, FiVideoOff, FiMonitor } from 'react-icons/fi'
import { lectureThumb } from '../../utils/helpers'

export default function VideoPlayer({ videoId, url, title, isArabic, onWatch }) {
 const [inline, setInline] = useState(false)

 if (!videoId && !url) {
  return (
   <div className="relative aspect-video bg-black/30 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
    <div className="relative text-center px-4">
     <FiVideoOff size={36} className="mx-auto mb-2 text-white/50" />
     <p className="text-sm text-white/70">{isArabic ? 'لا يوجد فيديو لهذه المحاضرة' : 'No video for this lecture'}</p>
    </div>
   </div>
  )
 }

 const embedSrc = videoId
  ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1&modestbranding=1&color=white`
  : null

 // Inline embed mode (user explicitly chose "play inside the site")
 if (inline && embedSrc) {
  return (
   <div className="relative aspect-video bg-black group">
    <iframe
     src={embedSrc}
     title={title || (isArabic ? 'فيديو المحاضرة' : 'Lecture video')}
     className="absolute inset-0 w-full h-full"
     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
     allowFullScreen
     loading="lazy"
     referrerPolicy="strict-origin-when-cross-origin"
    />
    {url && (
     <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onWatch}
      className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition"
      title={isArabic ? 'فتح على YouTube' : 'Open on YouTube'}
     >
      <FiExternalLink size={12} />
      YouTube
     </a>
    )}
   </div>
  )
 }

 // Default: thumbnail + play (opens YouTube in new tab - always works)
 return (
  <div className="relative">
   <a
    href={url || '#'}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onWatch}
    className="relative block aspect-video bg-black group overflow-hidden rounded-t-2xl"
    aria-label={title || (isArabic ? 'تشغيل المحاضرة على YouTube' : 'Play lecture on YouTube')}
   >
    {videoId ? (
     <img src={lectureThumb(videoId, 'hq')} srcSet={`${lectureThumb(videoId, 'mq')} 320w, ${lectureThumb(videoId, 'hq')} 480w`} sizes="(max-width: 768px) 100vw, 66vw" alt="" width="480" height="360" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
    ) : (
     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
    )}

    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />

    <div className="absolute inset-0 flex items-center justify-center">
     <div className="w-20 h-20 bg-rose-500/90 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-500/30 group-hover:scale-110 group-hover:shadow-rose-500/50 transition-all duration-300">
      <FiPlay size={36} className="ms-1" />
     </div>
    </div>

    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
     <div className="flex items-center justify-between">
      <span className="text-white text-sm font-medium flex items-center gap-2">
       <FiPlay size={16} />
       {isArabic ? 'تشغيل على YouTube' : 'Play on YouTube'}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
       <FiExternalLink size={12} />
       YouTube
      </span>
     </div>
    </div>
   </a>

   {/* Inline playback option (only for embeddable videos) */}
   {embedSrc && (
    <button
     type="button"
     onClick={() => setInline(true)}
     className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition"
     title={isArabic ? 'تشغيل داخل الموقع' : 'Play inside the site'}
    >
     <FiMonitor size={12} />
     {isArabic ? 'تشغيل داخل الموقع' : 'Play inline'}
    </button>
   )}
  </div>
 )
}