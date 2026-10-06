(function () {
  try {
    var l = sessionStorage.getItem('al_azher_lang')
    if (!l) {
      // First-time visitor: follow the browser language (en if the first
      // preference is English, Arabic otherwise) to match the app default.
      var navLang = ''
      try {
        navLang = navigator.language || ''
      } catch (e) {}
      l = navLang.toLowerCase().indexOf('en') === 0 ? 'en' : 'ar'
    }
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    // Preload the English font only when English is selected — the Arabic
    // (default) load skips it entirely, saving ~48 KB on first paint.
    if (l === 'en' && document.head) {
      var link = document.createElement('link')
      link.rel = 'preload'
      link.href = '/fonts/inter-400-latin.woff2'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }
  } catch (e) {}

  try {
    var theme = sessionStorage.getItem('al_azher_theme')
    if (!theme) {
      // First-time visitor: follow the OS theme to avoid a light-mode flash.
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark'
      } else {
        theme = 'light'
      }
    }
    if (theme === 'dark' || theme === 'amoled') {
      document.documentElement.classList.add('dark')
    }
    if (theme === 'amoled') {
      document.documentElement.setAttribute('data-theme', 'amoled')
    }
  } catch (e) {}
})()
