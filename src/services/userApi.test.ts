import { describe, it, expect, beforeEach, vi } from 'vitest'

const { post, get, apiPost, apiGet } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  apiPost: vi.fn(),
  apiGet: vi.fn(),
}))

vi.mock('./api', () => ({
  default: { post, get },
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiGet: (...args: unknown[]) => apiGet(...args),
}))

import { loginPassword, loginSms, register, getUserInfo } from './userApi'

describe('userApi — login flow', () => {
  beforeEach(() => {
    localStorage.clear()
    apiPost.mockResolvedValue({ token: 'jwt-xyz' })
    apiGet.mockResolvedValue({ userID: 1 })
  })

  it('logs in with phone + password and returns the token', async () => {
    const res = await loginPassword('9000000000', 'secret')
    expect(apiPost).toHaveBeenCalledWith('/hall/api/usr/v1/info/login/password', {
      phone: '9000000000',
      password: 'secret',
    })
    expect(res.token).toBe('jwt-xyz')
  })

  it('attaches a stored invite code to the SMS login payload', async () => {
    localStorage.setItem('inviteCode', 'INV42')
    await loginSms('9000000000', '123456')
    expect(apiPost).toHaveBeenCalledWith('/hall/api/usr/v1/info/login/sms', {
      phone: '9000000000',
      smsCode: '123456',
      inviteCode: 'INV42',
    })
  })

  it('omits the invite code from SMS login when none is stored', async () => {
    await loginSms('9000000000', '123456')
    expect(apiPost).toHaveBeenCalledWith('/hall/api/usr/v1/info/login/sms', {
      phone: '9000000000',
      smsCode: '123456',
    })
  })

  it('registers a new account with the supplied invite code', async () => {
    await register('9000000000', '999999', 'pw', 'REF9')
    expect(apiPost).toHaveBeenCalledWith('/hall/api/usr/v1/info/register', {
      phone: '9000000000',
      smsCode: '999999',
      password: 'pw',
      inviteCode: 'REF9',
    })
  })

  it('fetches the current user info', async () => {
    const info = await getUserInfo()
    expect(apiGet).toHaveBeenCalledWith('/hall/api/usr/v1/info/get')
    expect(info.userID).toBe(1)
  })
})
