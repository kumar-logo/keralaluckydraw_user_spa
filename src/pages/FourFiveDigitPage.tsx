import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Progress, Badge } from '@nextui-org/react'
import {
  getFourFiveDigitGameInfo,
  createFourFiveDigitOrder,
  FourFiveDigitGameInfo,
  FourFiveDigitTab,
} from '../services/fourFiveDigitApi'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency } from '../utils/format'
import { checkAuth, resolveAssetUrl } from '../utils/helpers'
import { toast } from '../utils/toast'
import { checkInsufficientBalance } from '../utils/balanceCheck'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { dispatchPrizeNotification } from '../utils/prizeDispatch'
import { formatDate } from '../utils/date'
import { FlyingBallAnimation } from '../components/shared/FlyingBallAnimation'
import { subscribeToClock } from '../hooks/useClock'
import { useGameRound } from '../hooks/useGameRound'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { TabList } from '../components/shared/TabList'
import { NoData } from '../components/shared/NoData'
import { GameTimeTabs } from '../components/shared/GameTimeTabs'
import { TicketCard as GameHeaderCard } from '../components/shared/TicketCard'
import { ScrollToTabButton } from '../components/shared/ScrollToTabButton'
import { useGameRulesModal } from '../components/shared/GameRules'
import { CountdownDisplay } from '../components/shared/CountdownDisplay'
import { BetSlipBar, BetSlipBarRef } from '../components/shared/BetSlipBar'
import { BetSlipChip } from '../components/shared/BetSlipChip'
import { ColorResult } from '../components/four_five_digit/ColorBall'
import { PositionConfigProvider } from '../config/positionConfig'
import { SectionWrapper } from '../components/four_five_digit/SectionWrapper'
import { DigitPicker } from '../components/four_five_digit/DigitPicker'
import { FourFiveDigitHistory, FourFiveDigitOrders } from '../components/four_five_digit/FourFiveDigitHistory'
import {
  FourFiveDigitDrawAnimation,
  FourFiveDigitDrawAnimationRef,
} from '../components/four_five_digit/FourFiveDigitDrawAnimation'
import {
  SlatProductView,
  isSlatProductActive,
  slatMatchString,
  slatTopTier,
  slatWinPrize,
} from '../config/slatConstants'

const DIGIT_SECTION_TITLE: Record<number, string> = {
  4: 'four',
  5: 'five',
}

interface BetEntry {
  level: number
  type: string
  value: string
  count: number
  basePrice: number
  pickInfoId?: number
  slatProductId?: number
  slatBetType?: string
  slatPositions?: number[]
  chipType?: string
}

interface CycleOption {
  title: React.ReactNode
  key: string
}

