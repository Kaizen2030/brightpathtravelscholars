import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

function AnimatedCount({
  value,
  prefix = '',
  suffix = '',
  duration = 1600,
  className = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return undefined

    let frameId
    const startedAt = performance.now()

    const tick = (now) => {
      const elapsed = now - startedAt
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      const nextValue = Math.round(value * eased)

      setDisplayValue(nextValue)

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [duration, isInView, value])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export default AnimatedCount
