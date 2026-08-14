import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow } from '@nextui-org/react'
import { getDubaiGameInfo, createDubaiOrder, DubaiGameInfo, DubaiTab } from '../services/dubaiApi'
import { formatCurrency } from '../utils/format'
import { checkAuth } from '../utils/helpers'
import { toast } from '../utils/toast'
import { checkInsufficientBalance } from '../utils/balanceCheck'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { dispatchPrizeNotification } from '../utils/prizeDispatch'
import { formatDate } from '../utils/date'
import { useGoBack } from '../hooks/useGoBack'
import { useGameRound } from '../hooks/useGameRound'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { GameTabSelector } from '../components/shared/GameTabSelector'
import { GameTimeTabs } from '../components/shared/GameTimeTabs'
import { BetSlipBar, BetSlipBarRef } from '../components/shared/BetSlipBar'
import { NoData } from '../components/shared/NoData'
import { FlyingBallAnimation } from '../components/shared/FlyingBallAnimation'
import { DubaiTimer } from '../components/dubai/DubaiTimer'
import { DubaiBetting, DubaiBetSlipItem } from '../components/dubai/DubaiBetting'
import { useGameRulesModal } from '../components/shared/GameRules'
import { DubaiHistory, DubaiOrder } from '../components/dubai/DubaiHistory'
import { DubaiAssetContext, DUBAI_DEFAULT_THEME_COLOR } from '../components/dubai/DubaiIcons'

interface BetItem {
  number: number
  multiple: number
}

