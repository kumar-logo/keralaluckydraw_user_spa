import { create } from 'zustand'
import { getAppConfig, type FirebaseWebConfig, type AppVersionConfig } from '../services/configApi'
import {
  POSITION_COLORS as DEFAULT_POSITION_COLORS,
  POSITION_GRADIENTS as DEFAULT_POSITION_GRADIENTS,
} from '../config/stateLotteryConstants'
import {
  stateNames as DEFAULT_STATE_NAMES,
  stateColors as DEFAULT_STATE_COLORS,
  defaultPayRate as DEFAULT_PAY_RATE,
  CURRENCY as DEFAULT_CURRENCY,
  APP_NAME as DEFAULT_APP_NAME,
} from '../config/raceConstants'

interface GameTypeConfig {
  type: string
  label: string
  emoji: string
  themeColor: string | null
  isLottery: boolean
  isThirdParty: boolean
}

interface StatusEntry { text: string; color: string }
type StatusMaps = Record<string, Record<string, StatusEntry>>

const DEFAULT_COLOR_MAP: Record<string, string[]> = {
  '0': ['red', 'violet'], '1': ['green'], '2': ['red'], '3': ['green'], '4': ['red'],
  '5': ['green', 'violet'], '6': ['red'], '7': ['green'], '8': ['red'], '9': ['green'],
}
const DEFAULT_RESULT_TABS = [
  { key: 'kerala', label: 'Kerala' }, { key: 'dubai', label: 'Dubai' }, { key: '3digit', label: '3Digits' },
  { key: '45d', label: '4D & 5D' }, { key: 'color', label: 'WinGo' }, { key: 'dice', label: 'K3' },
]
const DEFAULT_GAME_CATEGORIES: Record<string, number> = { lottery: 1, casino: 5, slot: 6, lobby: 1020, live: 1025, fishing: 1026 }
const DEFAULT_BET_AMOUNT_PRESETS: number[] = [10, 50, 100, 200]

const DEFAULT_APP_VERSION: AppVersionConfig = {
  version: '',
  forceUpdate: false,
  minSupportedVersion: '',
  storeUrl: '',
  androidPackageName: '',
  updateMessage: '',
}

interface AppConfigState {
  loaded: boolean
  appName: string
  appVersion: AppVersionConfig
  currency: string
  siteUrl: string
  loginBgLightUrl: string
  loginBgDarkUrl: string
  gameTypes: GameTypeConfig[]

  positionColors: string[]
  positionGradients: string[][]
  stateNames: string[]
  stateColors: string[]
  defaultPayRate: { odds: number; type: number }[]
  colorMap: Record<string, string[]>
  statusMaps: StatusMaps
  mysteryBoxGradients: string[]
  spriteScale: number
  resultTabs: { key: string; label: string }[]
  gameCategories: Record<string, number>
  betAmountPresets: number[]
  support: {
    chatEnabled: boolean
    chatProvider: string
    chatLicense: string
    telegramUrl: string
    whatsappEnabled: boolean
    whatsappUrl: string
  }
  sportsGameCode: string
  marqueeText: string
  otp: { enabled: boolean; smsEnabled: boolean; whatsappEnabled: boolean }
  socialLogin: { enabled: boolean }
  vipEnabled: boolean
  rechargeBonusEnabled: boolean
  groupChatEnabled: boolean
  groupChatImageEnabled: boolean
  firebase: FirebaseWebConfig | null

  fetchConfig: () => Promise<void>
  refreshGroupChat: () => Promise<void>
  setGroupChatEnabled: (enabled: boolean) => void
  getGameTypeConfig: (gameType: string) => GameTypeConfig | undefined
  isLotteryType: (gameType: string) => boolean
  getStatus: (domain: string, code: number | string) => StatusEntry
  colorsForNumber: (n: number | string) => string[]
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  loaded: false,
  appName: DEFAULT_APP_NAME,
  appVersion: DEFAULT_APP_VERSION,
  currency: DEFAULT_CURRENCY,
  siteUrl: '',
  loginBgLightUrl: '',
  loginBgDarkUrl: '',
  gameTypes: [],

