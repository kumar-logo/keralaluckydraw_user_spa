import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

interface PickerItemProps {
  value: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  itemHeight: number
  onClick: () => void
}

const PickerItem = ({ children, className, style, itemHeight, onClick }: PickerItemProps) => (
  <div
    style={{
      height: `${itemHeight}px`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...style,
    }}
    className={className}
    onClick={onClick}
  >
    {children}
  </div>
)

interface PickerColumnProps {
  name: string
  items: string[]
  value: string
  onChange: (name: string, value: string) => void
  height: number
  itemHeight: number
  className?: string
}

const PickerColumn = ({
  name,
  items,
  value,
  onChange,
  height,
  itemHeight,
  className,
}: PickerColumnProps) => {
  const colRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startOffset, setStartOffset] = useState(0)

  const centerY = useMemo(() => height / 2 - itemHeight / 2, [height, itemHeight])
  const minY = useMemo(() => height / 2 - itemHeight / 2 - (items.length - 1) * itemHeight, [height, itemHeight, items.length])

  const selectedIndex = useMemo(() => {
    const idx = items.findIndex((it) => it === value)
    return idx < 0 ? 0 : idx
  }, [items, value])

  useEffect(() => {
    setOffset(centerY - selectedIndex * itemHeight)
  }, [centerY, selectedIndex, itemHeight])

  const snapToNearest = useCallback(() => {
    let idx = 0
    const newY = offset
    if (newY >= centerY) idx = 0
    else if (newY <= minY) idx = items.length - 1
    else idx = -Math.round((newY - centerY) / itemHeight)

    const newVal = items[idx]
    if (newVal !== undefined) {
      onChange(name, newVal)
    }
    setOffset(centerY - idx * itemHeight)
  }, [offset, centerY, minY, items, itemHeight, onChange, name])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setStartY(e.touches[0].pageY)
      setStartOffset(offset)
      setIsDragging(true)
    },
    [offset]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const newY = startOffset + e.touches[0].pageY - startY

      const clamped =
        newY < minY
          ? minY - Math.pow(minY - newY, 0.8)
          : newY > centerY
            ? centerY + Math.pow(newY - centerY, 0.8)
            : newY
      setOffset(clamped)
    },
    [isDragging, startOffset, startY, minY, centerY]
  )

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      snapToNearest()
    }
  }, [isDragging, snapToNearest])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      let delta = e.deltaY * 0.1
      if (Math.abs(delta) < itemHeight) delta = itemHeight * Math.sign(delta)
      const newY = offset - delta
      const clamped =
        newY < minY
          ? minY - Math.pow(minY - newY, 0.8)
          : newY > centerY
            ? centerY + Math.pow(newY - centerY, 0.8)
            : newY
      setOffset(clamped)

      if ((colRef.current as any).__wheelTimer) clearTimeout((colRef.current as any).__wheelTimer)
      ;(colRef.current as any).__wheelTimer = setTimeout(() => {
        snapToNearest()
      }, 200)
    },
    [offset, itemHeight, minY, centerY, snapToNearest]
  )

  useEffect(() => {
    const el = colRef.current
    if (!el) return
    el.addEventListener('touchmove', handleTouchMove as any, { passive: false })
    el.addEventListener('wheel', handleWheel as any, { passive: false })
    return () => {
      el.removeEventListener('touchmove', handleTouchMove as any)
      el.removeEventListener('wheel', handleWheel as any)
    }
  }, [handleTouchMove, handleWheel])

  return (
    <div
      ref={colRef}
      className={className}
      style={{
        flex: '1 1 0%',
        maxHeight: '100%',
        transitionProperty: 'transform',
        transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
        transitionDuration: isDragging ? '0ms' : '300ms',
        transform: `translate3d(0, ${offset}px, 0)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        if (isDragging) {
          setIsDragging(false)
          setOffset(startOffset)
        }
      }}
    >
      {items.map((item) => (
        <PickerItem
          key={item}
          value={item}
          itemHeight={itemHeight}
          className="font-bold text-base text-main"
          onClick={() => onChange(name, item)}
        >
          {item}
        </PickerItem>
      ))}
    </div>
  )
}

interface ScrollPickerProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  columns: Record<string, string[]>
  height?: number
  itemHeight?: number
  style?: React.CSSProperties
  children?: React.ReactNode
}

export const ScrollPicker = ({
  value,
  onChange,
  columns,
  height = 300,
  itemHeight = 56,
  style,
  children,
}: ScrollPickerProps) => {
  const handleChange = useCallback(
    (name: string, val: string) => {
      const next = { ...value, [name]: val }
      onChange(next)
    },
    [value, onChange]
  )

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      height: `${height}px`,
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
      maskImage:
        'linear-gradient(to top, transparent, transparent 5%, white 20%, white 80%, transparent 95%, transparent)',
      WebkitMaskImage:
        'linear-gradient(to top, transparent, transparent 5%, white 20%, white 80%, transparent 95%, transparent)',
      ...style,
    }),
    [height, style]
  )

  const highlightStyle: React.CSSProperties = useMemo(
    () => ({
      height: itemHeight,
      marginTop: -(itemHeight / 2),
      position: 'absolute',
      top: '50%',
      left: 0,
      width: '100%',
      pointerEvents: 'none',
    }),
    [itemHeight]
  )

  return (
    <div style={containerStyle}>
      {Object.keys(columns).map((colName) => (
        <PickerColumn
          key={colName}
          name={colName}
          items={columns[colName]}
          value={value[colName] || '-'}
          onChange={handleChange}
          height={height}
          itemHeight={itemHeight}
          className="z-20"
        />
      ))}
      {children}
      <div style={highlightStyle as any}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: '#d9d9d9',
            transform: 'scaleY(0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: '#d9d9d9',
            transform: 'scaleY(0.5)',
          }}
        />
      </div>
    </div>
  )
}
