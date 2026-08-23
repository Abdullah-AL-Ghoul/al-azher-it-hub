import { useEffect } from 'react'

let lockCount = 0
let previousOverflow = ''

export function useScrollLock(isLocked) {
 useEffect(() => {
  if (!isLocked) return

  if (lockCount === 0) {
   previousOverflow = document.body.style.overflow
  }

  lockCount++
  document.body.style.overflow = 'hidden'

  return () => {
   lockCount--
   if (lockCount <= 0) {
    lockCount = 0
    document.body.style.overflow = previousOverflow
   }
  }
 }, [isLocked])
}