export const FourFiveDigitPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const token = useAuthStore((s) => s.token)

  const [gameID, setGameID] = useState(0)
  const [loading, setLoading] = useState(true)
  const [canBet, setCanBet] = useState(true)
  const [gameInfo, setGameInfo] = useState<FourFiveDigitGameInfo>()
  const [gameClosed, setGameClosed] = useState(false)
  const [cycleTabKey, setCycleTabKey] = useState('')
  const [cycleOptions, setCycleOptions] = useState<CycleOption[]>([])
  const [baseTabKey, setBaseTabKey] = useState('history')
  const [newOrderNum, setNewOrderNum] = useState(0)
  const [updateCode, setUpdateCode] = useState(1)
  const [betsList, setBetsList] = useState<BetEntry[]>([])
  const [counting, setCounting] = useState(false)
  const [initTime, setInitTime] = useState(0)
  const [remainSec, setRemainSec] = useState(0)

  const shopCarRef = useRef<BetSlipBarRef>(null)
  const digitDrawRef = useRef<FourFiveDigitDrawAnimationRef>(null)
  const defaultPrice = parseInt(searchParams.get('price') || '0')
  const rulesModal = useGameRulesModal(gameID)

  const { round, result, serverOffset } = useGameRound(gameID)
  const lastResultRoundRef = useRef<string | null>(null)
  const lastRoundRef = useRef<string | null>(null)
  const wasCountingRef = useRef(false)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)
  const resultRefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const currentRound = useMemo<FourFiveDigitTab>(() => {
    if (!gameInfo?.tabs?.length) return { drawTime: 0, roundNo: '--', drawTimeLess: 0 }
    return gameInfo.tabs.find((tab) => tab.roundNo === cycleTabKey) || gameInfo.tabs[0]
  }, [gameInfo, cycleTabKey])

  const remainTime = remainSec

  const remainValue = useMemo(() => {
    const s = Math.max(0, remainSec)
    return {
      days: String(Math.floor(s / 86400)).padStart(2, '0'),
      hours: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
      seconds: String(s % 60).padStart(2, '0'),
    }
  }, [remainSec])

  useEffect(() => {
    if (!round?.drawTime) setInitTime(currentRound.drawTimeLess || 0)
  }, [currentRound, round?.drawTime])

  useEffect(() => {
    if (!round?.drawTime) return
    setInitTime(Math.max(0, Math.round((round.drawTime - (Date.now() + (serverOffset || 0))) / 1000)))
  }, [round?.drawTime, serverOffset])

  useEffect(() => {
    if (currentRound?.status === 1 || currentRound?.status === 2) setCanBet(false)
  }, [currentRound?.status])

  useEffect(() => {
    return subscribeToClock(() => {
      const sseDeadline =
        typeof round?.drawTime === 'number' && round.drawTime > 0 ? round.drawTime : 0
      const infoMs = currentRound?.drawTime
        ? new Date(currentRound.drawTime).getTime()
        : 0
      const deadline = sseDeadline || (Number.isFinite(infoMs) ? infoMs : 0)
      const secs =
        deadline > 0
          ? Math.round((deadline - (Date.now() + (serverOffset || 0))) / 1000)
          : Math.max(0, Math.trunc(initTime))
      setRemainSec(Math.max(0, secs))
    })
  }, [round?.drawTime, serverOffset, initTime, currentRound])

  const [totalPrice, totalPriceNum] = useMemo(() => {
    const num = betsList.reduce((total, bet) => total + bet.basePrice * bet.count, 0)
    return [formatCurrency(num), num]
  }, [betsList])

  const slatProducts = useMemo<SlatProductView[]>(
    () => (gameInfo?.slatProducts || []).filter(isSlatProductActive),
    [gameInfo]
  )

  const fallbackPositionLabels = useMemo<string[]>(() => {
    const labels = gameInfo?.positionLabels || []
    return labels.length ? labels : ['A', 'B', 'C', 'D', 'E']
  }, [gameInfo])
  const pick5Match = useMemo(
    () => fallbackPositionLabels.slice(0, 5).join('') || 'ABCDE',
    [fallbackPositionLabels]
  )
  const pick4Match = useMemo(
    () => fallbackPositionLabels.slice(-4).join('') || 'BCDE',
    [fallbackPositionLabels]
  )

  const fetchInfo = (id: number = gameID) => {
    lastFetchAt.current = Date.now()
    setGameID(id)
    setLoading(true)
    getFourFiveDigitGameInfo(id)
      .then((data) => {
        if (data.notStarted === true) {
          setGameInfo(data)
          setCanBet(false)
          return
        }
        const tabs = data.tabs
        if (!tabs?.length) {
          setCanBet(false)
          setGameClosed(true)
          toast.warning(t('common.tip.warn.gameClosed', { gameName: data.gameName }))
          return
        }

        const lastResult = data.lastResult
        const alreadyRevealed =
          lastResult?.roundNo != null &&
          String(lastResult.roundNo) === lastResultRoundRef.current
        if (lastResult?.drawResult && !alreadyRevealed) {
          lastResultRoundRef.current =
            lastResult.roundNo != null ? String(lastResult.roundNo) : lastResultRoundRef.current
          digitDrawRef.current?.stop(
            lastResult.drawResult.split('').map(Number),
            () => dispatchPrizeNotification(data.lastPrize ?? 0)
          )
        }
        setGameInfo(data)
        setUpdateCode((prev) => prev + 1)
        setCycleOptions(
          tabs.map((tab) => ({
            title: data.isManual ? formatDate(tab.drawTime, 'hh:mm') : tab.drawTime,
            key: tab.roundNo,
          }))
        )
        if (!tabs.some((tab) => tab.roundNo === cycleTabKey)) {
          const firstOpen = tabs.find((tab) => tab.status === 0) || tabs[0]
          setCycleTabKey(firstOpen.roundNo)
        }
        fetchAndSyncBalance()
      })
      .finally(() => setLoading(false))
  }

  const deleteBetItemByIndex = (idx: number) => {
    const copy = [...betsList]
    copy.splice(idx, 1)
    setBetsList(copy)
  }

  const addBetItemList = (
    items: { value: string; count: number }[],
    target?: EventTarget
  ) => {
    if (target && shopCarRef.current?.shopCarImg?.current) {
      FlyingBallAnimation.start({
        startWith: target as HTMLElement,
        endWith: shopCarRef.current.shopCarImg.current,
      })
    }
    items.forEach((item) => {
      setBetsList((prev) => {
        const idx = prev.findIndex((entry) => entry.value === item.value)
        if (idx > -1) {
          return prev.map((entry, i) =>
            i === idx ? { ...entry, count: entry.count + item.count } : entry
          )
        }
        const is4 = item.value.length === 4
        return [
          ...prev,
          {
            level: item.value.length,
            type: is4 ? '1' : '2',
            value: item.value,
            count: item.count,
            basePrice: is4
              ? gameInfo?.pick4Price || defaultPrice
              : gameInfo?.pick5Price || defaultPrice * 2,
            pickInfoId: 1,
          },
        ]
      })
    })
  }

  const addSlatBetItems = (
    product: SlatProductView,
    items: { value: string; count: number }[],
    target?: EventTarget
  ) => {
    if (target && shopCarRef.current?.shopCarImg?.current) {
      FlyingBallAnimation.start({
        startWith: target as HTMLElement,
        endWith: shopCarRef.current.shopCarImg.current,
      })
    }
    const top = slatTopTier(product)
    if (!top) return
    const chipType = slatMatchString(product)
    items.forEach((item) => {
      setBetsList((prev) => {
        const idx = prev.findIndex(
          (entry) =>
            entry.value === item.value &&
            entry.slatProductId === product.id
        )
        if (idx > -1) {
          return prev.map((entry, i) =>
            i === idx ? { ...entry, count: entry.count + item.count } : entry
          )
        }
        return [
          ...prev,
          {
            level: product.digitCount,
            type: top.label,
            value: item.value,
            count: item.count,
            basePrice: product.price,
            slatProductId: product.id,
            slatBetType: top.label,
            slatPositions: top.positions,
            chipType,
          },
        ]
      })
    })
  }

  const onClearBetList = () => setBetsList([])

  const onBet = () => {
    if (!canBet) return
    if (!token) {
      checkAuth()
      return
    }
    if (checkInsufficientBalance(totalPriceNum, `state_${gameInfo?.gameName}`, false)) return

    setLoading(true)
    createFourFiveDigitOrder({
      gameID,
      roundNo: currentRound.roundNo,
      orders: betsList.map((entry) =>
        entry.slatProductId != null
          ? {
              count: entry.count,
              number: entry.value,
              type: entry.slatBetType ?? entry.type,
              slatProductId: entry.slatProductId,
              positions: entry.slatPositions ?? [],
            }
          : {
              count: entry.count,
              number: entry.value,
              type: parseInt(entry.type, 10),
            }
      ),
    })
      .then(() => {
        toast.show({
          icon: 'success',
          message: (
            <div className="max-w-62 flex flex-col items-center gap-y-3">
              <span className="text-xl text-white font-bold">{t('common.tip.success.paid')}</span>
              <span className="text-white text-sm text-center">{t('common.tip.info.paidSuc')}</span>
            </div>
          ),
        })
        if (baseTabKey === 'order') setUpdateCode((prev) => prev + 1)
        else setNewOrderNum((prev) => prev + 1)
        fetchAndSyncBalance()
        setBetsList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (baseTabKey === 'order' && checkAuth(false, false)) setNewOrderNum(0)
  }, [baseTabKey])

  useEffect(() => {
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return
    setGameID(id)
    const handler = () => {
      const visible = document.visibilityState === 'visible'
      if (!visible) setCounting(false)
      else fetchInfo(id)
    }
    document.addEventListener('visibilitychange', handler)

    fetchInfo(id)
    return () => document.removeEventListener('visibilitychange', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!counting || gameClosed) return
    if (remainSec > 0) {
      wasCountingRef.current = true
      const roundOpen = (currentRound?.status ?? gameInfo?.status ?? 0) === 0
      if (remainSec <= (gameInfo?.stopBettingSec || 10) || !roundOpen) setCanBet(false)
      else setCanBet(true)
      if (remainSec === 3) digitDrawRef.current?.start()
      return
    }
    if (!wasCountingRef.current) return
    wasCountingRef.current = false
    setCounting(false)
    if (Date.now() - lastPushAt.current < 5000) return
    if (Date.now() - lastFetchAt.current < 5000) return
    fetchInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainSec, counting, gameInfo, currentRound, gameClosed])

  useEffect(() => {
    if (!canBet && !gameClosed && gameInfo) {
      toast.warning(
        t('common.tip.warn.betUnable', { time: gameInfo?.stopBettingSec || 10 })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBet])

  useEffect(() => {
    if (initTime > 0) setCounting(true)
  }, [initTime])

  useEffect(() => {
    if (!result || gameClosed) return
    if (result.roundNo === lastResultRoundRef.current) return
    lastResultRoundRef.current = result.roundNo
    lastPushAt.current = Date.now()
    const drawResult = result.result?.drawResult
    const authed = checkAuth(false, false)
    if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current)
    const scheduleRefetch = () => {
      if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current)
      resultRefetchTimer.current = setTimeout(() => {
        if (authed) fetchAndSyncBalance()
        setUpdateCode((prev) => prev + 1)
      }, Math.floor(Math.random() * 2500))
    }
    if (drawResult) {
      digitDrawRef.current?.stop(
        String(drawResult).split('').map(Number),
        () => {
          setGameInfo((prev) =>
            prev ? { ...prev, lastResult: { ...(prev.lastResult ?? {}), drawResult, roundNo: result.roundNo } } : prev
          )
          scheduleRefetch()
        }
      )
    } else {
      scheduleRefetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  useEffect(() => () => { if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current) }, [])

  useEffect(() => {
    if (!round || gameClosed) return
    setGameInfo((prev) => {
      if (!prev) return prev
      const tabs = (prev.tabs ?? []).map((tab) =>
        tab.roundNo === round.roundNo ? { ...tab, status: round.status } : tab
      )
      return { ...prev, status: round.status, tabs }
    })
    if (gameInfo?.isManual) return
    if (round.roundNo === lastRoundRef.current) return
    const prevRoundNo = lastRoundRef.current
    lastRoundRef.current = round.roundNo
    lastPushAt.current = Date.now()
    const drawTimeLess = round.drawTime
      ? Math.max(1, Math.round((round.drawTime - (Date.now() + (serverOffset || 0))) / 1000))
      : 0
    setGameInfo((prev) => {
      if (!prev) return prev
      const prevTabs = prev.tabs ?? []
      const nextTab: FourFiveDigitTab = { ...(prevTabs[0] ?? { roundNo: round.roundNo }), roundNo: round.roundNo, drawTime: round.drawTime, drawTimeLess }
      return { ...prev, roundNo: round.roundNo, tabs: [nextTab, ...prevTabs.slice(1)] }
    })
    setCycleOptions((prev) =>
      prev.length ? [{ title: round.drawTime, key: round.roundNo }, ...prev.slice(1)] : prev
    )
    setCycleTabKey((prev) => (!prev || prev === prevRoundNo ? round.roundNo : prev))
  }, [round, serverOffset, gameInfo?.isManual, gameClosed])

  if (gameInfo?.notStarted === true) {
    return (
      <div className="size-full flex flex-col">
        <TopBarWrapper title={gameInfo?.gameName || '4 & 5 Digit Game'} />
        <Banner />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center bg-light-gray">
          {gameInfo?.icon && (
            <img
              src={resolveAssetUrl(gameInfo.icon)}
              alt=""
              className="size-20 object-contain"
            />
          )}
          <p className="text-base font-bold text-main">
            {t('common.label.games.notStarted')}
          </p>
          {gameInfo?.startDate && (
            <p className="text-sm text-sec">
              {t('common.label.games.startsOn', {
                date: formatDate(gameInfo.startDate, 'Mon dd, yyyy hh:mm'),
              })}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <PositionConfigProvider
      colors={gameInfo?.positionColors}
      gradients={gameInfo?.positionGradients}
      labels={gameInfo?.positionLabels}
    >
    <div className="size-full flex flex-col">
      <TopBarWrapper title={gameInfo?.gameName || '4 & 5 Digit Game'} />
      <Banner />

      <Spin
        loading={loading}
        dropClassName="z-60"
        className="flex-1 flex flex-col overflow-auto bg-light-gray"
      >
        <div
          id="MixDigit_Game_Container"
          className="flex-1 flex flex-col overflow-y-auto *:shrink-0"
        >

          {(gameInfo?.gameType === 0 || gameInfo?.isManual) && cycleOptions.length > 1 && (
            <GameTimeTabs
              tabOptions={cycleOptions}
              selectedKey={cycleTabKey}
              itemClassName="h-9 flex-0 whitespace-nowrap"
              onSelectionChange={(key) => setCycleTabKey(key)}
              tabItemWrapClassName="*:not-last:mr-2 py-2 dark:pb-0"
            />
          )}

          <GameHeaderCard
            className="flex flex-col"
            cardClassName="bg-[#e27b4c]"
            bgColor={isDarkMode ? 'var(--bg-color-gray)' : 'var(--bg-color-lightGray)'}
          >

            <div className="flex justify-between items-center">
              <div className="flex items-center flex-1">
                <img
                  className="size-12 rounded-none object-contain"
                  src={resolveAssetUrl(gameInfo?.icon)}
                  alt=""
                />
                <div className="ml-2">
                  <p className="text-sm text-white font-bold">
                    {gameInfo?.gameName || '4 & 5 Digit Game'}
                  </p>
                  <p className="text-xs text-white">
                    {t('common.label.games.LastDraw')}
                    <br />
                    <span className="font-bold text-white">
                      {gameInfo?.lastResult?.roundNo || '--'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="rounded-lg flex px-2 py-1 flex-col items-center gap-5 justify-center bg-white/10 border border-[#0003] gap-y-1">
                <p className="text-9 text-white">
                  {t('common.label.games.LastDrawResult')}
                </p>
                <div className="flex items-center gap-x-1">
                  <ColorResult
                    result={gameInfo?.lastResult?.drawResult || '-----'}
                  />
                </div>
              </div>
            </div>

            <div className="flex mt-3 gap-x-2">
              <div className="flex flex-1 flex-row bg-black/10 p-2 items-center justify-between">
                <div className="text-xs text-white">
                  <p>{t('common.label.games.nextDraw')}</p>
                  <p className="text-white">{currentRound?.roundNo || '--'}</p>
                </div>
                {currentRound?.status === 2 ? (
                  <span className="text-xs text-white font-bold">
                    {t('common.label.games.DRAWN')}
                  </span>
                ) : currentRound?.status === 1 ? (
                  <span className="text-xs text-white font-bold">
                    {t('common.label.inProgress')}
                  </span>
                ) : (
                  <CountdownDisplay
                    timeData={
                      remainValue as {
                        days: string
                        hours: string
                        minutes: string
                        seconds: string
                      }
                    }
                  />
                )}
              </div>
              <ScrollToTabButton
                triggleRules={rulesModal.open}
                pid="MixDigit_Game_Container"
                cid="MixDigit_Btn_Tab"
              />
            </div>
          </GameHeaderCard>

          {gameInfo?.gameType === 1 && (
            <Progress
              className="w-full h-1 game-progress-base"
              aria-label="progress"
              radius="none"
              value={remainTime}
              maxValue={currentRound.drawTimeLess || 120}
            />
          )}

          <div className="px-2 pb-2">

            {slatProducts.length > 0 ? (
              slatProducts.map((product, idx) => {
                const anchorId = `MixDigit${product.digitCount}Header_${product.id}`
                return (
                  <div key={product.id}>
                    <div id={anchorId} className={idx === 0 ? '' : 'mt-2'} />
                    <SectionWrapper
                      price={product.price}
                      prizeRender={
                        <span className="digit-prize">
                          {formatCurrency(
                            slatWinPrize(
                              product,
                              slatTopTier(product)?.label ?? ''
                            ),
                            0
                          )}
                        </span>
                      }
                      title={DIGIT_SECTION_TITLE[product.digitCount] || 'four'}
                    >
                      <DigitPicker
                        match={slatMatchString(product)}
                        canBetting={canBet}
                        onAdd={(items, target) =>
                          addSlatBetItems(product, items, target)
                        }
                        onFocus={() => {
                          document
                            .querySelector(`#${anchorId}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                      />
                    </SectionWrapper>
                  </div>
                )
              })
            ) : (
              <>
                <div id="MixDigit4Header" />
                <SectionWrapper
                  price={gameInfo?.pick4Price || defaultPrice}
                  prizeRender={
                    <span className="digit-prize">
                      {formatCurrency(gameInfo?.pick4Prize?.[0]?.prize ?? 0, 0)}
                    </span>
                  }
                  title="four"
                >
                  <DigitPicker
                    match={pick4Match}
                    canBetting={canBet}
                    onAdd={addBetItemList}
                    onFocus={() => {
                      document
                        .querySelector('#MixDigit4Header')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  />
                </SectionWrapper>

                <div id="MixDigit5Header" className="mt-2" />
                <SectionWrapper
                  price={gameInfo?.pick5Price || defaultPrice * 2}
                  prizeRender={
                    <span className="digit-prize">
                      {formatCurrency(gameInfo?.pick5Prize?.[0]?.prize ?? 0, 0)}
                    </span>
                  }
                  title="five"
                >
                  <DigitPicker
                    match={pick5Match}
                    canBetting={canBet}
                    onAdd={addBetItemList}
                    onFocus={() => {
                      document
                        .querySelector('#MixDigit5Header')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  />
                </SectionWrapper>
              </>
            )}
          </div>

          <div id="MixDigit_Btn_Tab" />

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
                title: newOrderNum ? (
                  <Badge
                    color="primary"
                    className="text-black! text-[10px]! border-none! size-3! min-h-auto! min-w-auto!"
                    content={newOrderNum}
                  >
                    {t('common.label.games.myOrder')}
                  </Badge>
                ) : (
                  t('common.label.games.myOrder')
                ),
                key: 'order',
              },
            ]}
            selectedKey={baseTabKey}
            onSelectionChange={(key: string) => setBaseTabKey(key)}
          />

          {!!gameID && (
            <div
              className="order-3"
              style={{ height: 'calc(100vh - 9.25rem)' }}
            >
              {baseTabKey === 'history' && (
                <FourFiveDigitHistory updateCode={updateCode} gameID={gameID} />
              )}
              {baseTabKey === 'order' && (
                <FourFiveDigitOrders updateCode={updateCode} gameID={gameID} />
              )}
            </div>
          )}

          <BetSlipBar
            title={
              <p className="text-sm font-bold">
                {t('common.label.games.myNumbers')}
              </p>
            }
            ref={shopCarRef}
            price={totalPrice}
            quantity={betsList.length}
            isDisabled={betsList.length === 0 || !canBet}
            onClear={onClearBetList}
            onConfirm={onBet}
            spacerClassName="order-3"
          >
            <div className="flex flex-wrap gap-3 pb-3">
              {betsList.map((item, idx) => (
                <BetSlipChip
                  key={idx}
                  onClose={() => deleteBetItemByIndex(idx)}
                  type={item.chipType ?? (item.type === '1' ? pick4Match : pick5Match)}
                  ballSize="1.25rem"
                  digit={item.value}
                  rate={item.count}
                />
              ))}
            </div>
            {betsList.length === 0 && <NoData />}
          </BetSlipBar>
        </div>
      </Spin>

      <FourFiveDigitDrawAnimation ref={digitDrawRef} />

      {rulesModal.render}
    </div>
    </PositionConfigProvider>
  )
}

export default FourFiveDigitPage
