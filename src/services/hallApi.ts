import apiClient, { apiGet, apiPost } from './api'

export interface ActivityAward {
  actKey: string
  timeKey: string
  status: number
  awardType?: string
  awardNum?: number
  award?: number
}

export interface AlmsEntry extends ActivityAward {
  dayIndex: number
}

export interface AlmsActivity {
  actID: number
  content: AlmsEntry[]
}

export interface DepositLevel extends ActivityAward {
  min: number
  max: number
  awardPer: number
}

export interface DepositDay {
  day: number
  levelList: DepositLevel[]
}

export interface DepositActivity {
  actID: number
  curDayIndex: number
  content: DepositDay[]
}

export interface FirstWithdrawalActivity extends ActivityAward {
  actID: number
  vipLevel: number
}

export interface RebateEntry {
  id: number
  actKey: string
  timeKey: string
  createTime: string | number
  rebateAmount: number
}

export interface RebateActivity {
  actID: number
  info?: RebateEntry[]
}

export interface WinLoseActivity extends ActivityAward {
  actID: number
  winLose: number
}

export interface InviteEntry extends ActivityAward {
  avatar?: string
}

export interface InviteActivity {
  actID: number
  content: InviteEntry[]
}

export interface DailyRewardsActivity {
  actID: number
  checkin?: ActivityAward
  spin?: ActivityAward
  betCompensation?: ActivityAward
  rebate?: ActivityAward
}

export interface DailyTaskGame {
  gameCode: string
  gameName: string
  image: string
  link: string
}

export interface DailyTaskEntry extends ActivityAward {
  betCount?: number
  games?: DailyTaskGame[]
}

export interface DailyTaskCompleted extends ActivityAward {
  value: number
  totalCount: number
}

export interface DailyTasksActivity {
  actID: number
  completed?: DailyTaskCompleted
  cashRain?: ActivityAward
  userInvite?: DailyTaskEntry
  playLottery?: DailyTaskEntry
  playCasino?: DailyTaskEntry
  playLive?: DailyTaskEntry
  playFishing?: DailyTaskEntry
  playSlot?: DailyTaskEntry
}

export interface WeeklySalaryWeek {
  vipLevel: number
  condAmount: number
  rcAmount: number
  wageAmount: number
  isClaim: boolean
}

export interface WeeklySalaryActivity {
  actID: number
  actKey: string
  timeKey: string
  info: { lastWeek: WeeklySalaryWeek }
}

export interface RankAward {
  awardNumber: number
}

export interface RankTop {
  avatar?: string
  awards?: RankAward[]
}

export interface RankMe {
  stage?: number
  isClaim?: boolean
  awards?: RankAward[]
}

export interface RankStage {
  actKey: string
  timeKey: string
  tops?: RankTop[]
  me?: RankMe
}

export interface RankingActivity {
  actID: number
  info?: Record<number, RankStage>
}

export interface OneTimeEntry extends ActivityAward {
  link?: string
}

export interface OneTimeActivity {
  actID: number
  bindPhone?: OneTimeEntry
  changeNick?: OneTimeEntry
  downloadApp?: OneTimeEntry
  changeAvatar?: OneTimeEntry
  addTG?: OneTimeEntry
}

export interface ActivityList {
  alms?: AlmsActivity
  deposit?: DepositActivity
  firstWithdrawal?: FirstWithdrawalActivity
  rebate?: RebateActivity
  winLose?: WinLoseActivity
  invite?: InviteActivity
  dailyRewards?: DailyRewardsActivity
  dailyTasks?: DailyTasksActivity
  weeklySalary?: WeeklySalaryActivity
  ranking?: RankingActivity
  onetime?: OneTimeActivity
}

export const getActivityList = () => apiGet<ActivityList>('/hall/api/act/v1/activity/list')

export const getCheckinInfo = () => apiClient.get('/hall/api/act/v1/checkin/info')

export const getDoneStatus = (activityID: number) =>
  apiClient.get('/hall/api/act/v1/done/status?activityID=' + activityID)

export const claimActivityAward = (actID: number, actKey: string, timeKey: string) =>
  apiClient.post('/hall/api/act/v1/award/get', {
    actID,
    actKey,
    timeKey,
  })


export const getCasinoGameUrl = (gameCode: string) =>
  apiPost<{ url?: string; message?: string }>('/hall/api/oper/v1/casino/game/url', {
    gameCode,
    lobbyUrl: '/',
  })

export interface HomeBanner {
  id: number
  img?: string
  imgId?: string
  skipUrl?: string
}

