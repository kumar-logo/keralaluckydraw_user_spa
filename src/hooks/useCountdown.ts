import { useState, useEffect, useRef, useMemo } from 'react'
import { subscribeToClock } from './useClock'

const padZero = (value: string | number | null | undefined, width = 2): string => !value || Number(value) < 0 ? ''.padStart(width, '0') : (typeof value === 'number' ? (value + '') : value).padStart(width, '0')

function parseTimeComponents(milliseconds: number, fillZero: boolean) {
  const seconds = Math.floor(milliseconds / 1e3 % 60)
  const minutes = Math.floor(milliseconds / (1e3 * 60) % 60)
  const hours = Math.floor(milliseconds / (1e3 * 60 * 60) % 24)
  const days = Math.floor(milliseconds / (1e3 * 60 * 60 * 24))
  return fillZero ? {
    seconds: padZero(seconds),
    minutes: padZero(minutes),
    hours: padZero(hours),
    days: padZero(days),
  } : {
    seconds,
    minutes,
    hours,
    days,
  }
}

export function useCountdown({
  countDown = false,
  initRemainTime,
  onTimingChange,
  needFillZero = true,
  offset = 0,
}: {
  countDown?: boolean
  initRemainTime?: number
  onTimingChange?: (t: number) => void
  needFillZero?: boolean
  offset?: number
} = {}) {
  const startRef = useRef(performance.now())
  const initial = initRemainTime || 0
  const internalRef = useRef(initial)
  const [remainTime, setRemainTime] = useState(initial)
  const onTimingChangeRef = useRef(onTimingChange)
  onTimingChangeRef.current = onTimingChange
  const remainValue = useMemo(() => parseTimeComponents((remainTime + offset) * 1e3, needFillZero), [remainTime, offset, needFillZero])

  useEffect(() => {
    if (!countDown) return
    return subscribeToClock(() => {
      if (internalRef.current >= 0) {
        internalRef.current = initial - Math.floor((performance.now() - startRef.current) / 1000)
        const next = Math.max(internalRef.current, 0)
        setRemainTime(next)
        onTimingChangeRef.current?.(next)
      }
    })
  }, [countDown, initial])

  useEffect(() => {
    startRef.current = performance.now()
    internalRef.current = initial
    setRemainTime(initial)
  }, [initial])

  return { remainTime, remainValue }
}
