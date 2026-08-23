import { useState, useEffect, memo } from 'react'

const cursorStyle = { animation: 'blink 0.7s step-end infinite' }

function TypewriterText({ text, delay = 0, cursorColor = 'bg-royal-400' }) {
 const [displayed, setDisplayed] = useState('')
 const [started, setStarted] = useState(false)

 useEffect(() => {
  const t = setTimeout(() => setStarted(true), delay)
  return () => clearTimeout(t)
 }, [delay])

 useEffect(() => {
  if (!started) return
  let i = 0
  const interval = setInterval(() => {
   i++
   setDisplayed(text.slice(0, i))
   if (i >= text.length) clearInterval(interval)
  }, 80)
  return () => clearInterval(interval)
 }, [started, text])

 return (
  <span>
   {displayed}
   {started && displayed.length < text.length && (
    <span className={`inline-block w-0.5 h-4 ${cursorColor} ml-0.5 align-middle`} style={cursorStyle} />
   )}
  </span>
 )
}

export default memo(TypewriterText)
