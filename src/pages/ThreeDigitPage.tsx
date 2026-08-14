import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getThreeDigitGameInfo,
  getThreeDigitDrawHistory,
  createThreeDigitOrder,
  ThreeDigitGameInfo,
  ThreeDigitPickTime,
  ThreeDigitTab,
  ThreeDigitPickInfo,
  ThreeDigitLastDraw,
  ThreeDigitOrderTicket,
  ThreeDigitCurrentRound,
} from '../services/threeDigitApi'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency } from '../utils/format'
import { debounce, checkAuth, resolveAssetUrl } from '../utils/helpers'
import { toast } from '../utils/toast'
import { checkInsufficientBalance } from '../utils/balanceCheck'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { formatDate } from '../utils/date'
import { useGameRound } from '../hooks/useGameRound'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { TabList } from '../components/shared/TabList'
import { GameTimeTabs } from '../components/shared/GameTimeTabs'
import { BetSlipBar, BetSlipBarRef } from '../components/shared/BetSlipBar'
import { BetSlipChip } from '../components/shared/BetSlipChip'
import { NoData } from '../components/shared/NoData'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { FlyingBallAnimation } from '../components/shared/FlyingBallAnimation'

import { ThreeDigitGameTimer } from '../components/three_digit/ThreeDigitGameTimer'
import { ThreeDigitBettingPanel } from '../components/three_digit/ThreeDigitBettingPanel'
import { ThreeDigitHistory } from '../components/three_digit/ThreeDigitHistory'
import { ThreeDigitOrders } from '../components/three_digit/ThreeDigitOrders'
import { useGameRulesModal } from '../components/shared/GameRules'
import { boxPermutation } from '../components/four_five_digit/DigitPicker'
import { PositionConfigProvider } from '../config/positionConfig'
import {
  SlatProductView,
  SlatMatchMode,
  isSlatProductActive,
  slatPanelLevel,
  slatPanelGroups,
  slatFindTier,
  slatTopTier,
  slatWinPrize,
} from '../config/slatConstants'

interface CartItem {
  level: number
  type: string
  value: string
  count: number
  basePrice: number
  pickInfoId?: number
  slatProductId?: number
  slatBetType?: string
  slatPositions?: number[]
}

