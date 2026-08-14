import apiClient, { apiGet, apiPost } from './api'

export interface ShareInfoDto {
  inviteCode?: string
  inviteUrl?: string
  totalInvite?: number
  totalReward?: number
}

export interface UserInfoDto {
  userID?: number
  nickName?: string
  nickname?: string
  phone?: string
  email?: string
  avatar?: string
  inviteCode?: string
  vipLevel?: number
  googleBound?: boolean
  tgBound?: boolean
  status?: number
  banReason?: string
}

export interface UserWalletDto {
  balance?: number
  bonusBalance?: number
  rechargeBalance?: number
  withdrawBalance?: number
  isRecharge?: boolean
  amount?: number
  title?: string
  wageringRequired?: number
  wageringCompleted?: number
  bonusRules?: string[]
}

export interface SendSmsDto {
  sent?: boolean
}

export interface LoginResultDto {
  token?: string
}

export const getUserInfo = () => apiGet<UserInfoDto>('/hall/api/usr/v1/info/get')

export const getUserWallet = () => apiPost<UserWalletDto>('/hall/api/finance/v1/user/wlt')

export const sendSms = (phone?: string, purpose?: string) => {
  const payload: { phone?: string; purpose?: string } = {}
  if (phone) payload.phone = phone
  if (purpose) payload.purpose = purpose
  return apiPost<SendSmsDto>('/hall/api/usr/v1/sms/send', Object.keys(payload).length ? payload : null)
}

export const getShareInfo = () => apiGet<ShareInfoDto>('/hall/api/usr/v1/share/info')

export const register = (phone: string, smsCode: string, password: string, inviteCode?: string) =>
  apiPost<LoginResultDto>('/hall/api/usr/v1/info/register', {
    phone,
    smsCode,
    password,
    inviteCode,
  })

export const loginTelegram = (telegramData: { initData?: string; user?: unknown; inviteCode?: string }) => {
  const inviteCode = localStorage.getItem('inviteCode')
  if (inviteCode) telegramData.inviteCode = inviteCode
  return apiPost<LoginResultDto>('/hall/api/usr/v1/info/login/tg', telegramData)
}

export const loginGoogle = (idToken: string) => {
  const payload: { idToken: string; inviteCode?: string } = { idToken }
  const inviteCode = localStorage.getItem('inviteCode')
  if (inviteCode) payload.inviteCode = inviteCode
  return apiPost<LoginResultDto>('/hall/api/usr/v1/info/login/google', payload)
}

export const loginPassword = (phone: string, password: string) =>
  apiPost<LoginResultDto>('/hall/api/usr/v1/info/login/password', {
    phone,
    password,
  })

export const loginSms = (phone: string, smsCode: string) => {
  const payload: { phone: string; smsCode: string; inviteCode?: string } = { phone, smsCode }
  const inviteCode = localStorage.getItem('inviteCode')
  if (inviteCode) payload.inviteCode = inviteCode
  return apiPost<LoginResultDto>('/hall/api/usr/v1/info/login/sms', payload)
}

export const updatePassword = (password: string, smsCode: string) =>
  apiClient.post('/hall/api/usr/v1/info/update/password', {
    password,
    smsCode,
  })

export const resetPassword = (phone: string, smsCode: string, password: string) =>
  apiPost<{ reset?: boolean }>('/hall/api/usr/v1/info/reset/password', {
    phone,
    smsCode,
    password,
  })

export const getAvatarList = () => apiGet<string[] | { list?: string[] }>('/hall/api/usr/v1/avatar/list')

export const updateAvatar = (avatar: string) =>
  apiClient.post('/hall/api/usr/v1/info/update/avatar', {
    avatar,
  })

export interface TelegramAuthData {
  id: string | number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date?: number
  hash?: string
}

export const bindTelegram = (telegramData: TelegramAuthData) =>
  apiClient.post('/hall/api/usr/v1/info/bind/tg', telegramData)

export const bindGoogle = (idToken: string) =>
  apiClient.post('/hall/api/usr/v1/info/bind/google', {
    idToken,
  })

export const bindPhone = (phone: string, smsCode: string) =>
  apiClient.post('/hall/api/usr/v1/info/bind/phone', {
    phone,
    smsCode,
  })

export const updateNickname = (nickname: string) =>
  apiClient.post('/hall/api/usr/v1/info/update/nickname', {
    nickname,
  })

export const appAwardDownload = (data?: Record<string, unknown>) =>
  apiClient.post('/hall/api/usr/v1/app/award/download', data)
