import { create } from 'zustand'
import type { UserInfoDto } from '../services/userApi'

interface AuthStore {
  userInfo: UserInfoDto | null
  setUserInfo: (info: UserInfoDto | null) => void
  token: string | null
  setToken: (token: string) => void
  removeToken: () => void
  lang: string
  balance: number
  decrementBalance: (amount: number) => void
  bonusBalance: number
  isRecharge: boolean | null
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  userInfo: (() => { try { return JSON.parse(localStorage.getItem('userInfo') ?? 'null') as UserInfoDto | null } catch { return null } })(),
  setUserInfo: (info) => {
    set({ userInfo: info })
    if (info) localStorage.setItem('userInfo', JSON.stringify(info))
    else localStorage.removeItem('userInfo')
  },
  token: localStorage.getItem('token') || null,
  setToken: (token) => {
    if (token) {
      set({ token })
      localStorage.setItem('token', token)
    }
  },
  removeToken: () => {
    set({ token: null, userInfo: null, isRecharge: null })
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  },
  lang: 'en',
  balance: 0,
  decrementBalance: (amount) => {
    set((state) => ({ balance: state.balance - amount }))
  },
  bonusBalance: 0,
  isRecharge: null,
  loading: false,
  setLoading: (loading) => {
    set({ loading })
  },
}))
