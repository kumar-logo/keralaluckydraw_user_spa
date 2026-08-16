import { useCallback, useEffect, useRef, useState } from 'react'
import { RecState } from '../services/chatTypes'

const MAX_MS = 120000
const PEAK_COUNT = 40
const TICK_MS = 100

export interface VoiceResult {
  blob: Blob
  durationMs: number
  waveform: string
}

interface AudioCtor {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

const pickMimeType = (): string => {
  const rec = window.MediaRecorder
  if (rec === undefined || typeof rec.isTypeSupported !== 'function') return ''
  if (rec.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (rec.isTypeSupported('audio/webm')) return 'audio/webm'
  if (rec.isTypeSupported('audio/mp4')) return 'audio/mp4'
  return ''
}

export const isVoiceSupported = (): boolean => {
  if (typeof window === 'undefined') return false
  if (typeof window.MediaRecorder === 'undefined') return false
  const media = navigator.mediaDevices
  return media !== undefined && typeof media.getUserMedia === 'function'
}

const resolveAudioContext = (): typeof AudioContext | undefined => {
  const w = window as unknown as AudioCtor
  if (w.AudioContext !== undefined) return w.AudioContext
  if (w.webkitAudioContext !== undefined) return w.webkitAudioContext
  return undefined
}

const flatWaveform = (): string => new Array(PEAK_COUNT).fill(24).join(',')

const encodePeaks = (channel: Float32Array): string => {
  const size = Math.floor(channel.length / PEAK_COUNT)
  if (size <= 0) return flatWaveform()
  const raw: number[] = []
  let max = 0
  for (let i = 0; i < PEAK_COUNT; i += 1) {
    let sum = 0
    const start = i * size
    for (let j = 0; j < size; j += 1) {
      const v = channel[start + j]
      sum += v * v
    }
    const rms = Math.sqrt(sum / size)
    raw.push(rms)
    if (rms > max) max = rms
  }
  const scale = max > 0 ? max : 1
  return raw.map((r) => Math.max(4, Math.min(100, Math.round((r / scale) * 100)))).join(',')
}

const analyse = async (blob: Blob, fallbackMs: number): Promise<VoiceResult> => {
  const Ctor = resolveAudioContext()
  if (Ctor === undefined) {
    return { blob, durationMs: Math.max(1, fallbackMs), waveform: flatWaveform() }
  }
  const ctx = new Ctor()
  try {
    const buffer = await blob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(buffer.slice(0))
    const durationMs = decoded.duration > 0 ? Math.round(decoded.duration * 1000) : fallbackMs
    const waveform = encodePeaks(decoded.getChannelData(0))
    return { blob, durationMs: Math.max(1, Math.min(MAX_MS, durationMs)), waveform }
  } catch {
    return { blob, durationMs: Math.max(1, fallbackMs), waveform: flatWaveform() }
  } finally {
    void ctx.close().catch(() => undefined)
  }
}

interface RecorderApi {
  state: RecState
  elapsedMs: number
  supported: boolean
  start: () => Promise<void>
  stop: () => Promise<VoiceResult | null>
  cancel: () => void
}

export const useVoiceRecorder = (): RecorderApi => {
  const [state, setState] = useState<RecState>(RecState.Idle)
  const [elapsedMs, setElapsedMs] = useState(0)
  const supported = isVoiceSupported()

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeRef = useRef<string>('')
  const startedRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (autoStopRef.current !== null) {
      clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    const stream = streamRef.current
    if (stream !== null) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
    }
  }, [])

  const stop = useCallback((): Promise<VoiceResult | null> => {
    const recorder = recorderRef.current
    if (recorder === null || recorder.state === 'inactive') {
      clearTimers()
      stopStream()
      setState(RecState.Idle)
      return Promise.resolve(null)
    }
    clearTimers()
    const elapsed = Date.now() - startedRef.current
    setState(RecState.Encoding)
    return new Promise<VoiceResult | null>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeRef.current !== '' ? mimeRef.current : 'audio/webm',
        })
        recorderRef.current = null
        chunksRef.current = []
        stopStream()
        void analyse(blob, elapsed).then((result) => {
          setState(RecState.Idle)
          setElapsedMs(0)
          resolve(result)
        })
      }
      recorder.stop()
    })
  }, [clearTimers, stopStream])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    clearTimers()
    const recorder = recorderRef.current
    if (recorder !== null && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        recorderRef.current = null
        chunksRef.current = []
        stopStream()
      }
      recorder.stop()
    } else {
      recorderRef.current = null
      chunksRef.current = []
      stopStream()
    }
    setState(RecState.Idle)
    setElapsedMs(0)
  }, [clearTimers, stopStream])

  const start = useCallback(async (): Promise<void> => {
    if (!supported || recorderRef.current !== null) return
    cancelledRef.current = false
    setState(RecState.Requesting)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (cancelledRef.current) {
        for (const track of stream.getTracks()) track.stop()
        setState(RecState.Idle)
        return
      }
      streamRef.current = stream
      const mime = pickMimeType()
      mimeRef.current = mime === 'audio/mp4' ? 'audio/mp4' : mime.startsWith('audio/webm') ? 'audio/webm' : ''
      const recorder = mime !== '' ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorderRef.current = recorder
      recorder.start()
      startedRef.current = Date.now()
      setElapsedMs(0)
      setState(RecState.Recording)
      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedRef.current)
      }, TICK_MS)
      autoStopRef.current = setTimeout(() => {
        void stop()
      }, MAX_MS)
    } catch {
      stopStream()
      recorderRef.current = null
      setState(RecState.Error)
      setTimeout(() => setState(RecState.Idle), 1500)
    }
  }, [supported, stop, stopStream])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (tickRef.current !== null) clearInterval(tickRef.current)
      if (autoStopRef.current !== null) clearTimeout(autoStopRef.current)
      const recorder = recorderRef.current
      if (recorder !== null && recorder.state !== 'inactive') recorder.stop()
      const stream = streamRef.current
      if (stream !== null) for (const track of stream.getTracks()) track.stop()
    }
  }, [])

  return { state, elapsedMs, supported, start, stop, cancel }
}
