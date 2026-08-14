import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Ref } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow, Tabs, Tab } from '@nextui-org/react'
import { MonthPickerModal } from '../components/shared/MonthPickerModal'
import { apiPost } from '../services/api'
import { getColorOrderList } from '../services/colorApi'
import { getDiceOrderList } from '../services/diceApi'
import { getFourFiveDigitOrderList } from '../services/fourFiveDigitApi'
import { getRaceOrderList } from '../services/raceApi'
import { getDubaiOrderList } from '../services/dubaiApi'
import { withLoading } from '../utils/helpers'
import { TopBarWrapper as TopBar } from '../components/shared/TopBarWrapper'
import { Spin } from '../components/shared/Spin'
import { NoData } from '../components/shared/NoData'
import { OrderHeaderCard } from '../components/order_detail/OrderHeaderCard'
import { buildOrderRowProps } from '../components/order_detail/orderRowProps'
import { OrderRecord } from '../components/order_detail/orderDetailTypes'

interface OrderListResponse {
  content?: OrderRecord[]
  list?: OrderRecord[]
}

const GAME_TABS = [
  { name: '3Digits', code: '3digit' },
  { name: '4D & 5D', code: '45d' },
  { name: 'Kerala', code: 'kerala' },
  { name: 'Dubai', code: 'dubai' },
  { name: 'Color', code: 'color' },
  { name: 'Dice', code: 'dice' },
  { name: 'Run & Guess', code: 'race' },
]

const STATUS_TABS = [
  { title: 'ALL', value: 3 },
  { title: 'To Be Drawn', value: 0 },
  { title: 'Won', value: 1 },
  { title: 'No Win', value: 2 },
]

const fetchOrders = (gameCode: string, orderStatus: number, startDate: string, pageNo = 1, pageSize = 10): Promise<OrderListResponse> => {
  const params = { pageNo, size: pageSize, pageSize, orderStatus, yearMonth: startDate }
  switch (gameCode) {
    case 'color': return getColorOrderList(params) as unknown as Promise<OrderListResponse>
    case 'dice': return getDiceOrderList(params) as unknown as Promise<OrderListResponse>
    case '3digit': return apiPost<OrderListResponse>('/game/api/three_digit/v1/order/list', params)
    case '45d': return getFourFiveDigitOrderList(params) as unknown as Promise<OrderListResponse>
    case 'race': return getRaceOrderList(params) as unknown as Promise<OrderListResponse>
    case 'dubai': return getDubaiOrderList(params) as unknown as Promise<OrderListResponse>
    case 'kerala': return apiPost<OrderListResponse>('/game/api/kerala/v1/order/list', params)
    default: return apiPost<OrderListResponse>('/game/api/kerala/v1/order/list', params)
  }
}

const GAME_DETAIL_TYPE: Record<string, string> = {
  color: 'color', dice: 'dice', '3digit': 'digit',
  '45d': '45d', race: 'race', dubai: 'dubai', kerala: 'kerala',
}

