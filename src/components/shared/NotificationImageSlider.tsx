import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { resolveAssetUrl } from '../../utils/helpers'

interface NotificationImageSliderProps {
  images: string[]
  compact?: boolean
  autoPlay?: boolean
  className?: string
}

export const NotificationImageSlider = ({ images, compact, autoPlay, className }: NotificationImageSliderProps) => {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const count = images ? images.length : 0
  const heightClass = compact ? 'h-28' : 'h-44'

  useEffect(() => {
    if (!autoPlay || count < 2) return
    const timer = setInterval(() => {
      const el = trackRef.current
      if (!el || el.clientWidth === 0) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, 2600)
    return () => clearInterval(timer)
  }, [autoPlay, count])

  if (count === 0) return null

  const handleScroll = () => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== active) setActive(idx)
  }

  const goTo = (index: number) => {
    const el = trackRef.current
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  const single = count === 1

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl bg-black/5 shadow-sm ring-1 ring-black/5 dark:ring-white/10',
        className,
      )}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className={clsx(
          'flex snap-x snap-mandatory overflow-x-auto scroll-smooth',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          heightClass,
        )}
      >
        {images.map((src, i) => (
          <img
            key={`${i}-${src}`}
            src={resolveAssetUrl(src)}
            alt=""
            loading="lazy"
            draggable={false}
            className={clsx('w-full shrink-0 snap-center object-cover', heightClass)}
          />
        ))}
      </div>

      {!single && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {active + 1}/{count}
          </div>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(i)
                }}
                className={clsx(
                  'h-1.5 rounded-full shadow transition-all duration-300 ease-out',
                  i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/55',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationImageSlider
