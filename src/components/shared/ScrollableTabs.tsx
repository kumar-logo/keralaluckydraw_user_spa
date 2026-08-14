import { useState, useEffect, useRef } from 'react'
import { ScrollShadow } from '@nextui-org/react'
import clsx from 'clsx'
import { useUIStore } from '../../stores/uiStore'

interface TabOption {
  key: string
  render: React.ReactNode
}

interface ScrollableTabsProps {
  activeKey: string
  onTabChange?: (key: string) => void
  tabOptions: TabOption[]
  outerScrollRef?: React.RefObject<HTMLElement | null>
  tabItemClassName?: string
  className?: string
  tabItemWrapClassName?: string
  tabItemActiveClassName?: string
  indicatorClassName?: string
  indicatorWidthFull?: boolean
  indicatorDesignWidth?: number
  sectionAnchorMapRef?: React.RefObject<Record<string, HTMLElement> | null>
  hideIndicator?: boolean
  shadowWidth?: number
}

export const ScrollableTabs = ({
  activeKey,
  onTabChange,
  tabOptions,
  outerScrollRef,
  tabItemClassName = '',
  className = '',
  tabItemWrapClassName = '',
  tabItemActiveClassName = '',
  indicatorClassName = '',
  indicatorWidthFull = false,
  indicatorDesignWidth = 48,
  sectionAnchorMapRef,
  hideIndicator,
  shadowWidth,
}: ScrollableTabsProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [indicatorX, setIndicatorX] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const throttledScrollTop = scrollTop
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const scale = useUIStore((s) => s.scale)
  const [indicatorW, setIndicatorW] = useState(indicatorDesignWidth / 16)

  const scrollToSection = (top: number) => {
    const el = outerScrollRef?.current
    if (el) {
      el.scrollTo({ top, behavior: 'smooth' })
      setIsScrolling(true)
    }
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      if (ref.current && tabOptions.length > 0) {
        const idx = tabOptions.findIndex((o) => o.key === activeKey)
        if (idx !== -1) {
          const tabEl = ref.current.children[idx] as HTMLElement
          const { width, left } = tabEl.getBoundingClientRect()
          const firstRect = (ref.current.children[0] as HTMLElement).getBoundingClientRect()
          const { width: containerW } = ref.current.getBoundingClientRect()

          setIndicatorW(indicatorWidthFull ? width / 16 : indicatorDesignWidth / 16)
          setIndicatorX(
            ((left - firstRect.left) / scale + (indicatorWidthFull ? 0 : width / scale / 2 - indicatorDesignWidth / 2)) / 16
          )

          const scrollTo = left - firstRect.left + width / 2 - containerW / 2
          ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
        }
      }
    })
  }, [activeKey, indicatorDesignWidth, scale, indicatorWidthFull, tabOptions])

  useEffect(() => {
    const el = outerScrollRef?.current
    const handler = () => setScrollTop(el?.scrollTop || 0)
    el?.addEventListener('scroll', handler)
    return () => el?.removeEventListener('scroll', handler)
  }, [outerScrollRef])

  useEffect(() => {
    if ((activeKey == null || !tabOptions.some((o) => o.key === activeKey)) && tabOptions.length > 0) {
      onTabChange?.(tabOptions[0].key)
    }
  }, [tabOptions.length, activeKey])

  useEffect(() => {
    if (scrollTimer.current != null) {
      clearTimeout(scrollTimer.current)
      scrollTimer.current = undefined
    }
    scrollTimer.current = setTimeout(() => setIsScrolling(false), 200)

    if (isScrolling) return

    const anchors: { bottom: number; key: string }[] = []
    const map = sectionAnchorMapRef?.current
    if (!map) return

    const outer = outerScrollRef?.current
    const scrollContainer = outer
    const containerTop = scrollContainer?.getBoundingClientRect().top
    const tabBarHeight = ref.current?.parentElement?.getBoundingClientRect().height

    if (containerTop == null || tabBarHeight == null) return

    Object.keys(map).forEach((key) => {
      anchors.push({
        bottom: map[key].getBoundingClientRect().bottom - containerTop - tabBarHeight,
        key,
      })
    })
    anchors.sort((a, b) => a.bottom - b.bottom)

    for (let i = 0; i < anchors.length; i++) {
      if (throttledScrollTop <= anchors[i].bottom) {
        if (anchors[i].key !== activeKey) onTabChange?.(anchors[i].key)
        return
      }
    }
  }, [throttledScrollTop])

  return (
    <div className={clsx('px-2 flex-none overflow-hidden', className)}>
      <ScrollShadow
        size={shadowWidth}
        orientation="horizontal"
        ref={ref}
        offset={10}
        className={clsx('flex overflow-auto relative min-w-full *:not-last:mr-5 pb-1', tabItemWrapClassName)}
      >
        {tabOptions.map((opt) => (
          <div
            key={opt.key}
            onClick={() => {
              if (tabOptions.length > 0 && sectionAnchorMapRef?.current) {
                const anchorEl = sectionAnchorMapRef.current[opt.key]
                const top = anchorEl?.getBoundingClientRect().top
                const outer = outerScrollRef?.current
                const outerTop = outer?.getBoundingClientRect().top
                const tabBarH = ref.current?.parentElement?.getBoundingClientRect().height
                if (top != null && outer && outerTop != null && tabBarH != null) {
                  scrollToSection(top - outerTop - tabBarH + 1)
                }
              }
              onTabChange?.(opt.key)
            }}
            className={`duration-200 ${tabItemClassName} ${opt.key === activeKey ? tabItemActiveClassName : ''}`}
          >
            {opt.render}
          </div>
        ))}
        {tabOptions.length > 0 && !hideIndicator && (
          <div
            className={`absolute h-1 bottom-0 transition-transform ${indicatorClassName}`}
            style={{
              transform: `translateX(${indicatorX}rem)`,
              width: `${indicatorW}rem`,
            }}
          />
        )}
      </ScrollShadow>
    </div>
  )
}
