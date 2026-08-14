import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import clsx from 'clsx'
import { useUIStore } from '../../stores/uiStore'
import { useWsStore } from '../../stores/wsStore'
import { useAppConfigStore } from '../../stores/configStore'

const sanitizeMarquee = (raw: string) =>
  (raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/&lt;(\/?)(b)&gt;/gi, '<$1$2>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')

interface MarqueeItemProps {
  content: string
  onNext?: () => void
  noAnimate?: boolean
}

const MarqueeItem = ({ content, onNext, noAnimate }: MarqueeItemProps) => {
  const rem = useUIStore((s) => s.rem)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const timerRef = useRef<any>(null)

  const startScroll = useCallback(() => {
    const text = textRef.current
    const container = containerRef.current
    if (!container || !text) {
      requestAnimationFrame(startScroll)
      return
    }
    if (text.scrollWidth > container.clientWidth) {
      let start: number | null = null
      timerRef.current = setTimeout(() => {
        start = performance.now()
        const step = (time: number) => {
          if (start == null) start = time
          const distance = ((time - start) / 1000) * 3 * rem
          if (distance < text.scrollWidth - container.clientWidth) {
            text.style.transform = `translateX(${-distance}px)`
            requestAnimationFrame(step)
          } else {
            text.style.transform = `translateX(${-(text.scrollWidth - container.clientWidth)}px)`
            if (onNext) timerRef.current = setTimeout(onNext, 3000)
          }
        }
        requestAnimationFrame(step)
      }, 2000)
    } else if (onNext) {
      timerRef.current = setTimeout(onNext, 2000)
    }
  }, [content, onNext, rem])

  useEffect(() => {
    if (textRef.current) textRef.current.style.transform = 'translateX(0px)'
    if (noAnimate) return
    const timer = setTimeout(startScroll, 2000)
    return () => clearTimeout(timer)
  }, [content])

  return (
    <div ref={containerRef} className="w-full h-6 shrink-0 flex items-center overflow-hidden">
      <p
        ref={textRef}
        className="text-nowrap [&_[data-link]]:underline"
        onClick={(event) => {
          let target = event.target as HTMLElement
          while (target && target !== event.currentTarget) {
            const link = target.getAttribute('data-link')
            if (link) {
              window.open(link, '_blank')
              break
            }
            target = target.parentElement as HTMLElement
          }
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeMarquee(content) }}
      />
    </div>
  )
}

const MegaphoneIcon = () => (
  <svg className="size-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_i_18272_5918)">
      <path d="M9.77441 2.10254C10.5343 1.7226 11.4287 2.27542 11.4287 3.125V13.1406C11.4287 13.9902 10.5343 14.543 9.77441 14.1631L5.71387 12.1328V4.13281L9.77441 2.10254ZM5.14258 12.1328H2.28613C1.02377 12.1328 0 11.109 0 9.84668V6.41797C0.000247285 5.15581 1.02392 4.13281 2.28613 4.13281H5.14258V12.1328Z" fill="url(#paint0_linear_18272_5918)" />
    </g>
    <path d="M15.7148 8.12592C15.7162 8.69101 15.55 9.24407 15.2372 9.71465C14.9243 10.1852 14.4786 10.5524 13.957 10.7699C13.6658 10.8912 13.3313 10.7535 13.2098 10.4624C13.0884 10.1711 13.226 9.83611 13.5173 9.71465C13.8302 9.5842 14.0974 9.36411 14.2851 9.08184C14.4728 8.79951 14.5728 8.46774 14.572 8.12871C14.5712 7.78966 14.4697 7.45818 14.2807 7.1767C14.0917 6.89533 13.8235 6.67623 13.51 6.54724C13.2182 6.42714 13.0791 6.09299 13.1992 5.80115C13.3194 5.50956 13.653 5.37041 13.9447 5.49032C14.4673 5.70535 14.9143 6.07086 15.2293 6.53999C15.5444 7.00909 15.7135 7.56087 15.7148 8.12592Z" fill="url(#paint1_linear_18272_5918)" />
    <defs>
      <filter id="filter0_i_18272_5918" x="0" y="1.48047" width="11.4297" height="12.8047" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="-1" />
        <feGaussianBlur stdDeviation="0.25" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.8 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_18272_5918" />
      </filter>
      <linearGradient id="paint0_linear_18272_5918" x1="-4.06801e-09" y1="8.1148" x2="11.4287" y2="8.1148" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--brand)" />
        <stop offset="1" stopColor="var(--brand-soft)" />
      </linearGradient>
      <linearGradient id="paint1_linear_18272_5918" x1="14.4392" y1="5.44727" x2="14.4392" y2="10.814" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--brand)" />
        <stop offset="1" stopColor="var(--brand-soft)" />
      </linearGradient>
    </defs>
  </svg>
)

