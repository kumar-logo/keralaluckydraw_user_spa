export enum LotteryModeId {
  'Two Side' = 1,
  '4D' = 2,
  '3D' = 3,
  '2D' = 4,
  '4X' = 5,
  '3X' = 6,
  '2X' = 7,
  '1 Digit' = 8,
  FishPrawnCrab = 9,
}

export const TWO_SIDE_VALUES: Record<string, string> = {
  Big: '5,6,7,8,9',
  Small: '0,1,2,3,4',
  Odd: '1,3,5,7,9',
  Even: '0,2,4,6,8',
  Fish: '1,2,3',
  Prawn: '4,5,6',
  Crab: '7,8,9',
}

export const POSITION_COLORS = ['#D50000', '#0087D4', '#BD6600', '#008B59']

export const POSITION_GRADIENTS = [
  ['#D50000', '#FF4E16'],
  ['#0087D4', '#00A2FF'],
  ['#BD6600', '#F58A27'],
  ['#008B59', '#008C59'],
]

export const DIGIT_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export const isSingleSelection = (modeId: number): boolean => {
  switch (modeId) {
    case LotteryModeId['1 Digit']:
    case LotteryModeId['Two Side']:
    case LotteryModeId.FishPrawnCrab:
      return true
  }
  return false
}

export const isNumberMode = (modeId: number): boolean => {
  switch (modeId) {
    case LotteryModeId.FishPrawnCrab:
    case LotteryModeId['Two Side']:
      return false
  }
  return true
}

export const is4Digit = (modeId: number): boolean => {
  switch (modeId) {
    case LotteryModeId['4D']:
    case LotteryModeId['4X']:
      return true
  }
  return false
}

export const is3Digit = (modeId: number): boolean => {
  switch (modeId) {
    case LotteryModeId['3D']:
    case LotteryModeId['3X']:
      return true
  }
  return false
}

export const is2Digit = (modeId: number): boolean => {
  switch (modeId) {
    case LotteryModeId['2D']:
    case LotteryModeId['2X']:
      return true
  }
  return false
}

export const is1Digit = (modeId: number): boolean => modeId === LotteryModeId['1 Digit']

export const isTwoSide = (modeId: number): boolean => modeId === LotteryModeId['Two Side']

export const isFishPrawnCrab = (modeId: number): boolean => modeId === LotteryModeId.FishPrawnCrab

export const isDType = (modeId: number): boolean => {
  switch (modeId) {
    case LotteryModeId['4D']:
    case LotteryModeId['3D']:
    case LotteryModeId['2D']:
      return true
  }
  return false
}

export interface ModeTypeMap {
  isNumber: boolean
  isSingle: boolean
  isx4: boolean
  isx3: boolean
  isx2: boolean
  isx1: boolean
  isBSOD: boolean
  isFPC: boolean
  isD: boolean
}

export const getModeTypeMap = (modeId: number): ModeTypeMap => ({
  isNumber: isNumberMode(modeId),
  isSingle: isSingleSelection(modeId),
  isx4: is4Digit(modeId),
  isx3: is3Digit(modeId),
  isx2: is2Digit(modeId),
  isx1: is1Digit(modeId),
  isBSOD: isTwoSide(modeId),
  isFPC: isFishPrawnCrab(modeId),
  isD: isDType(modeId),
})

export interface AnalyzeResult {
  value: string
  colors: string[]
  fix: number
}

export function formatAnalyzeData(results?: string[], colors = POSITION_COLORS): AnalyzeResult[] {
  if (!results) results = ['----', '----']
  const maxLen = Math.max(...results.map((row) => row.length))
  const offset = maxLen - 4
  if (maxLen < 4) {
    console.error('error result !!', results.join(','))
    return [{ value: '----', colors: [], fix: 0 }]
  }
  const padColors = new Array(maxLen - (colors?.length || 0)).fill('var(--bg-icon-gray)')
  padColors.push(...colors)
  return results.map((row) => ({
    value: new Array(maxLen - row.length).fill('-').join('') + row,
    colors: padColors,
    fix: offset,
  }))
}

export interface SettlementTicket {
  ticketStatus: number
}

export interface SettlementOrder {
  ticketsLists: SettlementTicket[]
  totalPrize: number
}

export function getSettlementStatus(order?: SettlementOrder, forceCheck = false): string | undefined {
  if (!order) return undefined
  if (forceCheck || order.ticketsLists.every((ticket) => ticket.ticketStatus === 2)) {
    return order.totalPrize <= 0 ? 'nowin' : 'settleSynced'
  }
  return 'settled'
}

export interface WonCodeRound {
  wonCode: string[]
}

export function isValidWonCode(round?: WonCodeRound): boolean {
  if (!round) return false
  return round.wonCode.every((code) => {
    const parsed = parseInt(code)
    return parsed === parsed
  })
}

export const DEFAULT_MODE_TABS = ['Two Side', 'FishPrawnCrab', '1 Digit', '4D', '4X'].map(
  (name) => ({
    modeName: name,
    modeID: LotteryModeId[name as keyof typeof LotteryModeId],
  })
)

export const DEFAULT_TABS = [{ id: 1, name: '1st Prize' }]

export enum OrderModeId {
  'Two Side' = 1,
  '4D' = 2,
  '3D' = 3,
  '2D' = 4,
  '4X' = 5,
  '3X' = 6,
  '2X' = 7,
  '1 Digit' = 8,
  FishPrawnCrab = 9,
}

export const isNumberDisplayMode = (modeId: number): boolean => {
  switch (modeId) {
    case 9:
    case 1:
      return false
  }
  return true
}

export const hasTabsForMode = (modeId: number): boolean => {
  switch (modeId) {
    case 7:
    case 6:
    case 5:
    case 8:
      return false
  }
  return true
}

export const getDigitCount = (modeId: number): number => {
  switch (modeId) {
    case 2:
    case 5:
      return 4
    case 3:
    case 6:
      return 3
    case 4:
    case 7:
      return 2
    default:
      return 1
  }
}

export const ORDER_BADGE_COLORS = ['#D57300', '#0087D4', '#D50000', '#67A519']

export const BET_AMOUNT_COLORS = [
  ['#1BB458', '#10793A'],
  ['#228BA3', '#19697B'],
  ['#2047AC', '#17347D'],
  ['#A538B7', '#662471'],
  ['var(--bg-icon-gray)', '#2A2E34'],
]
