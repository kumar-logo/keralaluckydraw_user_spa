import axios, { type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/authStore'
import { toast } from '../utils/toast'
import { getApiBaseUrl } from '../config/env'

interface NativeBridge {
  FCMInstanceToken?: string
}

const getNativeBridge = (): NativeBridge | undefined =>
  (window as unknown as { nexuses?: NativeBridge }).nexuses

const getNavigatorStandalone = (): boolean =>
  (navigator as Navigator & { standalone?: boolean }).standalone ?? false

const deviceInfo = {
  get isInApp() { return !!getNativeBridge() },
  get isInIOS() { return /iphone|ipad/i.test(navigator.userAgent) },
  get isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || getNavigatorStandalone() },
}

const parseCookies = (cookieString?: string) => {
  if (!cookieString) cookieString = document.cookie
  const parts = cookieString.split(';')
  const result: Record<string, string> = {}
  parts.forEach((part) => {
    const [key, value] = part.trim().split('=')
    result[key] = decodeURIComponent(value)
  })
  return result
}

const getChannel = () => deviceInfo.isInApp ? 'android' : `${deviceInfo.isInIOS ? 'ios' : 'android'}-${deviceInfo.isStandalone ? 'standalone' : 'h5'}`

const rejectPromise = (value: unknown) => Promise.reject(value)

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 6e4,
  headers: {
    'Content-Type': 'application/json',
    packageId: 1,
    packageInfo: 'com.keralaluckydraw.app',
    standalone: window.matchMedia('(display-mode: standalone)').matches ? 'true' : 'false',
  },
})

apiClient.interceptors.request.use(
  async (config) => {
    config.headers.channel = getChannel()
    config.headers.reqDate = new Date().getTime()
    config.headers.lang = localStorage.getItem('lang') || 'en-US'
    config.headers.origin_lang = navigator.language
    config.headers.visitor = localStorage.getItem('visitor')
    config.headers.channelId = localStorage.getItem('channel') || 'keralaluckydraw'
    config.headers.versionCode = localStorage.getItem('versionCode') || '101'
    config.headers.FCMInstanceToken = getNativeBridge()?.FCMInstanceToken || localStorage.getItem('FCMInstanceToken') || null
    config.headers.standalone = deviceInfo.isStandalone

    const token = useAuthStore.getState().token || localStorage.getItem('token')
    if (token) config.headers.Token = token

    const cookies = parseCookies()
    config.headers.pixelid = localStorage.getItem('pixelid')
    config.headers.fbp = cookies._fbp
    config.headers.fbc = cookies._fbc
    return config
  },
  (error) => {
    throw (console.error('req error:', error), new Error(error))
  }
)

apiClient.interceptors.response.use(
  async (response) => {
    if (response.status === 200)
      switch (response.data.code) {
        case 0:
          return response.data.data
        case 701:
          localStorage.setItem('expired-token', localStorage.getItem('token') || '')
          useAuthStore.getState().removeToken()
          break
        case 5509:
        case 1005:
          window.dispatchEvent(new CustomEvent('openRechargeDraw', { detail: { origin: response.config.url } }))
          if (response.data) toast.warning(response.data.msg)
          return rejectPromise(response)
        default:
          if (response.data) toast.warning(response.data.msg)
          return rejectPromise(response)
      }
    return rejectPromise(response)
  },
  async (error) => {
    const config = error.config
    if (error.response?.status === 500 && !config._retry) {
      config._retry = true
      console.warn(`⚠️ ${config.url} error code 500，retrying...`)
      try {
        return await apiClient(config)
      } catch (retryError) {
        console.error(`⚠️ ${config.url} error code 500，retried`, retryError)
        return Promise.reject(retryError)
      }
    }
    console.error('res error:', error)
    return Promise.reject(error)
  }
)

const inFlight = new Map<string, Promise<unknown>>()

const dedupKey = (method: string, url: string, payload: unknown) =>
  `${method} ${url} ${payload === undefined ? '' : JSON.stringify(payload)}`

const boundGet = apiClient.get.bind(apiClient)
const boundPost = apiClient.post.bind(apiClient)

apiClient.get = ((url: string, config?: AxiosRequestConfig) => {
  const key = dedupKey('GET', url, config?.params)
  const existing = inFlight.get(key)
  if (existing) return existing
  const request = boundGet(url, config).finally(() => inFlight.delete(key))
  inFlight.set(key, request)
  return request
}) as typeof apiClient.get

apiClient.post = ((url: string, data?: unknown, config?: AxiosRequestConfig) => {
  const key = dedupKey('POST', url, data)
  const existing = inFlight.get(key)
  if (existing) return existing
  const request = boundPost(url, data, config).finally(() =>
    inFlight.delete(key),
  )
  inFlight.set(key, request)
  return request
}) as typeof apiClient.post

export interface PageResult<T> {
  content: T[]
  totalPages: number
  totalSize: number
}

export const apiGet = <T>(url: string, config?: Parameters<typeof apiClient.get>[1]): Promise<T> =>
  apiClient.get(url, config) as unknown as Promise<T>

export const apiPost = <T>(url: string, data?: unknown, config?: Parameters<typeof apiClient.post>[2]): Promise<T> =>
  apiClient.post(url, data, config) as unknown as Promise<T>

export default apiClient
