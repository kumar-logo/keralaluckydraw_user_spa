import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion'

interface AnimatedDigitRollerProps {
  currentIndex: number
  data: React.ReactNode[]
  lessCount?: number
  version?: number
  reverse?: boolean
}

export const AnimatedDigitRoller = ({
  currentIndex,
  data,
  lessCount = 18,
  version = 0,
  reverse = false,
}: AnimatedDigitRollerProps) => {
  const [prevIndex, setPrevIndex] = useState(0)
  const [itemHeight, setItemHeight] = useState(0)
  const dataLength = data.length
  const motionY = useMotionValue(0)
  const springY = useSpring(motionY, {
    mass: 1,
    stiffness: 280,
    damping: 60,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    springY.jump((prevIndex % dataLength) * itemHeight)
    requestAnimationFrame(() => {
      springY.set(
        reverse
          ? ((currentIndex % dataLength) - Math.ceil(lessCount / dataLength) * dataLength) * itemHeight
          : ((currentIndex % dataLength) + Math.ceil(lessCount / dataLength) * dataLength) * itemHeight
      )
    })
    setPrevIndex(currentIndex)
  }, [currentIndex, itemHeight, version])

  const extendedData = useMemo(() => [...data, data[0]], [data])

  useEffect(() => {
    setItemHeight(((containerRef.current?.clientHeight) || 0) / extendedData.length)
    motionY.set((currentIndex % dataLength) * itemHeight)
  }, [itemHeight])

  useEffect(() => {
    const onResize = () => {
      setItemHeight(((containerRef.current?.clientHeight) || 0) / extendedData.length)
      motionY.set((currentIndex % dataLength) * itemHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [currentIndex])

  const wrappedOffset = useTransform(() => springY.get() % (dataLength * itemHeight))
  const transformStyle = useMotionTemplate`translateY(-${wrappedOffset}px)`

  return (
    <div className="overflow-hidden" style={{ height: `${itemHeight}px` }}>
      <motion.div
        ref={containerRef}
        className="flex flex-col items-center"
        style={{ transform: transformStyle }}
      >
        {extendedData.map((item, idx) => (
          <div key={idx} className="animated-item">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