export const DubaiPage = () => {
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const gameID = useRef(parseInt(searchParams.get('id') || '0'))
  const [isBonus] = useState(!!searchParams.get('isBonus'))
  const [loading, setLoading] = useState(true)
  const [gameInfo, setGameInfo] = useState<DubaiGameInfo>()
  const [canBetting, setCanBetting] = useState(true)
  const [betList, setBetList] = useState<BetItem[]>([])
  const [cycleTabKey, setCycleTabKey] = useState('')
  const goBack = useGoBack()

  const { round, result, serverOffset } = useGameRound(gameID.current || undefined)
  const { render: rulesRender, show: showRules } = useGameRulesModal(gameInfo?.gameID)

  const isManual = !!gameInfo?.isManual

  const cycleOptions = useMemo(
    () =>
      (gameInfo?.tabs || []).map((tab) => ({
        title: formatDate(tab.drawTime, 'hh:mm'),
        key: tab.roundNo,
      })),
    [gameInfo]
  )

  const currentRound = useMemo<DubaiTab | null>(() => {
    const tabs = gameInfo?.tabs || []
    if (!tabs.length) return null
    return tabs.find((tab) => tab.roundNo === cycleTabKey) || tabs[0]
  }, [gameInfo, cycleTabKey])

  useEffect(() => {
    if (isManual && (currentRound?.status === 1 || currentRound?.status === 2))
      setCanBetting(false)
  }, [isManual, currentRound?.status])

  const timerGameInfo = useMemo(() => {
    if (!gameInfo) return gameInfo
    if (!isManual || !currentRound) return gameInfo
    return { ...gameInfo, roundNo: currentRound.roundNo, lessSec: currentRound.drawTimeLess ?? 0 }
  }, [gameInfo, isManual, currentRound])

  const timerDrawTime = useMemo(() => {
    if (isManual && currentRound?.drawTime != null) {
      const ms = new Date(currentRound.drawTime).getTime()
      return Number.isFinite(ms) ? ms : undefined
    }
    return round?.drawTime
  }, [isManual, currentRound, round?.drawTime])

  const totalPrice = useMemo(
    () => formatCurrency(betList.reduce((sum, item) => sum + item.multiple * (gameInfo?.price || 0), 0)),
    [betList, gameInfo]
  )

  const themeColor = useMemo(
    () => gameInfo?.themeColor || DUBAI_DEFAULT_THEME_COLOR,
    [gameInfo]
  )

  const betSlipRef = useRef<BetSlipBarRef>(null)
  const gameInfoRef = useRef<DubaiGameInfo | null>(null)
  const lastResultRoundRef = useRef<string | null>(null)
  const lastResultAppliedRef = useRef<string | null>(null)
  const lastRoundRef = useRef<string | null>(null)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)
  const resultRefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchInfo = (showLoading = true): Promise<DubaiGameInfo> => {
    lastFetchAt.current = Date.now()
    const fetcher = showLoading
      ? (setLoading(true), getDubaiGameInfo(gameID.current).finally(() => setLoading(false)))
      : getDubaiGameInfo(gameID.current)

    return fetcher.then((data) => {
      gameInfoRef.current = data
      setGameInfo(data)
      setUpdateCode(c => c + 1)

      const lastRoundKey = String(data.lastResult?.roundNo ?? '')
      if (data.lastPrize && localStorage.getItem('last_check_dubai_result_' + data.gameID) !== lastRoundKey) {
        localStorage.setItem('last_check_dubai_result_' + data.gameID, lastRoundKey)
        setTimeout(() => {
          if (data.lastPrize != null) dispatchPrizeNotification(data.lastPrize, !isBonus)
          fetchAndSyncBalance()
        }, 2500)
      }

      return data
    })
  }

  const handleUpdateInfo = (showLoading = true): Promise<DubaiGameInfo | null> => {
    if (Date.now() - lastPushAt.current < 5000) {
      return Promise.resolve(gameInfoRef.current)
    }
    if (Date.now() - lastFetchAt.current < 5000) {
      return Promise.resolve(gameInfoRef.current)
    }
    return fetchInfo(showLoading)
  }

  const [tabKey, setTabKey] = useState('history')
  const [orderNum, setOrderNum] = useState(0)
  const [updateCode, setUpdateCode] = useState(1)

  useEffect(() => {
    if (!gameID.current) {
      goBack()
      return
    }
    fetchInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!result || !gameInfoRef.current) return
    if (result.roundNo === lastResultRoundRef.current) return
    lastResultRoundRef.current = result.roundNo
    lastPushAt.current = Date.now()
    const drawnRoundNo = result.roundNo
    const drawn = result.result?.number ?? result.result?.drawResult ?? ''
    const pendingLastResult = {
      roundNo: result.roundNo,
      drawResult: result.result?.drawResult ?? '',
      number: result.result?.number ?? null,
      drawTime: result.result?.drawTime ?? null,
    }
    const pendingPrize = result.result?.prize

    const applyLastResult = () => {
      if (lastResultAppliedRef.current === drawnRoundNo) return
      lastResultAppliedRef.current = drawnRoundNo
      setGameInfo((prev) =>
        prev
          ? {
              ...prev,
              lastResult: {
                ...pendingLastResult,
                drawTime: pendingLastResult.drawTime ?? prev.lastResult?.drawTime ?? null,
              },
              lastPrize: pendingPrize ?? prev.lastPrize ?? 0,
            }
          : prev
      )
      setUpdateCode(c => c + 1)
    }

    const onRevealDone = () => {
      window.removeEventListener('dubai-reveal-done', onRevealDone as EventListener)
      applyLastResult()
    }
    window.addEventListener('dubai-reveal-done', onRevealDone as EventListener)

    window.dispatchEvent(new CustomEvent('dubai-draw-result', { detail: drawn }))

    const lastKey = 'last_check_dubai_result_' + gameInfoRef.current.gameID
    const roundChanged = checkAuth(false, false) && localStorage.getItem(lastKey) !== result.roundNo
    if (roundChanged) localStorage.setItem(lastKey, result.roundNo)

    if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current)
    resultRefetchTimer.current = setTimeout(() => {
      window.removeEventListener('dubai-reveal-done', onRevealDone as EventListener)
      if (roundChanged) fetchAndSyncBalance()
      applyLastResult()
    }, 8000)

    return () => {
      window.removeEventListener('dubai-reveal-done', onRevealDone as EventListener)
    }
  }, [result])

  useEffect(() => () => { if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current) }, [])

  useEffect(() => {
    if (!round || !gameInfoRef.current) return
    if (gameInfoRef.current.isManual) return
    setGameInfo((prev) => (prev ? { ...prev, roundNo: round.roundNo, status: round.status } : prev))
    if (round.roundNo === lastRoundRef.current) return
    lastRoundRef.current = round.roundNo
    lastPushAt.current = Date.now()
  }, [round])

  useEffect(() => {
    const tabs = gameInfo?.tabs || []
    if (!tabs.length) return
    if (!tabs.some((tab) => tab.roundNo === cycleTabKey)) {
      const firstOpen = tabs.find((tab) => tab.status === 0) || tabs[0]
      setCycleTabKey(firstOpen.roundNo)
    }
  }, [gameInfo, cycleTabKey])

  const handleSelected = (event: { target: Element }, item: BetItem) => {

    FlyingBallAnimation.start({
      startWith: event.target,
      endWith: betSlipRef.current?.shopCarImg?.current || undefined,
    })

    setBetList(prev => {
      const idx = prev.findIndex(b => b.number === item.number)
      if (idx > -1) {
        return prev.filter((_, i) => i !== idx)
      }
      return [...prev, item]
    })
  }

  const handleConfirm = () => {
    if (!gameInfo || !checkAuth()) return

    const targetRoundNo = isManual ? currentRound?.roundNo : gameInfo.roundNo
    if (!targetRoundNo) {
      toast.warning(t('common.tip.warn.betUnable', { time: gameInfo?.stopBettingSec || 5 }))
      return
    }

    const unitPrice = gameInfo.price || 0
    const totalAmount = betList.reduce((sum, item) => sum + item.multiple * unitPrice, 0)
    if (checkInsufficientBalance(totalAmount, `${gameInfo.gameName}${isBonus ? '_bonus' : ''}`, isBonus)) return

    setLoading(true)
    createDubaiOrder(
      gameInfo.gameID,
      targetRoundNo,
      betList.map(item => ({
        number: item.number,
        amount: item.multiple * unitPrice,
      }))
    ).then(() => {
      setBetList([])
      toast.show({
        icon: 'success',
        message: (
          <div className="max-w-62 flex flex-col items-center gap-y-3">
            <span className="text-xl text-white font-bold">{t('common.tip.success.paid')}</span>
            <span className="text-white text-sm text-center">{t('common.tip.info.paidSuc')}</span>
          </div>
        ),
      })
      if (tabKey === 'order') {
        setUpdateCode(c => c + 1)
      } else {
        setOrderNum(c => c + 1)
      }
      fetchAndSyncBalance()
    }).finally(() => setLoading(false))
  }

  if (gameInfo?.notStarted === true) {
    return (
      <div className="size-full flex flex-col">
        <TopBarWrapper
          isBonus={isBonus}
          title={gameInfo?.gameName || searchParams.get('gameName') || 'Dubai Lottery'}
          titleAlignLeft
        />
        <Banner />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center bg-light-gray">
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
    <DubaiAssetContext.Provider value={gameInfo?.assetIcons ?? {}}>
    <div
      className="size-full overflow-hidden flex flex-col"
      style={{ '--dubai-theme-color': themeColor } as React.CSSProperties}
    >
      <TopBarWrapper
        isBonus={isBonus}
        title={gameInfo?.gameName || searchParams.get('gameName') || 'Dubai Lottery'}
        titleAlignLeft
      />
      <Banner />

      <Spin loading={loading} className="flex-1 flex-col overflow-hidden" dropClassName="z-65!">
        <div className="size-full overflow-y-auto">

          {isManual && cycleOptions.length > 1 && (
            <GameTimeTabs
              tabOptions={cycleOptions}
              selectedKey={cycleTabKey}
              itemClassName="h-9 flex-0 whitespace-nowrap"
              onSelectionChange={(key) => setCycleTabKey(key)}
              tabItemWrapClassName="*:not-last:mr-2 py-2 dark:pb-0"
            />
          )}

          <DubaiTimer
            themeColor={themeColor}
            gameInfo={timerGameInfo}
            updateInfo={handleUpdateInfo}
            setCanBetting={setCanBetting}
            drawTime={timerDrawTime}
            serverOffset={serverOffset}
            phaseLabel={
              isManual && currentRound && currentRound.status !== 0
                ? currentRound.status === 2
                  ? t('common.label.games.DRAWN')
                  : t('common.label.inProgress')
                : undefined
            }
          />

          <DubaiBetting
            gameInfo={gameInfo}
            betList={betList}
            selected={handleSelected}
            canBetting={canBetting}
            onRule={showRules}
          />
          {rulesRender}

          <GameTabSelector
            className="sticky top-0 z-30"
            value={tabKey}
            setValue={setTabKey}
            orderNum={orderNum}
            setOrderNum={setOrderNum}
          />
          <div style={{ height: 'calc(100vh - 11.125rem)' }}>
            {tabKey === 'history' && (
              <DubaiHistory
                gameID={gameID.current}
                gameType={gameInfo?.gameType}
                updateCode={updateCode}
              />
            )}
            {tabKey === 'order' && (
              <DubaiOrder
                gameID={gameID.current}
                updateCode={updateCode}
              />
            )}
          </div>

          <BetSlipBar
            price={totalPrice}
            ref={betSlipRef}
            quantity={betList.length}
            isDisabled={!canBetting}
            title={t('dubai.label.betSlip', { num: betList.length })}
            onConfirm={handleConfirm}
            onClear={() => setBetList([])}
          >
            <ScrollShadow
              className="size-full"
              style={{ '--dubai-theme-color': themeColor } as React.CSSProperties}
            >
              {betList.length === 0 ? (
                <NoData />
              ) : (
                betList.map((item, index) => (
                  <DubaiBetSlipItem
                    key={item.number}
                    item={item}
                    gameInfo={gameInfo}
                    onDelete={() => {
                      setBetList(prev => prev.filter((_, i) => i !== index))
                    }}
                    updateMutiple={(multiple: number) => {
                      setBetList(prev =>
                        prev.map(b => b.number === item.number ? { ...b, multiple } : b)
                      )
                    }}
                  />
                ))
              )}
            </ScrollShadow>
          </BetSlipBar>
        </div>
      </Spin>
    </div>
    </DubaiAssetContext.Provider>
  )
}

export default DubaiPage
