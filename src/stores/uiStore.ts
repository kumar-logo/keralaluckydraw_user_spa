import { create } from 'zustand'
import i18n from 'i18next'

const setCssVar = (prop: string, value: string) => {
  const el = document.documentElement
  if (el) el.style.setProperty(prop, value)
}

interface NativeViewport {
  statusBarHeight?: number
  navBarHeight?: number
  viewHeight?: number
}

interface TelegramWebApp {
  safeAreaInset?: { top?: number; bottom?: number }
  viewportHeight?: number
}

interface NativeBridgeWindow {
  nexuses?: NativeViewport
  Telegram?: { WebApp?: TelegramWebApp }
}

interface UIStore {
  isDarkMode: boolean
  screenWidth: number
  screenHeight: number
  scale: number
  rem: number
  statusBarHeight: number
  navBarHeight: number
  rtl: boolean
  standalone: boolean
  setRtl: (rtl: boolean) => void
  setStandalone: (standalone: boolean) => void
  updateWindowSize: () => void
}

export const useUIStore = create<UIStore>((set) => {
  const scale = Math.min(window.innerWidth, 540) / 375

  const storedTheme = localStorage.getItem('theme')
  if (storedTheme === 'dark' && !document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.add('dark')
  }
  const isDarkMode = document.documentElement.classList.contains('dark') || storedTheme === 'dark'

  const observer = new MutationObserver(() => {
    set({ isDarkMode: document.documentElement.classList.contains('dark') })
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  return {
    isDarkMode,
    screenWidth: 540,
    screenHeight: 960,
    scale,
    rem: scale * 16,
    statusBarHeight: 0,
    navBarHeight: 0,
    rtl: i18n.language === 'fa',
    standalone: false,
    setRtl: (rtl) => set({ rtl }),
    setStandalone: (standalone) => set({ standalone }),
    updateWindowSize: () => {
      if (!window) return
      const bridgeWindow = window as unknown as NativeBridgeWindow
      const nexuses = bridgeWindow.nexuses
      const telegram = bridgeWindow.Telegram?.WebApp

      const statusBar = nexuses?.statusBarHeight || telegram?.safeAreaInset?.top || 0
      const navBar = nexuses?.navBarHeight || telegram?.safeAreaInset?.bottom || 0
      const viewHeight = nexuses?.viewHeight || telegram?.viewportHeight || 0

      const newScale = Math.min(window.innerWidth, 540) / 375
      const ratio = window.outerHeight / viewHeight || 1
      const computedStatusBar = statusBar * ratio || 0
      const computedNavBar = navBar * ratio || 0

      setCssVar('--status-bar-height', computedStatusBar + 'px')
      setCssVar('--nav-bar-height', computedNavBar + 'px')

      set({
        screenWidth: Math.min(window.innerWidth, 540),
        screenHeight: window.innerHeight,
        scale: newScale,
        rem: newScale * 16,
        statusBarHeight: computedStatusBar,
        navBarHeight: computedNavBar,
      })
    },
  }
})
