import { useAuthStore } from '../stores/authStore'
import { getApiBaseUrl } from '../config/env'

export const DEFAULT_AVATAR_URL = '/images/common/default-avatar.webp'

export const resolveAssetUrl = (path?: string): string | undefined => {
  if (!path) return undefined
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('/images/')
  )
    return path
  const base = getApiBaseUrl()
  if (base && base !== '/') return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
  return path
}

export const resolveAvatarUrl = (path?: string): string => resolveAssetUrl(path) ?? DEFAULT_AVATAR_URL

export const debounce = <Args extends unknown[]>(fn: (...args: Args) => unknown, delay = 200) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const checkAuth = (isReplace = false, showNotification = true): boolean => {
  if (useAuthStore.getState().token || localStorage.getItem('token')) return true
  if (showNotification) {
    if (location.href.indexOf('/login') === -1) {
      window.dispatchEvent(new CustomEvent('gotourl', {
        detail: { url: '/login?origin=url_' + encodeURIComponent(location.href), type: isReplace ? 'replace' : 'push' },
      }))
    }
  }
  return false
}

export const withLoading = <T>(
  setLoading: (v: boolean) => void,
  promise: Promise<T>
): Promise<T> => {
  setLoading(true)
  return promise.finally(() => setLoading(false))
}

function isType(type: string, value: unknown): boolean {
  return Object.prototype.toString.call(value) === `[object ${type}]`
}

export const deepClone = <T>(source: T, seen = new WeakMap<object, unknown>()): T => {
  if (typeof source != 'object' || source === null) return source
  const objectSource = source as unknown as {
    constructor: {
      (arg?: unknown): unknown
      new (arg?: unknown): unknown
    }
  }
  if (isType('Symbol', source)) return objectSource.constructor((source as unknown as symbol).description) as T
  const cached = seen.get(source as object)
  if (cached !== undefined) return cached as T
  let initArg: unknown
  if (isType('Date', source) || isType('RegExp', source)) initArg = source
  const clone = new objectSource.constructor(initArg) as Record<string, unknown>
  const record = source as unknown as Record<string, unknown>
  if ((isType('Array', source) || isType('Object', source)) && (Object.keys(record).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(record, key)) clone[key] = deepClone(record[key], seen)
  }), isType('Set', source)))
    for (const item of source as unknown as Set<unknown>) (clone as unknown as Set<unknown>).add(deepClone(item, seen))
  if (isType('Map', source))
    for (const [key, value] of source as unknown as Map<unknown, unknown>) (clone as unknown as Map<unknown, unknown>).set(deepClone(key, seen), deepClone(value, seen))
  seen.set(source as object, clone)
  return clone as T
}

export const groupBy = <T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> => {
  const groups: Record<string, T[]> = {}
  items.forEach((item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(item)
  })
  return groups
}

export const cartesianProduct = <T>(arrays: T[][]): T[][] => {
  if (!arrays.length) return [[]]
  const result: T[][] = []
  const rest = cartesianProduct(arrays.slice(1))
  for (const item of arrays[0])
    for (const combo of rest)
      result.push([item, ...combo])
  return result
}
