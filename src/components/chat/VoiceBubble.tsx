import { useEffect, useRef, useState } from 'react'
import { chatMediaUrl } from '../../services/chatApi'

let activeAudio: HTMLAudioElement | null = null

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
)
const PauseGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
)

const parseWaveform = (raw: string | null): number[] => {
  if (raw === null || raw === '') return new Array(40).fill(24)
  const parts = raw
    .split(',')
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n))
  if (parts.length === 0) return new Array(40).fill(24)
  return parts
}

const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const VoiceBubble = ({
  audioUrl,
  durationMs,
  waveform,
  mine,
}: {
  audioUrl: string
  durationMs: number | null
  waveform: string | null
  mine: boolean
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [position, setPosition] = useState(0)

  const bars = parseWaveform(waveform)
  const totalMs = durationMs !== null && durationMs > 0 ? durationMs : 0
  const src = chatMediaUrl(audioUrl)

  useEffect(() => {
    return () => {
      const el = audioRef.current
      if (el !== null && activeAudio === el) activeAudio = null
    }
  }, [])

  const toggle = () => {
    const el = audioRef.current
    if (el === null) return
    if (playing) {
      el.pause()
      return
    }
    if (activeAudio !== null && activeAudio !== el) activeAudio.pause()
    activeAudio = el
    void el.play().catch(() => setPlaying(false))
  }

  const onTime = () => {
    const el = audioRef.current
    if (el === null) return
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : totalMs / 1000
    setPosition(el.currentTime * 1000)
    setProgress(dur > 0 ? Math.min(1, el.currentTime / dur) : 0)
  }

  const onEnded = () => {
    const el = audioRef.current
    setPlaying(false)
    setProgress(0)
    setPosition(0)
    if (el !== null && activeAudio === el) activeAudio = null
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (el === null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = rect.width > 0 ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : totalMs / 1000
    if (dur > 0) {
      el.currentTime = frac * dur
      setProgress(frac)
      setPosition(frac * dur * 1000)
    }
  }

  const played = Math.round(progress * bars.length)
  const clock = playing || position > 0 ? formatClock(position) : formatClock(totalMs)

  return (
    <div className={mine ? 'kc-voice kc-voice-me' : 'kc-voice'}>
      <button type="button" className="kc-voice-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <PauseGlyph /> : <PlayGlyph />}
      </button>
      <div className="kc-voice-body">
        <div className="kc-voice-wave" onClick={seek}>
          {bars.map((h, i) => (
            <span
              key={i}
              className={i < played ? 'kc-voice-bar kc-voice-bar-on' : 'kc-voice-bar'}
              style={{ height: `${Math.max(12, Math.min(100, h))}%` }}
            />
          ))}
        </div>
        <span className="kc-voice-time">{clock}</span>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTime}
        onEnded={onEnded}
        hidden
      />
    </div>
  )
}
