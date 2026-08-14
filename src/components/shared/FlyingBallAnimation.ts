import { createRoot, Root } from 'react-dom/client'
import { createElement } from 'react'

type Position = 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

let root: Root | null = null
let container: HTMLDivElement | null = null
let stopped = false

const cleanup = () => {
  root?.unmount()
  container?.remove()
  stopped = false
}

const getOffset = (rect: DOMRect, position?: Position): [number, number] => {
  const { top, left, width, height } = rect
  const xl = left, xm = left + width / 2, xr = left + width
  const yt = top, ym = top + height / 2, yb = top + height

  switch (position) {
    case 'top': return [xm, yt]
    case 'bottom': return [xm, yb]
    case 'left': return [xl, ym]
    case 'right': return [xr, ym]
    case 'topLeft': return [xl, yt]
    case 'topRight': return [xr, yt]
    case 'bottomLeft': return [xl, yb]
    case 'bottomRight': return [xr, yb]
    default: return [xm, ym]
  }
}

const getOffsets = (startEl: Element, endEl: Element, startPos?: Position, endPos?: Position) => ({
  startOffset: getOffset(startEl.getBoundingClientRect(), startPos),
  endOffset: getOffset(endEl.getBoundingClientRect(), endPos),
})

const GRAVITY = 0.002

interface AnimateParams {
  startOffset: [number, number]
  endOffset: [number, number]
  afterStop?: () => void
  beforeMove?: () => boolean | void
}

const animate = ({ startOffset, endOffset, afterStop, beforeMove }: AnimateParams) => {
  if (!container || stopped || beforeMove?.() === false) return

  const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop

  const delta = {
    x: -1 * (startOffset[0] - endOffset[0]) + scrollLeft,
    y: -1 * (startOffset[1] - endOffset[1]) + scrollTop,
  }
  const slope = delta.x ? (delta.y - GRAVITY * delta.x * delta.x) / delta.x : 1

  container.style.transform = 'translate(0, 0)'
  let x = 0
  const dir = delta.x > 0 ? 1 : -1

  const step = () => {
    if (!container) return
    const p = 2 * GRAVITY * x + slope
    x = x + dir * Math.sqrt(166.7 / (p * p + 1))

    if ((dir === 1 && x > delta.x) || (dir === -1 && x < delta.x)) x = delta.x

    const tx = x
    const ty = GRAVITY * tx * tx + slope * tx

    container.style.transform = `translate(${tx}px, ${ty}px)`

    if (!tx || !ty) {
      console.warn('The starting position and the ending position are coaxial')
      return
    }

    if (x !== delta.x) {
      window.requestAnimationFrame(step)
    } else {
      stopped = true
      afterStop?.()
      cleanup()
    }
  }

  stopped = false
  requestAnimationFrame(step)
}

interface FlyingBallOptions {
  startOffset?: [number, number]
  endOffset?: [number, number]
  render?: React.ReactNode
  startWith?: Element
  endWith?: Element
  afterStop?: () => void
  beforeMove?: () => boolean | void
  startPosition?: Position
  endPosition?: Position
}

const start = (options: FlyingBallOptions) => {
  cleanup()

  const { startOffset, endOffset, render, startWith, endWith, afterStop, beforeMove, startPosition, endPosition } = options

  if (!startOffset && !startWith || !endWith && !endOffset) {
    console.error('not get offset/startWith or endWith/endOffset')
    return
  }

  const offsets = startOffset !== undefined && endOffset !== undefined
    ? { startOffset, endOffset }
    : getOffsets(startWith!, endWith!, startPosition, endPosition)

  container = document.createElement('div')
  container.classList.add('fixed')
  container.classList.add('z-70')
  container.style.left = offsets.startOffset[0] + 'px'
  container.style.top = offsets.startOffset[1] + 'px'
  document.body.appendChild(container)

  root = createRoot(container)
  root.render(
    render || createElement('div', { className: 'w-4 h-4 rounded-full bg-primary' })
  )

  animate({
    ...offsets,
    afterStop,
    beforeMove,
  })
}

export const FlyingBallAnimation = { start }
