import { createElement } from 'react'
import { createRoot, Root } from 'react-dom/client'

let toastRoot: Root | null = null
let toastContainer: HTMLDivElement | null = null
let autoHideTimer: ReturnType<typeof setTimeout> | undefined
let removeMaskListener: (() => void) | null = null

const SuccessIcon = () => createElement('svg', {
  className: 'size-6', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg',
}, createElement('path', {
  d: 'M5 13l4 4L19 7', stroke: 'white', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round',
}))

const WarningIcon = () => createElement('svg', {
  className: 'size-6', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg',
}, createElement('path', {
  d: 'M12 9v4m0 4h.01M12 3l9.5 16.5H2.5L12 3z', stroke: 'white', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round',
}))

const hideToast = () => {
  removeMaskListener?.()
  removeMaskListener = null
  if (toastRoot) {
    const root = toastRoot
    toastRoot = null
    setTimeout(() => root.unmount(), 0)
  }
  toastContainer?.remove()
}

interface ToastProps {
  icon?: string | React.ReactNode
  message: string | React.ReactNode
  maskCloseable?: boolean
  autoHide?: boolean
  delay?: number
  afterClose?: () => void
  afterOpen?: () => void
}

function ToastContent(props: ToastProps) {
  const { icon, message, maskCloseable = true, autoHide: shouldAutoHide = true, delay = 3e3, afterClose, afterOpen } = props
  const ref = { current: null as HTMLDivElement | null }

  const handleMaskClick = (event: MouseEvent) => {
    if (!maskCloseable || !ref.current) return
    const { left, width, top, height } = ref.current.getBoundingClientRect()
    if (!(left < event.clientX && left + width > event.clientX && top < event.clientY && top + height > event.clientY)) dismiss()
  }

  const show = () => {
    ref.current?.classList.add('toast-container-visible')
    setTimeout(() => { afterOpen?.() }, 200)
  }

  const dismiss = () => {
    ref.current?.classList.remove('toast-container-visible')
    window.removeEventListener('click', handleMaskClick)
    setTimeout(() => { afterClose?.() }, 200)
  }

  setTimeout(() => {
    if (autoHideTimer) clearTimeout(autoHideTimer)
    if (shouldAutoHide) autoHideTimer = setTimeout(() => { dismiss() }, delay)
    window.addEventListener('click', handleMaskClick)
    removeMaskListener = () => window.removeEventListener('click', handleMaskClick)
    show()
  }, 0)

  const iconEl = typeof icon === 'string'
    ? createElement('div', {
        className: 'rounded-full flex items-center justify-center size-9 mb-2 ' + (icon === 'success' ? 'bg-[#009919]' : '') + (icon === 'warning' ? 'bg-danger' : ''),
      }, icon === 'success' ? createElement(SuccessIcon) : createElement(WarningIcon))
    : icon

  return createElement('div', {
    className: 'toast-wapper pointer-events-none flex fixed top-0 left-0 items-center justify-center w-full h-full',
  }, createElement('div', {
    ref: (el: HTMLDivElement) => { ref.current = el },
    className: 'nl-toast-container p-6 rounded-xl text-white text-center flex flex-col items-center text-wrap',
  }, iconEl, message))
}

const showToast = (props: ToastProps) => {
  hideToast()
  toastContainer = document.createElement('div')
  document.body.appendChild(toastContainer)
  const element = createElement(ToastContent, { ...props, afterClose: () => { hideToast() }, afterOpen: () => {} })
  toastRoot = createRoot(toastContainer)
  toastRoot.render(element)
}

export const toast = {
  show: showToast,
  warning: (message: string) => { showToast({ message, icon: 'warning' }) },
  success: (message: string) => { showToast({ message, icon: 'success' }) },
  close: () => {},
}