interface BannerProps {
  className?: string
  containerClassName?: string
  rightNode?: React.ReactNode
}

export const Banner = ({ className, containerClassName, rightNode }: BannerProps) => {
  const appName = useAppConfigStore((s) => s.appName) || 'Kerala Lucky Draw'
  const systemMessages = useWsStore((s) => s.messageMap.system)
  const lastIndex = useWsStore((s) => s.lastSystemMessageIndex)
  const setLastIndex = useWsStore((s) => s.setLastSystemMessageIndex)
  const bigwinMessages = useWsStore((s) => s.messageMap.bigwin)
  const shiftMessage = useWsStore((s) => s.shiftMessageByType)

  const texts = useMemo(() => {
    if (systemMessages && systemMessages.length > 0) {
      if (lastIndex > systemMessages.length - 1) setLastIndex(0)
      return systemMessages.map((w: any) => (w.content || '').replace(/\{\{appName\}\}/g, appName)) ?? []
    }
    setLastIndex(0)
    return []
  }, [systemMessages])

  const [currentText, setCurrentText] = useState('')
  const [key, setKey] = useState(0)
  const [nextText, setNextText] = useState('')
  const controls = useAnimationControls()
  const initRef = useRef(false)
  const visibleRef = useRef(true)
  const activeRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getBigwin = () => {
    const msg = shiftMessage('bigwin')
    return msg ? msg.content : null
  }

  useEffect(() => {
    if (!initRef.current && (texts.length > 0 || (bigwinMessages && bigwinMessages.length > 0))) {
      const first = getBigwin() || texts[lastIndex]
      if (first) {
        initRef.current = true
        setCurrentText(first)
        setKey(Date.now())
      }
    }
  }, [texts, bigwinMessages])

  useEffect(() => {
    const handler = () => { visibleRef.current = document.visibilityState === 'visible' }
    window.addEventListener('visibilitychange', handler)
    return () => { visibleRef.current = false; window.removeEventListener('visibilitychange', handler) }
  }, [])

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!visibleRef.current || !activeRef.current) {
      timerRef.current = setTimeout(handleNext, 200)
      return
    }
    const len = texts.length
    const nextIdx = len ? (lastIndex + 1) % len : 0
    const next = (getBigwin() || texts[nextIdx]) ?? ''
    setLastIndex(nextIdx)
    setNextText(next)
    controls
      .start({ y: '-1.5rem', transition: { duration: 0.5, ease: 'linear' } })
      .then(() => {
        setCurrentText(next)
        setKey(Date.now())
        controls.set({ y: 0 })
      })
  }

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('brand-marquee h-7.5 px-2 flex items-center', containerClassName)}>
        <MegaphoneIcon />
        <div className="flex-1 h-6 text-xs font-bold px-2 overflow-hidden">
          <motion.div animate={controls} initial={{ y: 0 }}>
            <MarqueeItem key={key} content={currentText} onNext={handleNext} />
            <MarqueeItem noAnimate content={nextText} />
          </motion.div>
        </div>
        {rightNode}
      </div>
    </div>
  )
}