export const getBannerList = () =>
  apiPost<HomeBanner[]>('/hall/api/oper/v1/home/banner/list')

export const getHomePopList = () =>
  apiClient.post('/hall/api/oper/v1/home/pop/list')

export const redeemCdKey = (cdKey: string) =>
  apiClient.post('/hall/api/oper/v1/cdkey/change', {
    cdKey,
  })

export interface HomeGame {
  gameId: number
  gameCode: string
  gameName: string
  gameType?: string
  provider?: string
  gameUrl?: string
  verticalPic?: string
  gamePic?: string
  icon?: string
  imgId?: string
  name?: string
  sellingPrice: number
  maxPrize?: string
  drawTime: number
  startTime?: number
  countDown: number
  cycle: number
  isQuick?: boolean
  emergencyStop?: number
  drawInProgress?: number
  runnerCount?: number
  rows?: number
  isCollect?: boolean
  groupName?: string
}

export interface HomeSpritePos {
  x: number
  y: number
}

export interface HomeProvider {
  filterType: string
  filterName: string
  bigIcon?: HomeSpritePos
}

export interface HomeFilter {
  filterType: string
  filterName: string
  icon?: HomeSpritePos
  bigIcon?: HomeSpritePos
}

export interface HomeSection {
  filterType: string
  filterName: string
  games?: HomeGame[]
  rows?: number
  totalPages?: number
  totalSize?: number
}

export interface HomeGroupLinks {
  tg_link?: string
  wa_link?: string
  x_link?: string
  facebook_link?: string
  instagram_link?: string
}

export interface HomeFilterSize {
  width?: number
  height?: number
}

export interface HomeGameListResponse {
  list?: HomeSection[]
  home?: HomeGame[]
  group?: HomeGroupLinks
  providers?: HomeProvider[]
  filterList?: HomeFilter[]
  collect?: HomeGame[]
  recent?: HomeGame[]
  filterIcon?: string
  lightIcon?: string
  filterSize?: HomeFilterSize
}

export const getHomeGameList = (params: { categoryId?: number; filterType?: string; pageSize?: number; pageNum?: number }) =>
  apiPost<HomeGameListResponse>('/hall/api/oper/v3/home/game/list', {
    categoryId: params.categoryId,
    filterType: params.filterType,
    pageSize: params.pageSize ?? 12,
    pageNum: params.pageNum ?? 1,
  })

export interface SearchGameListParams {
  keyword: string
}

export const searchGameList = (params: SearchGameListParams) =>
  apiClient.post('/hall/api/oper/v3/search/list', params)

export const setGameCollect = (gameCode: string, collect: boolean) =>
  apiClient.post('/hall/api/oper/v3/collect/set', {
    gameCode,
    collect,
  })

export const getShareList = (limit = 8) =>
  apiClient.post('/hall/api/oper/v1/share/list', {
    limit,
  })

export const trackShareClick = (id: number) =>
  apiClient.post('/hall/api/oper/v1/share/click', {
    id,
  })


export interface RankInfoParams {
  rankType?: string
  period?: string
  pageNo?: number
  pageSize?: number
}

export const getRankInfo = (params: RankInfoParams) =>
  apiClient.post('/hall/api/rank/v1/info', params)

export interface RankAwardParams {
  rankType?: string
  period?: string
}

export const claimRankAward = (params: RankAwardParams) =>
  apiClient.post('/hall/api/rank/v1/award', params)


export const getUnreadMessageCount = () =>
  apiClient.get('/hall/api/usr/v1/msg/unread/count')


export const getGameRules = (gameId: number) =>
  apiClient.get(`/hall/api/oper/v1/game/${gameId}/rules`)


export const getNotificationList = (pageNo: number, pageSize: number) =>
  apiClient.post('/hall/api/usr/v1/notification/list', {
    pageNo,
    pageSize,
  })

export const getNotificationUnreadCount = () =>
  apiClient.get('/hall/api/usr/v1/notification/unread-count')

export const markNotificationRead = (id: number) =>
  apiClient.post('/hall/api/usr/v1/notification/read', {
    id,
  })

export const markAllNotificationsRead = () =>
  apiClient.post('/hall/api/usr/v1/notification/read-all')

export const deleteNotification = (id: number) =>
  apiClient.post('/hall/api/usr/v1/notification/delete', { id })

export const clearAllNotifications = () =>
  apiClient.post('/hall/api/usr/v1/notification/clear-all')

export const registerFcmToken = (token: string) =>
  apiClient.post('/hall/api/usr/v1/notification/fcm-token', { token })
