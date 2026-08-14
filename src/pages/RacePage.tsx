import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useAnimationControls } from 'framer-motion'
import clsx from 'clsx'
import { Button, Image, Input, ScrollShadow } from '@nextui-org/react'
import { useUIStore } from '../stores/uiStore'
import { useAppConfigStore } from '../stores/configStore'
import { getRaceGameInfo, getRaceRunnerFrames, createRaceOrder } from '../services/raceApi'
import type { RaceGameInfoDto, RaceRunnerFrameDto, RacePayRateDto, RaceTabDto, RaceOrderItemDto } from '../services/raceApi'
import { CURRENCY, defaultPayRate, getRaceStateColors, RaceRunner, parseRaceTop3 } from '../config/raceConstants'
import type { RaceDrawResult, RaceBetInfo } from '../config/raceConstants'
import { formatCurrency } from '../utils/format'
import { debounce, withLoading } from '../utils/helpers'
import { toast } from '../utils/toast'
import { checkInsufficientBalance } from '../utils/balanceCheck'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { useGoBack } from '../hooks/useGoBack'
import { useGameRound } from '../hooks/useGameRound'
import { RaceTrack } from '../components/race/RaceTrack'
import { RaceGameTimer } from '../components/race/GameTimer'
import { RaceBettingPanel } from '../components/race/BettingPanel'
import { RaceBetSlipItem } from '../components/race/BetSlipItem'
import { RaceDrawHistory, RaceOrderHistory } from '../components/race/GameHistory'
import { WinnerDisplay } from '../components/race/WinnerDisplay'
import { GameModeSelector } from '../components/race/GameModeSelector'
import { TopBar } from '../components/shared/TopBar'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { BalanceDisplay } from '../components/shared/BalanceDisplay'
import { GameTabSelector } from '../components/shared/GameTabSelector'
import { BetSlipBar, BetSlipBarRef } from '../components/shared/BetSlipBar'
import { SnackBar, SnackBarRef } from '../components/shared/SnackBar'
import { FlyingBallAnimation } from '../components/shared/FlyingBallAnimation'
import { useGameRulesModal } from '../components/shared/GameRules'
import { RulesIcon } from '../components/shared/RulesIcon'

interface RaceBetSlip {
  state: number
  no: number[]
  orderType: number
  amount: number
}

