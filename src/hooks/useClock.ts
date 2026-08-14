import { useEffect, useState } from 'react'

type ClockListener = (nowSec: number) => void

const listeners = new Set<ClockListener>()
let intervalId: ReturnType<typeof setInterval> | null = null
let visibilityBound = false
let currentNowSec = Math.floor(Date.now() / 1000)

function broadcast(): void {
  currentNowSec = Math.floor(Date.now() / 1000)
  for (const listener of listeners) listener(currentNowSec)
}

function startTicking(): void {
  if (intervalId !== null) return
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  broadcast()
  intervalId = setInterval(broadcast, 1000)
}

function stopTicking(): void {
  if (intervalId === null) return
  clearInterval(intervalId)
  intervalId = null
}

function handleVisibility(): void {
  if (document.visibilityState === 'visible') {
    startTicking()
  } else {
    stopTicking()
  }
}

function ensureRunning(): void {
  if (!visibilityBound && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility)
    visibilityBound = true
  }
  startTicking()
}

export function subscribeToClock(listener: ClockListener): () => void {
  listeners.add(listener)
  ensureRunning()
  listener(currentNowSec)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stopTicking()
  }
}

export function getNowSec(): number {
  return currentNowSec
}

export function useNowSec(): number {
  const [nowSec, setNowSec] = useState(currentNowSec)
  useEffect(() => subscribeToClock(setNowSec), [])
  return nowSec
}
