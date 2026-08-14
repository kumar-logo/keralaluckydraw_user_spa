import { useMemo, useEffect } from 'react'

const audioBytesCache = new Map<string, Promise<ArrayBuffer>>()

const loadAudioBytes = (path: string): Promise<ArrayBuffer> => {
  let bytes = audioBytesCache.get(path)
  if (!bytes) {
    bytes = fetch(path)
      .then((res) => res.arrayBuffer())
      .catch((err) => {
        audioBytesCache.delete(path)
        throw err
      })
    audioBytesCache.set(path, bytes)
  }
  return bytes
}

class AudioPlayer {
  audioContext: AudioContext
  audioBuffer: AudioBuffer | null = null
  audioBufferPromise: Promise<AudioBuffer> | null = null
  sourceNode: AudioBufferSourceNode | null = null
  gainNode: GainNode
  loop: boolean
  autoMute: boolean
  audioPath: string

  handlePageVisibilityChange = () => {
    if (document.hidden) this.gainNode.gain.value = 0
    else this.gainNode.gain.value = 1
  }

  constructor(src: string | { audioPath: string; loop?: boolean; autoMute?: boolean }, loop = false, autoMute = true) {
    const config = typeof src === 'string'
      ? { audioPath: src, loop: loop ?? false, autoMute: autoMute ?? true }
      : src
    this.audioPath = config.audioPath
    this.loop = config.loop ?? false
    this.autoMute = config.autoMute ?? true
    this.audioContext = new window.AudioContext()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = 1
    this.gainNode.connect(this.audioContext.destination)
    if (this.autoMute) document.addEventListener('visibilitychange', this.handlePageVisibilityChange)
    this.audioBufferPromise = this.loadAudio()
  }

  loadAudio(): Promise<AudioBuffer> {
    if (this.audioBuffer) return Promise.resolve(this.audioBuffer)
    if (this.audioBufferPromise) return this.audioBufferPromise
    this.audioBufferPromise = loadAudioBytes(this.audioPath)
      .then((data) => this.audioContext.decodeAudioData(data.slice(0)))
      .then((buffer) => { this.audioBuffer = buffer; return buffer })
      .catch((err) => { console.error('audio loading error:', err); throw err })
    return this.audioBufferPromise
  }

  createSourceNode() {
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.loop = this.loop
    this.sourceNode.connect(this.audioContext.destination)
    this.sourceNode.onended = () => {
      this.sourceNode?.disconnect()
      this.sourceNode = null
    }
  }

  play() {
    Promise.resolve(this.audioBuffer ? this.audioBuffer : this.loadAudio()).then(() => {
      if (this.sourceNode) {
        this.sourceNode.stop()
        this.sourceNode.disconnect()
      }
      this.createSourceNode()
      if (this.sourceNode) this.sourceNode.start()
    })
  }

  pause() {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  dispose() {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode.disconnect()
    }
    this.gainNode.disconnect()
    document.removeEventListener('visibilitychange', this.handlePageVisibilityChange)
  }
}

export const useAudio = (src: string, loop = false, autoMute = true) => {
  const player = useMemo(() => typeof src === 'string' ? new AudioPlayer(src, loop, autoMute) : new AudioPlayer(src), [src, loop, autoMute])
  useEffect(() => () => player.dispose(), [player])
  return {
    play: player.play.bind(player),
    pause: player.pause.bind(player),
    stop: player.stop.bind(player),
  }
}
