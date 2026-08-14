import { apiGet } from './api'

export interface GameTypeConfigDto {
  type: string
  label: string
  emoji: string
  themeColor: string | null
  isLottery: boolean
  isThirdParty: boolean
}

export interface AppConfigUi {
  positionColors?: string[]
  positionGradients?: string[][]
  stateNames?: string[]
  stateColors?: string[]
  defaultPayRate?: { odds: number; type: number }[]
  mysteryBoxGradients?: string[]
  spriteScale?: number
  resultTabs?: { key: string; label: string }[]
  gameCategories?: Record<string, number>
  betAmountPresets?: number[]
}

export interface AppConfigSupport {
  chatEnabled: boolean
  chatProvider: string
  chatLicense: string
  telegramUrl: string
  whatsappEnabled: boolean
  whatsappUrl: string
}

export interface AppConfigOtp {
  enabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
}

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
  vapidKey: string
}

export interface AppVersionConfig {
  version: string
  forceUpdate: boolean
  minSupportedVersion: string
  storeUrl: string
  androidPackageName: string
  updateMessage: string
}

export interface AppConfigDto {
  appName?: string
  appVersion?: AppVersionConfig
  currency?: string
  siteUrl?: string
  loginBgLightUrl?: string
  loginBgDarkUrl?: string
  gameTypes?: GameTypeConfigDto[]
  colorMap?: Record<string, string[]>
  statusMaps?: Record<string, Record<string, { text: string; color: string }>>
  ui?: AppConfigUi
  support?: AppConfigSupport
  sportsGameCode?: string
  marqueeText?: string
  otp?: AppConfigOtp
  socialLogin?: { enabled: boolean }
  vipEnabled?: boolean
  rechargeBonusEnabled?: boolean
  groupChatEnabled?: boolean
  groupChatImageEnabled?: boolean
  firebase?: FirebaseWebConfig
}

export interface SharePosterDto {
  id: number
  imgUrl: string
  title: string
}

export const getAppConfig = () =>
  apiGet<AppConfigDto>('/hall/api/oper/v1/app/config')

export const getSharePosterList = () =>
  apiGet<SharePosterDto[]>('/hall/api/oper/v1/share-poster/list')
