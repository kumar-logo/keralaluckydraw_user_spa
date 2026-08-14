type SsqArgs = unknown[]

interface SsqFn {
  (...args: SsqArgs): void
  callMethod?: (...args: SsqArgs) => void
  push: (...args: SsqArgs) => void
  loaded: boolean
  queue: SsqArgs[]
}

declare global {
  interface Window {
    ssq?: SsqFn
    __ssc: { license?: string; setting?: Record<string, unknown> }
  }
}

export function initSalesSmartly(license: string, onUnread: (has: boolean) => void) {
  if (window.ssq) return

  const SCRIPT_ID = 'ss-chat'
  window.__ssc = window.__ssc || {}
  window.__ssc.license = license

  const ssq = function (...args: SsqArgs) {
    if (ssq.callMethod) ssq.callMethod(...args)
    else ssq.queue.push(args)
  } as SsqFn
  ssq.push = ssq
  ssq.loaded = true
  ssq.queue = []
  window.ssq = ssq

  if (document.getElementById(SCRIPT_ID)) return

  const BASE = 'https://plugin-code.salesmartly.com'
  const PATH = '/chat/widget/code/install.js'

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = BASE + PATH

  const firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode?.insertBefore(script, firstScript)

  script.onerror = () => {
    const old = document.getElementById(SCRIPT_ID)
    if (old) old.parentNode?.removeChild(old)
    const fallback = document.createElement('script')
    fallback.id = SCRIPT_ID
    fallback.src = BASE + PATH
    firstScript.parentNode?.insertBefore(fallback, firstScript)
  }

  script.onload = () => {
    window.__ssc.setting = { hideIcon: true }

    window.ssq?.push('onUnRead', (unreadData: { num: number }) => {
      onUnread(!!unreadData.num)
    })

    window.ssq?.push('onOpenChat', () => {
      onUnread(false)
    })

    if (localStorage.getItem('shortcuts_get_50rs')) {
      localStorage.removeItem('shortcuts_get_50rs')
      window.ssq?.push('onReady', () => {
        window.ssq?.push('chatOpen')
        window.ssq?.push('onOff', ['onReady'])
      })
    }
  }
}

interface CsUserInfo {
  userID?: number | string
  nickName?: string
  phone?: string
  email?: string
}

export function openCS(extra?: Record<string, unknown>) {
  if (!window.ssq) {
    return setTimeout(() => openCS(extra), 200)
  }

  let userInfo: CsUserInfo = {}
  try {
    const raw = localStorage.getItem('userInfo')
    if (raw) userInfo = JSON.parse(raw)
  } catch (e) {
    console.warn(e)
  }

  if (userInfo.userID) {
    window.ssq?.push('setLoginInfo', {
      user_id: userInfo.userID + '',
      user_name: userInfo.userID + '',
      phone: localStorage.getItem('userPhone') || userInfo.phone,
      email: userInfo.email,
      custom_fields_ext: {
        userID: userInfo.userID,
        userName: userInfo.nickName,
        lang: localStorage.getItem('lang') || 'en-US',
        originLang: navigator.language,
        ...extra,
      },
    })
  } else {
    window.ssq?.push('clearUser')
    window.ssq?.push('setLoginInfo', {
      custom_fields_ext: {
        lang: localStorage.getItem('lang') || 'en-US',
        originLang: navigator.language,
        ...extra,
      },
    })
  }

  window.ssq?.push('chatOpen')
}
