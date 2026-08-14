export const STATUS_TO_BE_DRAWN = 0
export const STATUS_WON = 1
export const STATUS_NO_WIN = 2

export const RACE_SINGLE_RUNNER_COUNT = 6
export const RACE_BET_TYPE_GROUP = 3

export const DATE_DAY_MONTH_TIME = 'dd-MM hh:mm'
export const DATE_DAY_MONTH_YEAR_TIME = 'dd-MM-yyyy hh:mm'
export const DATE_DAY_MONTH_YEAR_TIME_SEC = 'dd/MM/yyyy hh:mm:ss'
export const DATE_YEAR_MONTH_DAY_TIME_SEC = 'yyyy-MM-dd hh:mm:ss'

export const PLACEHOLDER_EMPTY = '--'
export const PENDING_VALUE = '...'

export interface ColorTicket {
  betItem: string
  amount: number
  fee: number
  prize: number
  status: number
  createTime?: number
}

export interface DiceBet {
  betItem: string
  amount: number
  basePrice: number
  prize: number
  status: number
  createTime?: number
}

export interface CodeEntry {
  code: string
  betNum?: number
  amount: number
  prize: number
  status: number
}

export interface DigitCodeEntry {
  indexCode?: string
  number?: string
  code?: string
  pickAmount?: number
  pickCount?: number
  amount?: number
  count?: number
  prize?: number
  codeWinAmount?: number
  winAmount?: number
  status?: number
}

export interface RaceBetEntry {
  type?: number
  betNum: string
  amount: number
  prize: number
  status: number
}

export interface OrderRecord {
  orderGroup?: string
  orderNo?: string
  roundNo?: string | number
  gameId?: number
  gameName?: string
  keralaName?: string
  gameIcon?: string
  gameIconUrl?: string
  icon?: string
  drawTime?: number | string
  drawSec?: number
  createTime?: number
  totalAmount?: number
  totalPrize?: number
  winAmount?: number
  status?: number
  tags?: string
  tabMin?: number
  result?: string
  resultCount?: number
  wonCode?: string
  result1st?: string
  resultTop3?: string
  runnerCount?: number
  lotteryName?: string
  isQuick?: boolean
  tickets?: ColorTicket[]
  typeList?: DiceBet[]
  codeList?: CodeEntry[]
  codeLists?: DigitCodeEntry[]
}

export const computeTicketStatus = (entries: { status: number }[]): number => {
  if (!entries.length || !entries.every((entry) => entry.status !== STATUS_TO_BE_DRAWN)) {
    return STATUS_TO_BE_DRAWN
  }
  return entries.some((entry) => entry.status === STATUS_WON) ? STATUS_WON : STATUS_NO_WIN
}

export const sumAmount = (entries: { amount?: number }[]): number =>
  entries.reduce((total, entry) => total + (entry.amount || 0), 0)