export const MyBetsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isIndexEmbed = useMemo(() => pathname.indexOf('/index/') > -1, [pathname])
  const [searchParams] = [new URLSearchParams(window.location.search)]
  const initialTab = searchParams.get('tagcode') || GAME_TABS[0].code
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [gameCode, setGameCode] = useState(initialTab)
  const [orderStatus, setOrderStatus] = useState(3)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const scrollRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const saved = sessionStorage.getItem('my-bets-horizontal-scroll') ?? '0'
    el.scrollLeft = Number(saved)
    const handler = () => sessionStorage.setItem('my-bets-horizontal-scroll', String(el.scrollLeft))
    const wheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || e.deltaY === 0) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('scroll', handler)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('scroll', handler)
      el.removeEventListener('wheel', wheel)
    }
  }, [])

  const [month, setMonth] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const monthLabel = useMemo(() => (month ? month.split('-').reverse().join('/') : t('common.label.all')), [month, t])

  const loadOrders = useCallback((code: string, status: number, pageNum: number, replace = false) => {
    const setter = pageNum === 1 ? setLoading : setLoadingMore
    if (pageNum === 1) setLoadError(false)
    withLoading(setter, fetchOrders(code, status, month, pageNum, 10)
      .then((data) => {
        const content = data?.content || data?.list || []
        if (replace) setOrders(content)
        else setOrders((prev) => [...prev, ...content])
        setHasMore(content.length >= 10)
        setPage(pageNum)
      })
      .catch(() => {
        if (replace) setOrders([])
        setHasMore(false)
        setLoadError(true)
      }))
  }, [month])

  useEffect(() => {
    loadOrders(gameCode, orderStatus, 1, true)
  }, [gameCode, orderStatus, month, loadOrders])

  const handleOrderClick = (order: OrderRecord) => {
    const type = GAME_DETAIL_TYPE[gameCode] || gameCode
    const stored = type === 'kerala' ? { ...order, gameName: order.keralaName ?? order.gameName } : order
    localStorage.setItem('OrderDetails', JSON.stringify(stored))
    navigate(`/my-bets/detail?type=${type}`)
  }

  const handleTabChange = (code: string) => {
    setGameCode(code)
    setPage(1)
    navigate(`/my-bets?tagcode=${code}`, { replace: true })
  }

  return (
    <div className="size-full flex flex-col overflow-hidden bets">
      <TopBar hideBack={isIndexEmbed} title={t('common.label.games.myBets')} rightNodeType="service" />

      <div className="w-full bg-white dark:bg-gray flex items-center justify-between gap-1 px-1">
        <div className="flex-1 min-w-0">
          <Tabs
            aria-label="Options"
            radius="full"
            variant="underlined"
            selectedKey={String(orderStatus)}
            onSelectionChange={(key) => setOrderStatus(Number(key))}
            classNames={{
              cursor: 'w-5 h-0.5 bg-primary -bottom-1.5',
              tabList: 'gap-0 w-full h-11 relative rounded-none p-0',
            }}
          >
            {STATUS_TABS.map(s => (
              <Tab
                key={String(s.value)}
                className="px-2"
                title={
                  <span className={`text-sm ${orderStatus === s.value ? 'text-main font-bold' : 'text-sec'}`}>
                    {s.title}
                  </span>
                }
              />
            ))}
          </Tabs>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 shrink-0 pr-2 text-main text-xs font-bold"
        >
          <svg className="size-4 text-acc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
          </svg>
          {monthLabel}
          <svg className="size-3 text-acc" viewBox="0 0 8 12" fill="none">
            <path d="M1 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <MonthPickerModal
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        value={month}
        onConfirm={(m) => {
          setMonth(m)
          setPage(1)
        }}
      />

      <ScrollShadow
        ref={scrollRef as Ref<HTMLDivElement>}
        orientation="horizontal"
        className="w-full flex h-12 py-2 pl-2 not-dark:bg-[#f8f8f8]"
      >
        {GAME_TABS.map((tab, i) => (
          <div
            key={i}
            className={`rounded px-2 text-nowrap mr-2 leading-8 inline-block border-gray border text-xs ${
              gameCode === tab.code ? 'border-primary bg-white dark:bg-gray' : 'bg-white dark:bg-gray'
            }`}
            onClick={() => handleTabChange(tab.code)}
          >
            <span className={gameCode === tab.code ? 'text-primary font-bold' : 'text-sec'}>
              {tab.name}
            </span>
          </div>
        ))}
      </ScrollShadow>

      <Spin className="flex-1 flex flex-col min-h-0" loading={loading}>
        <ScrollShadow className="flex-1 min-h-0 p-2">
          {loadError && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-acc">
              <svg className="size-16 mb-4 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <p className="text-sm">{t('common.label.loadFailed', 'Failed to load')}</p>
            </div>
          ) : orders.length === 0 && !loading ? (
            <div className="h-72">
              <NoData />
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order, idx) => {
                const type = GAME_DETAIL_TYPE[gameCode] || gameCode
                return (
                  <OrderHeaderCard
                    key={order.orderGroup || order.orderNo || order.roundNo || `order-${idx}`}
                    {...buildOrderRowProps(type, order)}
                    onPress={() => handleOrderClick(order)}
                  />
                )
              })}

              {hasMore && (
                <div className="flex justify-center py-3">
                  <Button
                    size="sm"
                    isLoading={loadingMore}
                    className="text-xs text-primary bg-transparent font-bold"
                    onPress={() => loadOrders(gameCode, orderStatus, page + 1)}
                  >
                    {t('common.label.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollShadow>
      </Spin>
    </div>
  )
}

export default MyBetsPage
