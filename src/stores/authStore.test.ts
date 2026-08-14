import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { UserInfoDto } from '../services/userApi'

const reset = () => {
  localStorage.clear()
  useAuthStore.setState({
    userInfo: null,
    token: null,
    balance: 0,
    bonusBalance: 0,
    isRecharge: null,
    loading: false,
  })
}

describe('authStore — auth/login flow', () => {
  beforeEach(reset)

  it('setToken stores the token in state and localStorage', () => {
    useAuthStore.getState().setToken('jwt-abc-123')
    expect(useAuthStore.getState().token).toBe('jwt-abc-123')
    expect(localStorage.getItem('token')).toBe('jwt-abc-123')
  })

  it('setToken ignores an empty token (does not clobber an existing session)', () => {
    useAuthStore.getState().setToken('real-token')
    useAuthStore.getState().setToken('')
    expect(useAuthStore.getState().token).toBe('real-token')
    expect(localStorage.getItem('token')).toBe('real-token')
  })

  it('setUserInfo persists the user and removeToken clears the session', () => {
    const user: UserInfoDto = { userID: 42, nickname: 'Asha', vipLevel: 3 }
    useAuthStore.getState().setToken('tok')
    useAuthStore.getState().setUserInfo(user)
    expect(useAuthStore.getState().userInfo).toEqual(user)
    expect(JSON.parse(localStorage.getItem('userInfo') ?? 'null')).toEqual(user)

    useAuthStore.getState().removeToken()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().userInfo).toBeNull()
    expect(useAuthStore.getState().isRecharge).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('userInfo')).toBeNull()
  })

  it('setUserInfo(null) removes the persisted user', () => {
    useAuthStore.getState().setUserInfo({ userID: 1 })
    useAuthStore.getState().setUserInfo(null)
    expect(useAuthStore.getState().userInfo).toBeNull()
    expect(localStorage.getItem('userInfo')).toBeNull()
  })
})

describe('authStore — balance (money path)', () => {
  beforeEach(reset)

  it('decrementBalance subtracts the bet amount from the wallet', () => {
    useAuthStore.setState({ balance: 1000 })
    useAuthStore.getState().decrementBalance(250)
    expect(useAuthStore.getState().balance).toBe(750)
  })

  it('decrementBalance is cumulative across multiple bets', () => {
    useAuthStore.setState({ balance: 500 })
    useAuthStore.getState().decrementBalance(100)
    useAuthStore.getState().decrementBalance(150)
    expect(useAuthStore.getState().balance).toBe(250)
  })
})