  positionColors: DEFAULT_POSITION_COLORS,
  positionGradients: DEFAULT_POSITION_GRADIENTS,
  stateNames: DEFAULT_STATE_NAMES,
  stateColors: DEFAULT_STATE_COLORS,
  defaultPayRate: DEFAULT_PAY_RATE,
  colorMap: DEFAULT_COLOR_MAP,
  statusMaps: {},
  mysteryBoxGradients: [],
  spriteScale: 0.75,
  resultTabs: DEFAULT_RESULT_TABS,
  gameCategories: DEFAULT_GAME_CATEGORIES,
  betAmountPresets: DEFAULT_BET_AMOUNT_PRESETS,
  support: {
    chatEnabled: true,
    chatProvider: 'salesmartly',
    chatLicense: '',
    telegramUrl: '',
    whatsappEnabled: false,
    whatsappUrl: '',
  },
  sportsGameCode: '',
  marqueeText: '',
  otp: { enabled: false, smsEnabled: false, whatsappEnabled: false },
  socialLogin: { enabled: false },
  vipEnabled: true,
  rechargeBonusEnabled: true,
  groupChatEnabled: false,
  groupChatImageEnabled: true,
  firebase: null,

  fetchConfig: async () => {
    if (get().loaded) return
    try {
      const data = await getAppConfig()
      const ui = data.ui ?? {}
      set({
        loaded: true,
        appName: data.appName ?? DEFAULT_APP_NAME,
        appVersion: data.appVersion
          ? { ...DEFAULT_APP_VERSION, ...data.appVersion }
          : DEFAULT_APP_VERSION,
        currency: data.currency ?? DEFAULT_CURRENCY,
        siteUrl: data.siteUrl ?? '',
        loginBgLightUrl: data.loginBgLightUrl ?? '',
        loginBgDarkUrl: data.loginBgDarkUrl ?? '',
        gameTypes: data.gameTypes ?? [],
        colorMap: data.colorMap ?? DEFAULT_COLOR_MAP,
        statusMaps: data.statusMaps ?? {},
        positionColors: ui.positionColors ?? DEFAULT_POSITION_COLORS,
        positionGradients: ui.positionGradients ?? DEFAULT_POSITION_GRADIENTS,
        stateNames: ui.stateNames ?? DEFAULT_STATE_NAMES,
        stateColors: ui.stateColors ?? DEFAULT_STATE_COLORS,
        defaultPayRate: ui.defaultPayRate ?? DEFAULT_PAY_RATE,
        mysteryBoxGradients: ui.mysteryBoxGradients?.length ? ui.mysteryBoxGradients : [],
        spriteScale: typeof ui.spriteScale === 'number' ? ui.spriteScale : 0.75,
        resultTabs: ui.resultTabs?.length ? ui.resultTabs : DEFAULT_RESULT_TABS,
        gameCategories: ui.gameCategories ?? DEFAULT_GAME_CATEGORIES,
        betAmountPresets: ui.betAmountPresets?.length ? ui.betAmountPresets : DEFAULT_BET_AMOUNT_PRESETS,
        support: { ...get().support, ...data.support },
        sportsGameCode: data.sportsGameCode ?? '',
        marqueeText: data.marqueeText ?? '',
        otp: data.otp ?? { enabled: false, smsEnabled: false, whatsappEnabled: false },
        socialLogin: data.socialLogin ?? { enabled: false },
        vipEnabled: data.vipEnabled ?? true,
        rechargeBonusEnabled: data.rechargeBonusEnabled ?? true,
        groupChatEnabled: data.groupChatEnabled ?? false,
        groupChatImageEnabled: data.groupChatImageEnabled ?? true,
        firebase: data.firebase ?? null,
      })
    } catch {
      set({ loaded: true })
    }
  },

  refreshGroupChat: async () => {
    try {
      const data = await getAppConfig()
      set({
        groupChatEnabled: data.groupChatEnabled ?? false,
        groupChatImageEnabled: data.groupChatImageEnabled ?? true,
      })
    } catch {
      set({})
    }
  },

  setGroupChatEnabled: (enabled: boolean) => set({ groupChatEnabled: enabled }),

  getGameTypeConfig: (gameType: string) => get().gameTypes.find((g) => g.type === gameType),

  isLotteryType: (gameType: string) => get().gameTypes.some((g) => g.type === gameType && g.isLottery),

  getStatus: (domain, code) => {
    const entry = get().statusMaps?.[domain]?.[String(code)]
    return entry || { text: String(code), color: 'default' }
  },

  colorsForNumber: (n) => get().colorMap?.[String(n)] ?? [],
}))