export const RacePageComponent = () => {
  const [searchParams] = useSearchParams()
  const params = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { statusBarHeight, rem } = useUIStore()
  const betAmountPresets = useAppConfigStore((s) => s.betAmountPresets)
  const [loading, setLoading] = useState(false)
  const [canBetting, setCanBetting] = useState(true)
  const [gameId, setGameId] = useState(Number(params.id ?? '0') || 0)
  const gameIdRef = useRef(gameId)
  const { round, result, serverOffset } = useGameRound(gameId)
  const lastResultRoundRef = useRef<string | null>(null)
  const appliedResultRoundRef = useRef<string | null>(null)
  const pendingResultRef = useRef<{ roundNo: string; gameInfo: RaceGameInfoDto | null; prize: number } | null>(null)
  const revealDoneRoundRef = useRef<string | null>(null)
  const lastRoundRef = useRef<string | null>(null)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)

  useEffect(() => { gameIdRef.current = gameId }, [gameId])

  const { render: rulesRender, show: showRules } = useGameRulesModal(gameId)

  const [runnerCount, setRunnerCount] = useState(Number(searchParams.get('runnerCount') ?? '6') || 6)
  const runnerCountList = useMemo(() => [...new Array(runnerCount).keys()].map((i) => i + 1), [runnerCount])
  const [isSingle, setIsSingle] = useState(runnerCount === 6)
  const [gameInfo, setGameInfo] = useState<RaceGameInfoDto>()

  useEffect(() => { setIsSingle(runnerCount === 6) }, [runnerCount])

  const [activeTab, setActiveTab] = useState('history')
  const [orderNum, setOrderNum] = useState(0)
  const [updateCode, setUpdateCode] = useState(1)
  const lastRoundNoRef = useRef<string | null>(null)
  const overlayControls = useAnimationControls()
  const translateControls = useAnimationControls()
  const spacerControls = useAnimationControls()
  const [frameList, setFrameList] = useState<RaceRunnerFrameDto[]>([])
  const winnersRef = useRef<number[]>([])
  const [winnerList, setWinnerList] = useState<number[]>([])
  const [prize, setPrize] = useState<number | undefined>()
  const snackBarRef = useRef<SnackBarRef>(null)
  const betSlipRef = useRef<BetSlipBarRef>(null)
  const [customBet, setCustomBet] = useState('')
  const [betAmount, setBetAmount] = useState(10)

  const gameTypeMap = useMemo<Record<number, number>>(() => {
    const rates: RacePayRateDto[] = gameInfo?.payRate?.length ? gameInfo.payRate : defaultPayRate
    return rates.reduce<Record<number, number>>((acc, item) => {
      acc[item.type] = item.odds
      return acc
    }, {})
  }, [gameInfo])

  const raceRunners = useMemo<RaceRunner[] | null>(
    () => (Array.isArray(gameInfo?.raceRunners) ? gameInfo.raceRunners : null),
    [gameInfo]
  )
  const stateColorsDyn = useMemo(() => getRaceStateColors(runnerCount, raceRunners), [runnerCount, raceRunners])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [betSlips, setBetSlips] = useState<RaceBetSlip[]>([])
  const totalAmount = useMemo(() => betSlips.reduce((sum, slip) => sum + slip.amount, 0), [betSlips])

  const loadGameInfo = (id: number = gameId): Promise<RaceGameInfoDto | undefined> => {
    if (!id) return Promise.resolve(undefined)
    lastFetchAt.current = Date.now()
    return withLoading(setLoading, getRaceGameInfo(id).then((data) => {
      setGameInfo(data)
      if (data.runnerCount) setRunnerCount(data.runnerCount)
      setPrize(() => data.lastPrize || 0)
      if (data.lastPrize) fetchAndSyncBalance()
      if (data.roundNo !== lastRoundNoRef.current) {
        lastRoundNoRef.current = data.roundNo
        setUpdateCode((prev) => prev + 1)
      }
      return data
    }))
  }

  const fetchGameInfo = debounce((id: number = gameId) => { loadGameInfo(id) }, 500)

  const toggleTrackPosition = (show = true) => {
    translateControls.start({ transform: `translate(0, ${show ? -statusBarHeight - 21.25 * rem : 0}px)` }, { ease: 'easeOut' })
    spacerControls.start({ height: show ? '18rem' : '0rem' }, { ease: 'easeOut' })
  }

  const toggleOverlay = (show = true) => {
    overlayControls.start({
      background: show ? '#0000' : '#0003',
      backdropFilter: show ? 'blur(0)' : 'blur(4px)',
    }, { ease: 'easeOut' })
  }

  const [isRacing, setIsRacing] = useState(false)

  useEffect(() => {
    if (!gameInfo) { toggleOverlay(false); return }
    if (canBetting) { setFrameList([]); toggleTrackPosition(false); toggleOverlay(false); setIsRacing(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBetting])

  const [isBonus, setIsBonus] = useState(false)
  const goBack = useGoBack()

  useEffect(() => {
    if (!gameId) { goBack(); return }
    setIsBonus(!!searchParams.get('isBonus'))
    fetchGameInfo()
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') snackBarRef.current?.hide()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRaceStart = () => {
    if (document.visibilityState !== 'visible') return
    setLoading(true)
    getRaceRunnerFrames(gameId).then((data) => {
      toggleTrackPosition()
      toggleOverlay()
      snackBarRef.current?.show()
      setFrameList(data)
    }).finally(() => setLoading(false))
  }

  const showWinnersFromResult = (drawResult: RaceDrawResult, lastPrize?: number) => {
    const top3 = drawResult.top3 ? parseRaceTop3(drawResult.top3) : []
    if (top3.length !== 3) return
    winnersRef.current = top3
    setWinnerList(() => top3)
    setPrize(() => lastPrize)
  }

  const applyResultPayload = (payload: { roundNo: string; gameInfo: RaceGameInfoDto | null; prize: number }) => {
    if (payload.roundNo === appliedResultRoundRef.current) return
    appliedResultRoundRef.current = payload.roundNo
    if (payload.gameInfo) {
      setGameInfo(payload.gameInfo)
      if (payload.gameInfo.runnerCount) setRunnerCount(payload.gameInfo.runnerCount)
      if (payload.gameInfo.roundNo !== lastRoundNoRef.current) {
        lastRoundNoRef.current = payload.gameInfo.roundNo
      }
    }
    setUpdateCode((prev) => prev + 1)
    setPrize(() => payload.prize)
    if (payload.prize) fetchAndSyncBalance()
  }

  const stashOrApplyResult = (payload: { roundNo: string; gameInfo: RaceGameInfoDto | null; prize: number }) => {
    if (revealDoneRoundRef.current === payload.roundNo) {
      pendingResultRef.current = null
      applyResultPayload(payload)
    } else {
      pendingResultRef.current = payload
    }
  }

  const onRevealFinish = (roundNo: string | null) => {
    if (roundNo) revealDoneRoundRef.current = roundNo
    const pending = pendingResultRef.current
    if (pending && (!roundNo || pending.roundNo === roundNo)) {
      pendingResultRef.current = null
      applyResultPayload(pending)
    }
  }

  useEffect(() => {
    if (!result || !gameIdRef.current) return
    if (result.roundNo === lastResultRoundRef.current) return
    lastResultRoundRef.current = result.roundNo
    lastPushAt.current = Date.now()
    const pushedGameId = gameIdRef.current
    const pushedRoundNo = result.roundNo
    const pushedResult = result.result as RaceDrawResult | undefined
    if (!pushedResult) return
    showWinnersFromResult(pushedResult)
    let cancelled = false
    const resolvePrize = async () => {
      for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
        const data = await getRaceGameInfo(pushedGameId).catch(() => undefined)
        if (cancelled) return
        if (data?.lastResult?.roundNo === pushedRoundNo) {
          setPrize(() => data.lastPrize || 0)
          if (data.lastPrize) fetchAndSyncBalance()
          stashOrApplyResult({ roundNo: pushedRoundNo, gameInfo: data, prize: data.lastPrize || 0 })
          return
        }
        await new Promise((r) => setTimeout(r, 400))
      }
      if (!cancelled) {
        setPrize(() => 0)
        stashOrApplyResult({ roundNo: pushedRoundNo, gameInfo: null, prize: 0 })
      }
    }
    resolvePrize()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  useEffect(() => {
    if (!round || !gameIdRef.current) return
    setGameInfo((prev) => (prev ? { ...prev, roundNo: round.roundNo, status: round.status } : prev))
    if (round.roundNo === lastRoundRef.current) return
    lastRoundRef.current = round.roundNo
    lastPushAt.current = Date.now()
  }, [round])

  return (
    <div className="size-full overflow-hidden flex flex-col relative">
      <TopBar
        title={
          <GameModeSelector
            tabs={gameInfo?.tabs}
            count={runnerCount}
            value={gameId}
            onValueChange={(tab: RaceTabDto) => {
              setLoading(() => true)
              setGameId(() => tab.id)
              gameIdRef.current = tab.id
              setRunnerCount(() => tab.count)
              setIsSingle(() => tab.count === 6)
              setCanBetting(() => true)
              toggleTrackPosition(false)
              toggleOverlay(false)
              setFrameList([])
              fetchGameInfo(tab.id)
              navigate(`/games/race/${tab.id}?runnerCount=${tab.count}`, { replace: true })
            }}
          />
        }
        leftIconClassName="text-black!"
        background="#0000"
        boxShadow=""
        className="!absolute left-0 top-0"
        rightNode={
          <div className="flex items-center gap-2">
            <RulesIcon
              className="size-6 text-black cursor-pointer"
              onClick={showRules}
            />
            <BalanceDisplay
              isBonus={isBonus}
              className="text-black! [&_span.text-sec]:text-black!"
              hideBtn
              hideImg
            />
          </div>
        }
      />
      <Banner
        className="sticky h-0 left-0 top-[calc(var(--status-bar-height)+2.75rem)] z-30"
        containerClassName="bg-white/50 from-transparent! to-transparent! backdrop-blur-sm !bg-none"
      />
      <Spin loading={loading} className="size-full flex-col overflow-hidden relative">
        <div className="absolute left-0 top-0 size-full">
          <RaceTrack
            frameList={frameList}
            single={isSingle}
            runnerCountList={runnerCountList}
            onFinish={(winners: number[]) => { winnersRef.current = winners }}
          />
        </div>
        <motion.div animate={overlayControls} className="size-full overflow-hidden flex flex-col">
          {isRacing && (
            <Image
              src="/images/race/running-now.webp?v2"
              classNames={{
                wrapper: clsx('absolute! left-1/2 border-2 border-white rounded-2xl z-0! duration-200 -ml-40 size-80', isSingle ? 'top-30' : 'top-40'),
                img: 'size-full rounded-2xl z-0!',
              }}
            />
          )}
          <ScrollShadow className="flex-1 flex flex-col z-10" visibility="top" size={72}>
            <div className="shrink-0" style={{ height: statusBarHeight + 4.75 * rem }} />
            <motion.div className="p-3 relative" animate={translateControls}>
              <RaceGameTimer
                updateFrame={handleRaceStart}
                canBetting={canBetting}
                setCanBetting={setCanBetting}
                gameInfo={gameInfo}
                updateInfo={() => {
                  if (Date.now() - lastPushAt.current < 5000) return
                  if (Date.now() - lastFetchAt.current < 5000) return
                  fetchGameInfo()
                }}
                single={isSingle}
                raceRunners={raceRunners}
                drawTime={round?.drawTime}
                serverOffset={serverOffset}
              />
            </motion.div>
            <motion.div className="shrink-0 duration-300 pointer-events-none" animate={spacerControls} />
            <div className="brand-panel-wash dark:bg-light-gray rounded-t-xl">
              <RaceBettingPanel
                gameTypeMap={gameTypeMap}
                canBetting={canBetting}
                single={isSingle}
                runnerCountList={runnerCountList}
                gameInfo={gameInfo}
                raceRunners={raceRunners}
                onAdd={(state: number, no: number[], orderType: number, sourceEl: HTMLElement | null) => {
                  if (sourceEl && betSlipRef.current?.shopCarImg.current) {
                    FlyingBallAnimation.start({
                      startWith: sourceEl,
                      endWith: betSlipRef.current.shopCarImg.current,
                    })
                  }
                  setBetSlips((prev) => {
                    prev.push({ state, no, orderType, amount: betAmount || parseInt(customBet, 10) })
                    return [...prev]
                  })
                }}
              />
              <div className="px-2 pb-2">
                <GameTabSelector
                  className="sticky top-18.5 z-30"
                  value={activeTab}
                  setValue={setActiveTab}
                  orderNum={orderNum}
                  setOrderNum={setOrderNum}
                />
                <div className="shrink-0" style={{ height: `calc(100dvh - ${statusBarHeight + 6 * rem}px)` }}>
                  {activeTab === 'history' && gameId && <RaceDrawHistory single={isSingle} gameID={gameId} updateCode={updateCode} raceRunners={raceRunners} />}
                  {activeTab === 'order' && gameId && <RaceOrderHistory gameID={gameId} updateCode={updateCode} raceRunners={raceRunners} />}
                </div>
              </div>
            </div>
          </ScrollShadow>
        </motion.div>
        <div className="sticky w-full bottom-0 left-0 z-50">
          <div className="relative flex items-center px-3 py-2 bg-white border-b border-b-gray dark:bg-charcoal z-10">
            <span className="mr-3 text-xs">{t('common.label.bet')}</span>
            <div className="flex-1 grid gap-2 grid-cols-4">
              {betAmountPresets.map((amount) => (
                <Button
                  key={amount}
                  className={clsx('rounded-sm font-bold h-7', betAmount === amount ? 'bg-primary text-black' : 'bg-selected text-main')}
                  onPress={() => { setBetAmount(amount); setCustomBet('') }}
                >
                  {formatCurrency(amount, 0)}
                </Button>
              ))}
            </div>
            <Input
              className="h-7 w-20 bg-white rounded-sm border border-primary text-primary ml-2"
              classNames={{
                inputWrapper: 'min-h-0! flex px-1 items-center justify-center',
                input: 'text-xs font-bold ps-0!',
              }}
              startContent={<p className="text-xs">{customBet ? CURRENCY : ''}</p>}
              placeholder={t('common.label.customer')}
              max={1000}
              min={10}
              value={customBet}
              onValueChange={(val: string) => {
                const digits = val.replace(/[^0-9]/g, '')
                if (digits) { setCustomBet(digits); setBetAmount(0) } else { setCustomBet(''); setBetAmount(10) }
              }}
            />
          </div>
        </div>
        <BetSlipBar
          hideShadow
          ref={betSlipRef}
          title={t('common.label.games.betSlip')}
          onClear={() => setBetSlips([])}
          price={formatCurrency(totalAmount)}
          quantity={betSlips.length}
          isLoading={isSubmitting}
          onConfirm={() => {
            if (!gameInfo) return
            if (!canBetting) {
              toast.warning(t('common.tip.warn.betClosed', { time: gameInfo?.stopBettingSec || 4 }))
              return
            }
            if (checkInsufficientBalance(totalAmount, `Race&Guess 1min${isBonus ? '_bonus' : ''}`, isBonus)) return

            const orders: RaceOrderItemDto[] = betSlips.map(({ orderType, state, no, amount }) => ({
              orderType,
              amount,
              betNum: orderType === 3 ? `${state + 1}` : no.join(','),
            }))
            withLoading(setIsSubmitting, createRaceOrder({ gameID: gameInfo.gameID, roundNo: gameInfo.roundNo, orders })).then(() => {
              toast.success(t('pay.tip.paysuccess'))
              setBetSlips([])
              if (activeTab !== 'order') setOrderNum((prev: number) => ++prev)
              setUpdateCode((prev: number) => ++prev)
              fetchAndSyncBalance()
              const stored = sessionStorage.getItem('race12-bet-info')
              const betInfo: RaceBetInfo = {
                roundNo: gameInfo.roundNo,
                list: orders.map((order) => ({ type: order.orderType, num: order.betNum })),
              }
              if (stored) {
                try {
                  const parsed = JSON.parse(stored) as RaceBetInfo
                  if (parsed && parsed.roundNo === betInfo.roundNo) betInfo.list = betInfo.list.concat(parsed.list)
                } catch (err) {
                  console.debug('RacePage: failed to parse stored race12-bet-info', err)
                }
              }
              sessionStorage.setItem('race12-bet-info', JSON.stringify(betInfo))
            })
          }}
        >
          <ScrollShadow>
            {betSlips.map((slip, idx) => (
              <RaceBetSlipItem
                key={idx}
                state={slip.state}
                no={slip.no}
                amount={slip.amount}
                single={isSingle}
                orderType={slip.orderType}
                odds={gameTypeMap[slip.orderType]}
                onDelete={() => setBetSlips((prev) => { prev.splice(idx, 1); return [...prev] })}
                updateAmount={(val: string) => setBetSlips((prev) => { prev[idx].amount = val === '' ? 0 : parseInt(val, 10); return [...prev] })}
              />
            ))}
          </ScrollShadow>
        </BetSlipBar>
      </Spin>
      <SnackBar ref={snackBarRef} />
      <WinnerDisplay
        single={isSingle}
        winnerList={winnerList}
        prize={prize}
        raceRunners={raceRunners}
        colors={stateColorsDyn}
        onFinish={() => { onRevealFinish(lastResultRoundRef.current); winnersRef.current = []; setWinnerList([]) }}
      />
      {rulesRender}
    </div>
  )
}

export default RacePageComponent
