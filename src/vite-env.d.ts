/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_HOST?: string
  readonly VITE_DEV_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

import 'react'

declare global {
  const __APP_VERSION__: string

  interface LottiePlayerElement extends HTMLElement {
    play: () => void
    stop: () => void
    pause: () => void
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<LottiePlayerElement> & {
        src?: string
        autoplay?: boolean
        loop?: boolean
        speed?: number
        mode?: string
        background?: string
        count?: number
        direction?: number
        hover?: boolean
        intermission?: number
        renderer?: string
        onComplete?: () => void
      }, LottiePlayerElement>
    }
  }
}
