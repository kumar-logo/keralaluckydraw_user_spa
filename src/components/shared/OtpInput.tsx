import { useRef, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import './otp-input.css'

const COUNTDOWN_FROM = 59

interface OtpInputProps {
  value: string
  onChange: (v: string) => void
  length?: number
  canSend: boolean
  send: () => Promise<boolean>
}

export const OtpInput = ({ value, onChange, length = 6, canSend, send }: OtpInputProps) => {
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [countdown > 0])

  const chars = Array.from({ length }, (_, i) => value[i] ?? '')
  const focusAt = (i: number) => inputs.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  const setAt = useCallback((i: number, ch: string) => {
    const next = Array.from({ length }, (_, k) => value[k] ?? '')
    next[i] = ch
    onChange(next.join('').replace(/\s+$/, ''))
  }, [value, length, onChange])

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) { setAt(i, ''); return }
    if (digits.length > 1) {
      const next = Array.from({ length }, (_, k) => value[k] ?? '')
      for (let k = 0; k < digits.length && i + k < length; k++) next[i + k] = digits[k]
      onChange(next.join(''))
      focusAt(i + digits.length)
      return
    }
    setAt(i, digits)
    if (i < length - 1) focusAt(i + 1)
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[i]) { setAt(i, ''); return }
      if (i > 0) { e.preventDefault(); setAt(i - 1, ''); focusAt(i - 1) }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault(); focusAt(i - 1)
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault(); focusAt(i + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!digits) return
    e.preventDefault()
    onChange(digits)
    focusAt(digits.length)
  }

  const handleSend = () => {
    setSending(true)
    send()
      .then((ok) => { if (ok) setCountdown(COUNTDOWN_FROM) })
      .catch(() => {})
      .finally(() => setSending(false))
  }

  const counting = countdown > 0

  return (
    <div className="otp">
      <div className="otp-boxes" onPaste={handlePaste}>
        {chars.map((c, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el }}
            className={'otp-box' + (c ? ' is-filled' : '')}
            value={c}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            aria-label={`${t('signin.ph.OTP')} ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>

      {counting ? (
        <div className="otp-count">{countdown}s</div>
      ) : (
        <Button
          isLoading={sending}
          isDisabled={!canSend}
          className="otp-send"
          onPress={handleSend}
        >
          {t('signin.label.sendOtp')}
        </Button>
      )}
    </div>
  )
}