export const ThreeDigitPage = () => {
  const [selectedTime, setSelectedTime] = useState('')
  const setGlobalLoading = useAuthStore((s) => s.setLoading)
  const [loading, setLoading] = useState(false)
  const token = useAuthStore((s) => s.token)
  const [normalInfo, setNormalInfo] = useState<ThreeDigitGameInfo>()
  const [pickTimes, setPickTimes] = useState<ThreeDigitPickTime[]>([])
  const [isManual, setIsManual] = useState(false)
  const [lastDraw, setLastDraw] = useState<ThreeDigitLastDraw>()
  const [canBetting, setCanBetting] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [tabKey, setTabKey] = useState('history')
  const [refreshCode, setRefreshCode] = useState(0)
  const refreshRef = useRef(0)
  const [isClearing, setIsClearing] = useState(false)
  const { t } = useTranslation()

  const gameIdRef = useRef('')
  const rulesModal = useGameRulesModal(Number(gameIdRef.current))
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingTimeRef = useRef('0')
  const betSlipRef = useRef<BetSlipBarRef>(null)

  const warnedRef = useRef(false)
  const secondsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const [searchParams] = useSearchParams()
  const [isBonus] = useState(!!searchParams.get('isBonus'))
  const [isQuick] = useState(searchParams.get('pickGameType') === 'quick')
  const [quickTabs, setQuickTabs] = useState<ThreeDigitTab[]>([])
  const [activeQuickId, setActiveQuickId] = useState(searchParams.get('id') || '')
  const activeGameId = Number(activeQuickId) || Number(searchParams.get('id')) || undefined
  const { round, result, serverOffset } = useGameRound(activeGameId)
  const lastResultRoundRef = useRef<string | null>(null)
  const lastRoundRef = useRef<string | null>(null)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)
  const resultRefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleTimeEnd = () => {
    if (isClearing) {
      setCart([])
    } else {
      setCart([])
      setSelectedTime(pendingTimeRef.current)
    }
  }

  useEffect(() => {
    const id = searchParams.get('id') || ''

    gameIdRef.current = id

    if (id) {
      startNormalTimer()
      fetchNormalInfo(id)
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNormalTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    secondsRef.current = 0
    intervalRef.current = setInterval(() => {
      secondsRef.current += 1
    }, 1000)
  }

  const fetchNormalInfo = (id: string) => {
    lastFetchAt.current = Date.now()
    debounce(() => {
      setLoading(true)
      secondsRef.current = 0
      getThreeDigitGameInfo(+id)
        .then((data) => {
          setNormalInfo(data)
          const manual = !!data.isManual
          setIsManual(manual)
          if (manual && Array.isArray(data.tabs) && data.tabs.length > 0) {
            const manualTimes: ThreeDigitPickTime[] = data.tabs.map((tab) => {
              const ms = tab.drawTime ? new Date(tab.drawTime).getTime() : 0
              return {
                roundNo: tab.roundNo,
                drawNo: tab.roundNo,
                drawTime: formatDate(tab.drawTime, 'hh:mm'),
                drawTimeLess: tab.drawTimeLess,
                drawTimeLong: tab.drawTimeLess,
                drawTimeSec: Number.isFinite(ms) && ms > 0 ? ms / 1000 : undefined,
                status: tab.status,
                drawResult: tab.drawResult,
              }
            })
            setQuickTabs([])
            setPickTimes(manualTimes)
            if (!manualTimes.some((mt) => mt.roundNo === selectedTime)) {
              const firstOpen = manualTimes.find((mt) => mt.status === 0) || manualTimes[0]
              setSelectedTime(firstOpen.roundNo)
            }
          } else {
            if (Array.isArray(data.tabs) && data.tabs.length > 0) {
              setQuickTabs(data.tabs)
            }
            setPickTimes(data.pickTimes || [])
            if (data.pickTimes && data.pickTimes.length > 0) {
              setSelectedTime(data.pickTimes[0].roundNo)
            } else if (data.roundNo) {
              setSelectedTime(data.roundNo)
            }
          }
          const lastResult = data.lastResult
          if (
            lastResult?.drawResult &&
            String(lastResult.roundNo ?? '') !== lastResultRoundRef.current
          ) {
            setLastDraw((prev) =>
              prev?.roundNo === lastResult.roundNo
                ? prev
                : {
                    roundNo: lastResult.roundNo,
                    drawNo: lastResult.roundNo,
                    drawResult: lastResult.drawResult,
                  }
            )
          }
        })
        .finally(() => setLoading(false))
    }, 0)()
  }

  const fetchLastDraw = async () => {
    try {
      setLoading(true)
      const data = await getThreeDigitDrawHistory(+gameIdRef.current, 1, 1)
      const row = data.drawResultList?.[0]
      if (String(row?.roundNo ?? '') !== lastResultRoundRef.current) {
        setLastDraw(row ?? {})
      }
    } finally {
      setLoading(false)
    }
  }

  const tabOptions = useMemo(
    () => pickTimes.map((t) => ({ timeId: t.roundNo, title: t.drawTime })),
    [pickTimes]
  )

  const currentGame = useMemo<ThreeDigitCurrentRound | undefined>(() => {
    if (tabOptions.length > 0) {
      return pickTimes.find((t) => t.roundNo === selectedTime) || pickTimes[0]
    }
    return normalInfo
  }, [selectedTime, pickTimes, tabOptions, normalInfo])

  useEffect(() => {
    if (isManual && (currentGame?.status === 1 || currentGame?.status === 2)) {
      setCanBetting(false)
    }
  }, [isManual, currentGame?.status])

  useEffect(() => {
    if (isQuick || quickTabs.length > 0) return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id') || ''
    const pName = params.get('pickName') || ''
    if (tabOptions.length) {
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?id=${id}&pickName=${pName}&cycle=0&pickGameType=normal${isBonus ? '&isBonus=true' : ''}`
      )
    }
  }, [selectedTime, tabOptions, isBonus, isQuick, quickTabs.length])

  const pickInfos = useMemo<ThreeDigitPickInfo[]>(
    () => normalInfo?.pickInfos || [],
    [normalInfo]
  )

  const slatProducts = useMemo<SlatProductView[]>(
    () => (normalInfo?.slatProducts || []).filter(isSlatProductActive),
    [normalInfo]
  )

  const hasBetting = useMemo(
    () => pickInfos.length > 0 || slatProducts.length > 0,
    [pickInfos, slatProducts]
  )

  const { render: confirmRender, show: showConfirm } = ConfirmDialog({
    title: t(isClearing ? 'common.label.del' : 'common.label.confirmation'),
    subTitle: isClearing
      ? t('common.tip.confirm.clearNumbers')
      : (
          <p>
            {t('common.tip.confirm.changeBetsOne')}
            {'\n'}
            <span className="font-bold text-main uppercase">
              {currentGame?.drawTime}
            </span>{' '}
            {t('common.label.table.time').toLowerCase()}.
            {'\n'}
            {t('common.tip.confirm.changeBetsTwo')}
          </p>
        ),
    actionText: isClearing ? 'common.label.del' : 'common.label.confirm',
    cancelText: 'common.label.cancel',
    onConfirm: handleTimeEnd,
  })

  const addToCart = ({
    level,
    type,
    value,
    count,
    basePrice,
    pickInfoId,
    slatProductId,
    slatBetType,
    slatPositions,
  }: CartItem) => {
    if (type.length !== value.length) return
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.value === value &&
          c.type === type &&
          c.slatProductId === slatProductId
      )
      if (idx > -1) {
        return prev.map((c, i) =>
          i === idx ? { ...c, count: c.count + count } : c
        )
      }
      return [
        ...prev,
        {
          level,
          type,
          value,
          count,
          basePrice,
          pickInfoId,
          slatProductId,
          slatBetType,
          slatPositions,
        },
      ]
    })
  }

  const addBoxToCart = ({
    value,
    count,
    basePrice,
    pickInfoId,
  }: {
    value: string
    count: number
    basePrice: number
    pickInfoId?: number
  }) => {
    if (value.length === 3) {
      boxPermutation(value).map((perm) => {
        addToCart({
          value: perm,
          type: 'ABC',
          count,
          level: 3,
          basePrice,
          pickInfoId,
        })
      })
    }
  }

  const slatBetLabel = (product: SlatProductView, emittedLabel: string): string =>
    product.matchMode === SlatMatchMode.Ladder
      ? slatTopTier(product)?.label ?? emittedLabel
      : emittedLabel

  const addSlatToCart = (
    product: SlatProductView,
    emittedLabel: string,
    value: string,
    count: number
  ) => {
    const label = slatBetLabel(product, emittedLabel)
    const tier = slatFindTier(product, label)
    addToCart({
      level: slatPanelLevel(product),
      type: emittedLabel,
      value,
      count,
      basePrice: product.price,
      slatProductId: product.id,
      slatBetType: label,
      slatPositions: tier?.positions ?? [],
    })
  }

  const addSlatBoxToCart = (
    product: SlatProductView,
    value: string,
    count: number
  ) => {
    const top = slatTopTier(product)
    if (!top) return
    boxPermutation(value).forEach((perm) =>
      addSlatToCart(product, top.label, perm, count)
    )
  }

  useEffect(() => {
    if (!canBetting && !warnedRef.current) {
      warnedRef.current = true
      toast.show({
        icon: 'warning',
        message: t('common.tip.warn.betUnable', {
          time: currentGame?.stopBetSec || 10,
        }),
      })
    }
  }, [canBetting, currentGame, t])

  const buildTickets = (): ThreeDigitOrderTicket[] =>
    cart.map((c) =>
      c.slatProductId != null
        ? {
            level: c.slatBetType ?? c.type,
            index: c.slatBetType ?? c.type,
            number: c.value,
            count: c.count,
            slatProductId: c.slatProductId,
            positions: c.slatPositions ?? [],
          }
        : {
            level: c.level,
            index: c.type,
            number: c.value,
            count: c.count,
          }
    )

  const submitOrder = debounce(async (totalAmount: number) => {
    if (!canBetting) return
    if (!token) {
      checkAuth()
      return
    }
    if (
      checkInsufficientBalance(
        totalAmount,
        `three_digit_${gameIdRef.current}${isBonus ? '_bonus' : ''}`,
        isBonus
      )
    )
      return

    try {
      setGlobalLoading(true)
      let result
      if (currentGame) {
        result = await createThreeDigitOrder({
          gameID: +gameIdRef.current,
          roundNo: currentGame.roundNo ?? '',
          totalAmount,
          tickets: buildTickets(),
        })
      }

      if (result) {
        toast.show({
          icon: 'success',
          message: (
            <div className="max-w-62 flex flex-col items-center gap-y-3">
              <span className="text-xl text-white font-bold">
                {t('common.tip.success.paid')}
              </span>
              <span className="text-white text-sm text-center">
                {t('common.tip.info.paidSuc')}
              </span>
            </div>
          ),
        })
        refreshRef.current += 1
        setRefreshCode(refreshRef.current)
        fetchAndSyncBalance()
        setCart([])
      }
    } finally {
      setGlobalLoading(false)
    }
  }, 300)

  const handleTimeChange = (key: string) => {
    if (cart.length) {
      setIsClearing(false)
      requestAnimationFrame(() => {
        pendingTimeRef.current = key
        showConfirm()
      })
    } else {
      setSelectedTime(key)
    }
  }

  const showQuickTabs = useMemo(
    () => (isQuick || quickTabs.length > 0) && quickTabs.length > 0,
    [isQuick, quickTabs]
  )

  const quickTabGameId = (tab?: ThreeDigitTab): string =>
    String(tab?.pickThreeID ?? tab?.gameId ?? tab?.colorID ?? tab?.id ?? '')

  const quickTabCycle = (tab?: ThreeDigitTab): string =>
    String(tab?.cycle ?? '')

  const handleQuickTabChange = (gameId: string) => {
    if (!gameId || gameId === activeQuickId) return
    const tab = quickTabs.find((q) => quickTabGameId(q) === gameId)
    setActiveQuickId(gameId)
    gameIdRef.current = gameId
    setCart([])
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?id=${gameId}&cycle=${quickTabCycle(tab)}&pickGameType=quick${isBonus ? '&isBonus=true' : ''}`
    )
    fetchNormalInfo(gameId)
    fetchLastDraw()
    refreshRef.current += 1
    setRefreshCode(refreshRef.current)
  }

  const cartTotals = useMemo(() => {
    let total = 0
    let num = 0
    if (cart.length > 0) {
      cart.forEach((c) => {
        total += c.count * c.basePrice
        num += c.count
      })
    }
    return { total, num }
  }, [cart])

  const currentPickNo = useMemo(() => {
    if (tabOptions.length > 0 && selectedTime) {
      const match = tabOptions.find((o) => o.timeId === selectedTime)
      if (match) return match.timeId
    }
    return (
      selectedTime ||
      normalInfo?.drawNo ||
      normalInfo?.roundNo ||
      currentGame?.roundNo ||
      '-'
    )
  }, [selectedTime, tabOptions, normalInfo, currentGame])

  const onTimerEnd = () => {
    if (Date.now() - lastPushAt.current < 5000) return
    if (Date.now() - lastFetchAt.current < 5000) return
    fetchNormalInfo(gameIdRef.current)
    fetchLastDraw()
    refreshRef.current += 1
    setRefreshCode(refreshRef.current)
  }

  useEffect(() => {
    if (!result) return
    if (result.roundNo === lastResultRoundRef.current) return
    lastResultRoundRef.current = result.roundNo
    lastPushAt.current = Date.now()
    const drawResult = result.result?.drawResult ?? ''
    setLastDraw((prev) => ({ ...(prev ?? {}), roundNo: result.roundNo, drawNo: result.roundNo, drawResult }))
    const authed = checkAuth(false, false)
    if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current)
    resultRefetchTimer.current = setTimeout(() => {
      if (authed) fetchAndSyncBalance()
      refreshRef.current += 1
      setRefreshCode(refreshRef.current)
    }, Math.floor(Math.random() * 2500))
  }, [result])

  useEffect(() => () => { if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current) }, [])

  useEffect(() => {
    if (!round) return
    if (isManual) return
    setNormalInfo((prev) => (prev ? { ...prev, status: round.status } : prev))
    setPickTimes((prev) => (prev?.length ? prev.map((p) => ({ ...p, status: round.status })) : prev))
    if (round.roundNo === lastRoundRef.current) return
    lastRoundRef.current = round.roundNo
    lastPushAt.current = Date.now()
    secondsRef.current = 0
    setPickTimes((prev) => (prev?.length ? prev.map((p) => ({ ...p, roundNo: round.roundNo, drawNo: round.roundNo })) : prev))
    setSelectedTime(round.roundNo)
  }, [round, isManual])

  if (normalInfo?.notStarted === true) {
    return (
      <div className="size-full flex flex-col">
        <TopBarWrapper title={normalInfo?.gameName || '3 Digit Game'} isBonus={isBonus} />
        <Banner />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center bg-light-gray">
          {normalInfo?.icon && (
            <img
              src={resolveAssetUrl(normalInfo.icon)}
              alt=""
              className="size-20 object-contain"
            />
          )}
          <p className="text-base font-bold text-main">
            {t('common.label.games.notStarted')}
          </p>
          {normalInfo?.startDate && (
            <p className="text-sm text-sec">
              {t('common.label.games.startsOn', {
                date: formatDate(normalInfo.startDate, 'Mon dd, yyyy hh:mm'),
              })}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <PositionConfigProvider
      colors={normalInfo?.positionColors}
      gradients={normalInfo?.positionGradients}
      labels={normalInfo?.positionLabels}
    >
    <div className="size-full flex flex-col">
      <TopBarWrapper title={normalInfo?.gameName || '3 Digit Game'} isBonus={isBonus} />
      <Banner />
      <Spin
        loading={loading}
        dropClassName="z-60"
        className="pick-digit flex-1 flex flex-col overflow-y-auto bg-light-gray"
      >
        <div
          id="Digit_Game_Container"
          className="flex-1 flex flex-col overflow-y-auto"
        >

          {showQuickTabs ? (
            <GameTimeTabs
              tabOptions={quickTabs.map((tab) => ({
                title: (
                  <div className="din text-main text-xl flex items-center">
                    {quickTabCycle(tab)}
                    <span className="text-sec text-xs ml-2 capitalize">
                      {t('common.label.games.minutes')}
                    </span>
                  </div>
                ),
                key: quickTabGameId(tab),
              }))}
              selectedKey={activeQuickId}
              itemClassName="h-9 flex-0 whitespace-nowrap p-2"
              onSelectionChange={(key) => handleQuickTabChange(key)}
              className="pt-2"
              tabItemWrapClassName="*:not-last:mr-2 pb-2"
            />
          ) : (
            <GameTimeTabs
              tabOptions={
                tabOptions?.map((o) => ({
                  title: o.title,
                  key: o.timeId + '',
                })) || []
              }
              selectedKey={selectedTime}
              itemClassName="h-9 flex-0 whitespace-nowrap p-2"
              onSelectionChange={(key) => handleTimeChange(key)}
              className="pt-2"
              tabItemWrapClassName="*:not-last:mr-2 pb-2"
            />
          )}

          {isManual && currentGame?.status !== 0 ? (
            <div className="p-2 flex flex-col items-center">
              <span className="text-main text-sm font-bold">
                {currentGame?.status === 2
                  ? t('common.label.games.DRAWN')
                  : t('common.label.inProgress')}
              </span>
            </div>
          ) : (
            <ThreeDigitGameTimer
              onTimeEnd={onTimerEnd}
              onRule={rulesModal.open}
              onBetting={setCanBetting}
              onDrawStart={() => {}}
              gameIcon={normalInfo?.icon || currentGame?.icon}
              currentGame={currentGame}
              pickGameType={showQuickTabs ? 'quick' : 'normal'}
              cycle={
                showQuickTabs
                  ? Number(quickTabCycle(quickTabs.find((q) => quickTabGameId(q) === activeQuickId)))
                  : currentGame?.cycle
              }
              queryList={pickTimes}
              pickName={normalInfo?.gameName}
              drawResult={
                lastDraw?.drawResult ||
                '*'.repeat(
                  normalInfo?.positionLabels?.length ||
                    Number(normalInfo?.digitCount) ||
                    3
                )
              }
              pickNum={lastDraw?.roundNo != null ? String(lastDraw.roundNo) : '-'}
              countDown={
                Math.trunc(
                  currentGame?.drawTimeLong ?? normalInfo?.drawTimeLong ?? 0
                ) - secondsRef.current
              }
              tip={currentPickNo}
              drawTime={isManual ? undefined : round?.drawTime}
              infoDrawTime={
                (currentGame?.drawTimeSec ?? normalInfo?.drawTimeSec)
                  ? Number(currentGame?.drawTimeSec ?? normalInfo?.drawTimeSec) * 1000
                  : undefined
              }
              serverOffset={serverOffset}
            />
          )}

          <div className="p-2 flex flex-col *:not-last:mb-2">
            {slatProducts.length > 0
              ? slatProducts.map((product) => (
                  <ThreeDigitBettingPanel
                    key={product.id}
                    discount={isBonus}
                    canBetting={canBetting}
                    level={slatPanelLevel(product)}
                    title={product.title}
                    groups={slatPanelGroups(product)}
                    onAdd={(type, value, count, target) => {
                      if (target) {
                        FlyingBallAnimation.start({
                          startWith: target,
                          endWith: betSlipRef.current?.shopCarImg?.current || undefined,
                        })
                      }
                      addSlatToCart(product, type, value, count)
                    }}
                    handleBox={(value, count, target) => {
                      if (target) {
                        FlyingBallAnimation.start({
                          startWith: target,
                          endWith: betSlipRef.current?.shopCarImg?.current || undefined,
                        })
                      }
                      addSlatBoxToCart(product, value, count)
                    }}
                    winPrize={slatWinPrize(
                      product,
                      slatTopTier(product)?.label ?? ''
                    )}
                    payment={product.price}
                  />
                ))
              : pickInfos.map((info, idx) => (
                  <ThreeDigitBettingPanel
                    key={idx}
                    discount={isBonus}
                    canBetting={canBetting}
                    level={info.pickLevel}
                    onAdd={(type, value, count, target) => {
                      if (target) {
                        FlyingBallAnimation.start({
                          startWith: target,
                          endWith: betSlipRef.current?.shopCarImg?.current || undefined,
                        })
                      }
                      addToCart({
                        type,
                        value,
                        count,
                        level: info.pickLevel,
                        basePrice: info.pickAmount,
                        pickInfoId: info.pickInfoId,
                      })
                    }}
                    handleBox={(value, count, target) => {
                      if (target) {
                        FlyingBallAnimation.start({
                          startWith: target,
                          endWith: betSlipRef.current?.shopCarImg?.current || undefined,
                        })
                      }
                      addBoxToCart({
                        value,
                        count,
                        basePrice: info.pickAmount,
                        pickInfoId: info.pickInfoId,
                      })
                    }}
                    winPrize={
                      info.pickWinAmount[info.pickWinAmount.length - 1] || 0
                    }
                    payment={info.pickAmount}
                  />
                ))}
          </div>

          <div id="Digit_Btn_Tab" />

          {hasBetting && (
            <TabList
              classNameBase="sticky top-0 z-30 h-10 flex items-end min-h-10 pb-0"
              classNameCursor="bg-primary h-0.5!"
              classNameTab="h-full"
              fitTabContent={false}
              tabOptions={[
                {
                  title: t('common.label.resultHistory'),
                  key: 'history',
                },
                {
                  title: t('common.label.games.myOrder'),
                  key: 'order',
                },
              ]}
              selectedKey={tabKey}
              onSelectionChange={(key) => setTabKey(key)}
            />
          )}

          <div style={{ minHeight: 'calc(100vh - 9.8rem)' }}>
            {hasBetting && tabKey === 'history' && (
              <ThreeDigitHistory
                refreshCode={refreshCode}
                type="normal"
                pickThreeId={Number(gameIdRef.current)}
              />
            )}
            {hasBetting && tabKey === 'order' && (
              <ThreeDigitOrders
                refreshCode={refreshCode}
                type="normal"
                pickThreeId={Number(gameIdRef.current)}
                selectedRoundNo={isManual ? selectedTime : ''}
              />
            )}
          </div>
        </div>

        <BetSlipBar
          clearTip=""
          title={
            <p className="text-sm  font-bold">
              {t('common.label.games.myNumbers')}
            </p>
          }
          ref={betSlipRef}
          price={formatCurrency(cartTotals.total)}
          discountedPrice={undefined}
          quantity={cartTotals.num}
          isDisabled={cart.length === 0 || !canBetting}
          onClear={() => {
            if (cart.length !== 0) {
              setIsClearing(true)
              requestAnimationFrame(() => {
                showConfirm()
              })
            }
          }}
          onConfirm={() => {
            submitOrder(cartTotals.total)
          }}
        >
          <div className="flex flex-wrap gap-3">
            {cart.map((item, idx) => (
              <BetSlipChip
                key={idx}
                onClose={() => {
                  const next = [...cart]
                  next.splice(idx, 1)
                  setCart(next)
                }}
                type={item.type}
                digit={item.value}
                rate={item.count}
              />
            ))}
          </div>
          {cart.length === 0 && <NoData />}
        </BetSlipBar>
      </Spin>

      {confirmRender}

      {rulesModal.render}
    </div>
    </PositionConfigProvider>
  )
}

export default ThreeDigitPage
