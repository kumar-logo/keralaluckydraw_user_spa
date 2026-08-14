import { useRef, useEffect, useContext } from 'react'
import { MotionConfigContext } from 'framer-motion'
import { frame, cancelFrame } from 'framer-motion'

type FrameStep = (info: { timestamp: number; delta: number }) => void

export const useFrameTimer = (callback: (elapsed: number, delta: number) => void, autoplay = false, subtractPaused = true) => {
  const startRef = useRef(0)
  const { isStatic } = useContext(MotionConfigContext)
  const pausedTimeRef = useRef(0)
  const lastPauseRef = useRef(0)
  const playingRef = useRef(autoplay)
  const frameRef = useRef<FrameStep | null>(null)

  const start = () => {
    if (frameRef.current) {
      cancelFrame(frameRef.current)
      frameRef.current = null
    }
    startRef.current = 0
    lastPauseRef.current = 0
    pausedTimeRef.current = 0

    const step = ({ timestamp, delta }: { timestamp: number; delta: number }) => {
      if (!startRef.current) startRef.current = timestamp
      if (playingRef.current) {
        if (lastPauseRef.current) {
          pausedTimeRef.current += timestamp - lastPauseRef.current
          lastPauseRef.current = 0
        }
      } else {
        if (!lastPauseRef.current) lastPauseRef.current = timestamp
        return
      }
      const elapsed = timestamp - startRef.current - (subtractPaused ? pausedTimeRef.current : 0)
      callback(elapsed, delta)
    }

    frameRef.current = step
    frame.update(step, true)
  }

  useEffect(() => {
    if (isStatic) return
    if (autoplay) start()
    return () => {
      if (frameRef.current) cancelFrame(frameRef.current)
    }
    // `start` is a stable closure recreated each render; re-running on every
    // `callback` change is the intended trigger. autoplay/isStatic are read
    // once on mount and intentionally excluded to preserve timer behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback])

  const play = () => {
    playingRef.current = true
    if (!frameRef.current) start()
  }
  const pause = () => { playingRef.current = false }

  return {
    play,
    pause,
    restart: () => { start(); play() },
    reset: () => { pause(); start() },
    isActive: playingRef,
  }
}
