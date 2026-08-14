import apiClient, { apiPost } from './api'

export interface BankCardDto {
  id: number
  bankName: string
  cardNo: string
  holderName: string
  ifscCode: string
  upiAddress: string
  gpayId: string
  phonepeId: string
}

export interface CardListDto {
  list?: BankCardDto[]
}

export interface WithdrawPanelDto {
  minAmount: number
  maxAmount: number
  balance: number
  todayRemainTimes: number
  todayRemainAmount: number
  withdrawBalance: number
  withdrawMinAmount: number
  withdrawFeeRate: number
  withdrawCountLimit: number
  withdrawCountSurplus: number
  withdrawExplain?: string
}

export interface PayChannelDto {
  id: number
  name: string
  icon: string
  minAmount: number
  maxAmount: number
  isCustom: boolean
  mode?: string
  qr?: string
  requireProof?: boolean
}

export interface AmountBtnDto {
  amount: number
  mark?: string
  bonusPct?: number
}

export interface RechargePanelDto {
  rechargeChannelList?: PayChannelDto[]
  channels?: PayChannelDto[]
  amountBtnList?: AmountBtnDto[]
  amounts?: AmountBtnDto[]
}

export interface RechargeResultDto {
  payLink?: string
  payUrl?: string
}

export interface TransferTierDto {
  minAmount: number
  maxAmount: number
  pct: number
}

export interface TransferInfoDto {
  mainBalance: number
  withdrawableBalance: number
  minAmount: number
  maxAmount: number
  list: TransferTierDto[]
}

export interface RebateRecordDto {
  id: number
  createTime: string | number
  rebateAmount: number
  betAmount: number
  receiveStatus: number
  gameType: string
}

export interface RebateRecordsDto {
  content?: RebateRecordDto[]
  list?: RebateRecordDto[]
}

export interface VipLevelDto {
  level: number
  name: string
  requiredBet: number
  requiredRecharge: number
  upgradeBonus: number
  monthlyBonus: number
  rebateRate: number
  withdrawLimit: number
  levelColor?: string
}

export interface VipPanelDto {
  currentLevel?: number
  vipLevel?: number
  currentBet?: number
  totalBet?: number
  currentRecharge?: number
  totalRecharge?: number
  nextLevelBet?: number
  nextBet?: number
  nextLevelRecharge?: number
  nextRecharge?: number
  levels?: VipLevelDto[]
  vipList?: VipLevelDto[]
  claimedLevels?: number[]
  receivedList?: number[]
  monthlyClaimedLevels?: number[]
}


export const getCardList = () => apiPost<CardListDto | BankCardDto[]>('/hall/api/finance/v1/card/list')

export const addCard = (cardData: Omit<BankCardDto, 'id'>) => apiClient.post('/hall/api/finance/v1/card/add', cardData)

export const editCard = (cardData: Partial<BankCardDto> & { id: number }) => apiClient.post('/hall/api/finance/v1/card/edit', cardData)


export const getWithdrawPanel = () => apiPost<WithdrawPanelDto>('/hall/api/finance/v1/wd/panel')

export const withdrawBalance = (bankcardId: number, amount: number) =>
  apiClient.post('/hall/api/finance/v1/wd/balance', {
    bankcardId,
    amount,
  })


export const getTransferList = () => apiPost<TransferInfoDto>('/hall/api/finance/v1/trf/list')

export const transferBalance = (amount: number) =>
  apiClient.post('/hall/api/finance/v1/trf/balance', {
    amount: Math.abs(amount),
  })


export const getRechargeRecords = (pageNo = 1, pageSize = 10) =>
  apiClient.post('/hall/api/finance/v1/rc/records', {
    pageNo,
    pageSize,
  })

export const getWithdrawRecords = (pageNo = 1, pageSize = 10) =>
  apiClient.post('/hall/api/finance/v1/wd/records', {
    pageNo,
    pageSize,
  })

export const getTransferRecords = (pageNo = 1, pageSize = 10) =>
  apiClient.post('/hall/api/finance/v1/trf/records', {
    pageNo,
    pageSize,
  })


export interface FinanceRecord {
  id: string
  orderId?: string
  orderNo?: string
  amount: number
  giveAmount?: number
  status: number
  createTime: string | number
  remark?: string
  channel?: string
}

export interface FinanceRecordList {
  content?: FinanceRecord[]
  list?: FinanceRecord[]
}

export interface TransactionType {
  type: string
  name: string
}

export interface TransactionRecord {
  id: string
  sourceType: string
  amount: number
  balance: number
  createTime: string | number
  remark?: string
}

export interface TransactionTypeList {
  list?: TransactionType[]
}

export interface TransactionRecordList {
  content?: TransactionRecord[]
  list?: TransactionRecord[]
  totalAmount?: number
}

export const getTransactionTypes = () =>
  apiPost<TransactionType[] | TransactionTypeList>('/hall/api/finance/v1/txn/types')

export const getTransactionRecords = (sourceType: number | string, startDate: string, endDate: string, pageNo = 1, pageSize = 10) =>
  apiPost<TransactionRecordList>('/hall/api/finance/v1/txn/records', {
    pageNo,
    pageSize,
    sourceType,
    startDate,
    endDate,
  })


export const getRechargePanel = () => apiPost<RechargePanelDto>('/hall/api/finance/v1/rc/panel')

export const rechargeBalance = (
  payChannelId: number,
  amount: number,
  proofImage?: string,
  paymentRef?: string,
) =>
  apiPost<RechargeResultDto>('/hall/api/finance/v1/rc/balance', {
    payChannelId,
    amount,
    ...(proofImage ? { proofImage } : {}),
    ...(paymentRef ? { paymentRef } : {}),
  })

export const verifyYpayment = (orderNo: string, gatewayId?: number) =>
  apiPost<{ credited?: boolean; status?: string }>('/payment/verify/ypayment', { orderNo, gatewayId })


export const getRebateRecords = (status: number, startDate: string, endDate: string, pageNo = 1, pageSize = 10) =>
  apiPost<RebateRecordsDto>('/hall/api/finance/v1/rebate/records', {
    startDate,
    endDate,
    status,
    pageNo,
    pageSize,
  })

export const receiveRebate = (id: number) =>
  apiClient.post('/hall/api/finance/v1/rebate/receive', {
    id,
  })


export const getVipPanel = () => apiPost<VipPanelDto>('/hall/api/finance/v1/vip/panel')

export const claimVipAward = (vipLevel: number) =>
  apiClient.post('/hall/api/finance/v1/vip/award', {
    vipLevel,
  })

export const claimVipMonthly = (vipLevel: number) =>
  apiClient.post('/hall/api/finance/v1/vip/monthly-award', {
    vipLevel,
  })


export const getWageInfo = () => apiClient.post('/hall/api/finance/v1/wage/info')

export const claimWageAward = () => apiClient.post('/hall/api/finance/v1/wage/award')


export const getAgentPanel = () => apiPost('/hall/api/finance/v2/agent/panel')

export const getAgentRule = () => apiPost('/hall/api/finance/v2/agent/rule')

export const getAgentReport = (startDate: number, endDate: number) =>
  apiClient.post('/hall/api/finance/v2/agent/report', {
    startDate,
    endDate,
  })

export interface AgentTableParams {
  level: number
  pageNo: number
  pageSize: number
}

export const getAgentTable = (params: AgentTableParams) => apiClient.post('/hall/api/finance/v2/agent/table', params)

export const getAgentDetail = (userId: number) =>
  apiClient.post('/hall/api/finance/v2/agent/detail', {
    userId,
  })
