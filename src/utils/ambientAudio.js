/**
 * Ambient Audio & Chime Engine using Web Audio API
 * Generates synthetic relaxing soundscapes (Rain, White Noise, Deep Waves, Chimes)
 * with zero external bandwidth/assets.
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null
    this.activeType = null
    this.noiseNode = null
    this.filterNode = null
    this.gainNode = null
    this.volume = 0.5
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val))
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop()
        this.noiseNode.disconnect()
      } catch (_e) {
        /* ignore */
      }
      this.noiseNode = null
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop()
        this.oscillator.disconnect()
      } catch (_e) {
        /* ignore */
      }
      this.oscillator = null
    }
    this.activeType = null
  }

  /**
   * Play ambient noise generator: 'rain', 'whitenoise', 'waves'
   */
  play(type) {
    this.init()
    if (!this.ctx) return
    this.stop()

    this.activeType = type
    const bufferSize = 2 * this.ctx.sampleRate
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = buffer.getChannelData(0)

    if (type === 'rain') {
      // Pink noise filtered to emulate gentle falling rain
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08
        b6 = white * 0.115926
      }

      this.noiseNode = this.ctx.createBufferSource()
      this.noiseNode.buffer = buffer
      this.noiseNode.loop = true

      this.filterNode = this.ctx.createBiquadFilter()
      this.filterNode.type = 'lowpass'
      this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime)

      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime)

      this.noiseNode.connect(this.filterNode)
      this.filterNode.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)
      this.noiseNode.start()
    } else if (type === 'whitenoise') {
      // Calming library white noise with gentle attenuation
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.06
      }

      this.noiseNode = this.ctx.createBufferSource()
      this.noiseNode.buffer = buffer
      this.noiseNode.loop = true

      this.filterNode = this.ctx.createBiquadFilter()
      this.filterNode.type = 'lowpass'
      this.filterNode.frequency.setValueAtTime(1400, this.ctx.currentTime)

      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime)

      this.noiseNode.connect(this.filterNode)
      this.filterNode.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)
      this.noiseNode.start()
    } else if (type === 'waves') {
      // Gentle ocean waves with LFO modulation
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.08
      }

      this.noiseNode = this.ctx.createBufferSource()
      this.noiseNode.buffer = buffer
      this.noiseNode.loop = true

      this.filterNode = this.ctx.createBiquadFilter()
      this.filterNode.type = 'bandpass'
      this.filterNode.frequency.setValueAtTime(400, this.ctx.currentTime)
      this.filterNode.Q.setValueAtTime(1.5, this.ctx.currentTime)

      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime)

      this.noiseNode.connect(this.filterNode)
      this.filterNode.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)
      this.noiseNode.start()
    }
  }

  /**
   * Play completion bell / chime (3 gentle ascending tones)
   */
  playChime() {
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5 major triad

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.15)

      gain.gain.setValueAtTime(0, now + idx * 0.15)
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.15 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now + idx * 0.15)
      osc.stop(now + idx * 0.15 + 1.3)
    })
  }
}

export const ambientAudio = new AmbientAudioEngine()
