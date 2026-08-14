import { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback } from 'react'
import { motion, useMotionValue, useAnimate } from 'framer-motion'
import clsx from 'clsx'
import { useFrameTimer } from '../../hooks/useFrameTimer'

interface ScrollColumnRef {
  start: () => void
  stop: (targetIdx: number) => void
}

const ScrollColumn = forwardRef<ScrollColumnRef, { className?: string; children: React.ReactNode[] }>(
  ({ className, children }, ref) => {
    const runningRef = useRef(false)
    const scrollY = useMotionValue(0)
    const [scope, animate] = useAnimate()
    const [tick, setTick] = useState(0)

    const getItemHeight = () =>
      (scope.current?.children[0] as HTMLElement | undefined)?.getBoundingClientRect().height ?? 0
    const getTotalHeight = () => getItemHeight() * children.length

    const speedRef = useRef(0)
    const incrementRef = useRef(0)
    const currentSpeedRef = useRef(0)
    const maxSpeedRef = useRef(0)

    const onFrame = useCallback((elapsed: number) => {
      const ticks = Math.floor(elapsed / 1000 * 30)
      if (ticks > 300) timer.pause()
      else setTick(ticks)
    }, [])

    const timer = useFrameTimer(onFrame)

    const start = () => {
      if (runningRef.current) return
      runningRef.current = true
      const itemH = getItemHeight()
      if (!itemH) return
      speedRef.current = 0
      maxSpeedRef.current = getTotalHeight() / 30
      incrementRef.current = maxSpeedRef.current / Math.round(Math.random() * 30 + 15)
      timer.play()
    }

    const stop = (targetIdx: number) => {
      if (!runningRef.current) return
      timer.pause()
      timer.reset()
      currentSpeedRef.current = 0
      const itemH = getItemHeight()
      animate(scope.current, {
        y: (targetIdx + children.length) * itemH + scrollY.get(),
      }, {
        duration: 2,
        ease: 'easeOut',
      }).then(() => {
        runningRef.current = false
        scrollY.set(-targetIdx * itemH)
        animate(scope.current, { y: 0 }, { duration: 0 })
      })
    }

    useEffect(() => {
      if (currentSpeedRef.current < maxSpeedRef.current) {
        currentSpeedRef.current += incrementRef.current
      } else {
        currentSpeedRef.current = maxSpeedRef.current
      }
      scrollY.set(scrollY.get() - currentSpeedRef.current)
      const total = getTotalHeight()
      if (scrollY.get() < -total) scrollY.set(scrollY.get() + total)
    }, [tick])

    useImperativeHandle(ref, () => ({ start, stop }))

    return (
      <div className={clsx('relative overflow-hidden', className)}>
        <motion.div
          ref={scope}
          className="absolute h-auto w-full left-0 bottom-0"
          style={{ bottom: scrollY }}
        >
          {children}
          {children}
        </motion.div>
      </div>
    )
  }
)
ScrollColumn.displayName = 'ScrollColumn'

export interface DigitScrollRef {
  start: () => void
  stop: (digits: number[]) => void
}

export const DigitScroll = forwardRef<DigitScrollRef, {
  group: React.ReactNode[][]
  className?: string
  itemClassName?: string
}>(({ group, className, itemClassName }, ref) => {
  const colRefs = useRef<(ScrollColumnRef | null)[]>(Array.from({ length: group.length }))

  const start = () => {
    colRefs.current.forEach(c => c?.start())
  }

  const stop = (digits: number[]) => {
    colRefs.current.forEach((c, i) => c?.stop(digits[i]))
  }

  useImperativeHandle(ref, () => ({ start, stop }))

  return (
    <div className={clsx('flex items-center', className)}>
      {group.map((col, i) => (
        <ScrollColumn
          key={i}
          ref={(el) => { colRefs.current[i] = el }}
          className={itemClassName}
        >
          {col}
        </ScrollColumn>
      ))}
    </div>
  )
})
DigitScroll.displayName = 'DigitScroll'
