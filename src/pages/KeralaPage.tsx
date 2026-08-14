import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, useDisclosure } from '@nextui-org/react'
import {
  getKeralaGameInfo,
  getKeralaRandomOrder,
  createKeralaOrder,
  getKeralaOrderCustom,
  KeralaGameInfo,
  KeralaTab,
} from '../services/keralaApi'
import { useAuthStore } from '../stores/authStore'
import { withLoading, checkAuth, debounce } from '../utils/helpers'
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
import { NumberPickerModal } from '../components/shared/NumberPickerModal'
import {
  KeralaGameHeader,
  KeralaInsuranceToggle,
  KeralaCustomInput,
  KeralaBetsList,
  KeralaPayBar,
  KeralaHistory,
  KeralaOrders,
} from '../components/kerala'

function parseParams(): Record<string, string> {
  const params: Record<string, string> = {}
  const entries = new URLSearchParams(location.href.split('?')[1]).entries()
  for (const [key, value] of entries) params[key] = value
  return params
}

export const KeralaPage = () => {
  const setAuthLoading = useAuthStore((s) => s.setLoading)
  const authLoading = useAuthStore((s) => s.loading)
  const [loading, setLoading] = useState(false)
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const [gameInfo, setGameInfo] = useState<KeralaGameInfo>()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [customCode, setCustomCode] = useState<string[]>([])
  const [betsList, setBetsList] = useState<string[]>([])
  const [tabKey, setTabKey] = useState('history')
  const [cycleTabKey, setCycleTabKey] = useState('')
  const { t } = useTranslation()
  const [orderNum, setOrderNum] = useState(0)
  const [refreshCode, setRefreshCode] = useState(0)
  const [historyVersion, setHistoryVersion] = useState(0)
  const keralaIDRef = useRef<number | undefined>(undefined)
  const gameCodeRef = useRef<string | undefined>(undefined)
  const prevRoundRef = useRef<string | number | undefined>(undefined)
  const { round, result, serverOffset } = useGameRound(gameInfo?.keralaID)
  const lastResultRoundRef = useRef<string | null>(null)
  const lastRoundRef = useRef<string | null>(null)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)
  const resultRefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isManual = !!gameInfo?.isManual

  const digitCount = useMemo(
    () => Number(gameInfo?.digitCount) || 6,
    [gameInfo],
  )

  const cycleOptions = useMemo(
    () =>
      isManual && Array.isArray(gameInfo?.tabs)
        ? gameInfo.tabs.map((tab) => ({
            title: formatDate(tab.drawTime, 'hh:mm'),
            key: tab.roundNo,
          }))
        : [],
    [isManual, gameInfo],
  )

  const activeRound = useMemo<KeralaTab | undefined>(() => {
    if (!isManual || !gameInfo?.tabs?.length) return undefined
    return (
      gameInfo.tabs.find((tab) => tab.roundNo === cycleTabKey) || gameInfo.tabs[0]
    )
  }, [isManual, gameInfo, cycleTabKey])

  const activeRoundNo = isManual ? activeRound?.roundNo : gameInfo?.roundNo

  const canBetting = useMemo(
    () => ((isManual ? activeRound?.status : gameInfo?.status) ?? 0) === 0,
    [isManual, activeRound, gameInfo],
  )

  const activeRoundDrawMs = useMemo(() => {
    if (!isManual || !activeRound) return undefined
    const ms = activeRound.drawTime
      ? new Date(activeRound.drawTime).getTime()
      : NaN
    if (Number.isFinite(ms) && ms > 0) return ms
    if (activeRound.drawTimeLess && activeRound.drawTimeLess > 0) {
      return Date.now() + activeRound.drawTimeLess * 1000
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManual, activeRound?.roundNo, activeRound?.drawTime, activeRound?.drawTimeLess])

  useEffect(() => {
    if (!isManual || !gameInfo?.tabs?.length) return
    if (!gameInfo.tabs.some((tab) => tab.roundNo === cycleTabKey)) {
      const firstOpen = gameInfo.tabs.find((tab) => tab.status === 0) || gameInfo.tabs[0]
      setCycleTabKey(firstOpen.roundNo)
    }
  }, [isManual, gameInfo, cycleTabKey])

  useEffect(() => {
    const params = parseParams()
    const { id = '', code = '' } = params
    if (!id || !code) {
      navigate('/', { replace: true })
      return
    }
    keralaIDRef.current = +id
    gameCodeRef.current = code
    fetchGameInfo(+id)
    fetchRandom(+id, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchGameInfo = (id = keralaIDRef.current, code = gameCodeRef.current) => {
    if (!id) return
    lastFetchAt.current = Date.now()
    withLoading(
      setLoading,
      getKeralaGameInfo(id, code || '').then((data) => {
        setGameInfo((prev) => {
          if (
            data &&
            prev &&
            lastResultRoundRef.current != null &&
            String(data.lastResult?.roundNo ?? '') === String(lastResultRoundRef.current)
          ) {
            return { ...data, lastCode: prev.lastCode }
          }
          return data
        })
        const round = data?.roundNo
        if (round && prevRoundRef.current && round !== prevRoundRef.current) {
          setHistoryVersion((v) => v + 1)
        }
        prevRoundRef.current = round
      }),
    )
  }

  const getRandomCodes = (id = keralaIDRef.current, count: number, code = gameCodeRef.current) =>
    getKeralaRandomOrder(id!, count, code || '')

  const fetchRandom = (id = keralaIDRef.current, count: number, code = gameCodeRef.current) => {
    getRandomCodes(id, count, code).then((data) => {
      setBetsList((prev) => [...prev, ...data])
    })
  }

  useEffect(() => {
    if (!result || !keralaIDRef.current) return
    if (result.roundNo === lastResultRoundRef.current) return
    lastResultRoundRef.current = result.roundNo
    lastPushAt.current = Date.now()
    const drawResult = result.result?.drawResult
    setGameInfo((prev) =>
      prev ? { ...prev, lastCode: String(drawResult ?? prev.lastCode ?? '') } : prev
    )
    const authed = checkAuth(false, false)
    if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current)
    resultRefetchTimer.current = setTimeout(() => {
      if (authed) fetchAndSyncBalance()
      setHistoryVersion((v) => v + 1)
    }, Math.floor(Math.random() * 2500))
  }, [result])

  useEffect(() => () => { if (resultRefetchTimer.current) clearTimeout(resultRefetchTimer.current) }, [])

  useEffect(() => {
    if (!round || !keralaIDRef.current) return
    setGameInfo((prev) => (prev ? { ...prev, status: round.status } : prev))
    if (isManual) return
    if (round.roundNo === lastRoundRef.current) return
    lastRoundRef.current = round.roundNo
    prevRoundRef.current = round.roundNo
    lastPushAt.current = Date.now()
    setGameInfo((prev) =>
      prev
        ? {
            ...prev,
            roundNo: round.roundNo,
            drawTimeSec: round.drawTime
              ? Math.floor(round.drawTime / 1000)
              : prev.drawTimeSec,
          }
        : prev
    )
  }, [round, isManual])

  const resetCustomCode = () => {
    setCustomCode(new Array(digitCount).fill('-'))
  }

  useEffect(() => {
    setCustomCode((prev) =>
      prev.length === digitCount ? prev : new Array(digitCount).fill('-'),
    )
  }, [digitCount])

  const deleteBet = (idx: number) => {
    const copy = [...betsList]
    copy.splice(idx, 1)
    setBetsList(copy)
  }

  const handleSubmit = debounce(async () => {
    if (useAuthStore.getState().loading) return
    if (!token) {
      checkAuth()
      return
    }
    if (!canBetting) {
      toast.warning(t('common.tip.warn.betUnable', { time: gameInfo?.stopSec || 10 }))
      return
    }
    const orderData = {
      keralaID: keralaIDRef.current,
      roundNo: activeRoundNo,
      codes: isInsurance ? insuranceBets : betsList,
    }
    const totalCost = gameInfo?.price
      ? (isInsurance ? insuranceBets.length : betsList.length) * gameInfo.price
      : 0
    if (checkInsufficientBalance(totalCost, `kerala_${keralaIDRef.current}_${activeRoundNo}`, false)) return

    withLoading(setAuthLoading, createKeralaOrder(orderData, gameCodeRef.current || '', isInsurance).then((res) => {
      if (res) {
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
        fetchAndSyncBalance()
        setBetsList([])
        resetCustomCode()
        setRefreshCode((c) => c + 1)
        if (tabKey !== 'order') setOrderNum((n) => n + 1)
        if (isInsurance) {
          setIsInsurance(false)
          fetchGameInfo(keralaIDRef.current)
        }
      }
    }))
  })

  const handleCustomAdd = async () => {
    try {
      setLoading(true)
      const fullCode = customCode.join('')
      if (fullCode.length === digitCount && !fullCode.includes('-')) {
        const valid = await getKeralaOrderCustom(keralaIDRef.current!, fullCode, gameCodeRef.current || '')
        if (valid) {
          const copy = [...betsList]
          copy.push(fullCode)
          setBetsList(copy)
          resetCustomCode()
        } else {
          toast.warning(t('common.tip.warn.numberSlod'))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const [isInsurance, setIsInsurance] = useState(false)
  const [insuranceBets, setInsuranceBets] = useState<string[]>([])

  if (gameInfo?.notStarted === true) {
    return (
      <div className="kerala size-full flex flex-col">
        <TopBarWrapper title={gameInfo?.gameName || 'Kerala'} />
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
    <div className="kerala size-full flex flex-col">
      <TopBarWrapper title={gameInfo?.gameName || 'Kerala'} />
      <Banner />
      <Spin loading={loading} className="flex-1 flex-col overflow-hidden">
        <div
          id="Kerala_Game_Container"
          className="flex flex-col flex-1 overflow-y-auto"
        >
          {isManual && cycleOptions.length > 1 && (
            <GameTimeTabs
              tabOptions={cycleOptions}
              selectedKey={cycleTabKey}
              itemClassName="h-9 flex-0 whitespace-nowrap"
              onSelectionChange={(key) => setCycleTabKey(key)}
              tabItemWrapClassName="*:not-last:mr-2 py-2 dark:pb-0"
            />
          )}

          <KeralaGameHeader
            info={
              isManual && activeRound
                ? {
                    ...gameInfo,
                    roundNo: activeRound.roundNo,
                    drawTimeSec: activeRoundDrawMs
                      ? Math.floor(activeRoundDrawMs / 1000)
                      : gameInfo?.drawTimeSec,
                  }
                : gameInfo
            }
            onTimeEnd={() => {
              if (Date.now() - lastPushAt.current < 5000) return
              if (Date.now() - lastFetchAt.current < 5000) return
              fetchGameInfo()
            }}
            drawTime={
              isManual
                ? activeRoundDrawMs
                : round?.drawTime ||
                  (gameInfo?.drawTimeSec ? gameInfo.drawTimeSec * 1000 : undefined)
            }
            serverOffset={isManual ? 0 : serverOffset}
          />

          <div className="p-2 pt-0 flex flex-col *:not-last:mb-2">
            <KeralaInsuranceToggle
              canInsurance={gameInfo?.canInsurance}
              isInsurance={isInsurance}
              setIsInsurance={(v) => {
                if (!v) return setIsInsurance(v)
                if (!keralaIDRef.current) return setIsInsurance(false)
                if (insuranceBets.length) return setIsInsurance(v)
                setLoading(true)
                getRandomCodes(keralaIDRef.current, 5)
                  .then((data) => {
                    setInsuranceBets(data)
                    setIsInsurance(v)
                  })
                  .catch(() => setIsInsurance(!v))
                  .finally(() => setLoading(false))
              }}
            />
            {!isInsurance && (
              <KeralaCustomInput
                onCustomAdd={handleCustomAdd}
                customCode={customCode}
                first={gameInfo?.prefix1st}
                onReset={resetCustomCode}
                onSelect={onOpen}
              />
            )}
            <KeralaBetsList
              isInsurance={isInsurance}
              onClear={() => setBetsList([])}
              betsList={isInsurance ? insuranceBets : betsList}
              onBets={(count) =>
                keralaIDRef.current && fetchRandom(keralaIDRef.current, count)
              }
              onDelItem={deleteBet}
            />
          </div>

          <div id="Kerala_Btn_Tab" />

          <TabList
            classNameBase="bg-white dark:bg-gray"
            fitTabContent={false}
            tabOptions={[
              {
                title: t('common.label.resultHistory'),
                key: 'history',
              },
              {
                title: orderNum ? (
                  <Badge
                    color="primary"
                    className="text-black! text-[10px]! border-none! size-3! min-h-auto! min-w-auto!"
                    content={orderNum + ''}
                  >
                    {t('common.label.games.myOrder')}
                  </Badge>
                ) : (
                  t('common.label.games.myOrder')
                ),
                key: 'order',
              },
            ]}
            selectedKey={tabKey}
            onSelectionChange={(key: string) => {
              setTabKey(key)
              if (key === 'order') setOrderNum(0)
            }}
          />

          <div style={{ minHeight: 'calc(100vh - 9.8rem)' }}>
            {gameInfo && (gameInfo.roundNo || activeRoundNo) && tabKey === 'history' && (
              <KeralaHistory
                gameID={gameInfo.keralaID}
                gameCode={gameCodeRef.current}
                version={historyVersion}
              />
            )}
            {gameInfo && (gameInfo.roundNo || activeRoundNo) && tabKey === 'order' && (
              <KeralaOrders
                keralaID={gameInfo.keralaID}
                gameCode={gameCodeRef.current}
                refreshCode={refreshCode}
              />
            )}
          </div>
        </div>

        <KeralaPayBar
          onConfirm={handleSubmit}
          isLoading={authLoading}
          disabled={!canBetting}
          quantity={isInsurance ? insuranceBets.length : betsList.length}
          total={
            gameInfo?.price
              ? (isInsurance ? insuranceBets.length : betsList.length) *
                gameInfo.price
              : 0
          }
        />

        <NumberPickerModal
          length={digitCount}
          selectValue={customCode}
          onConfirm={setCustomCode}
          scopMap={{
            0: gameInfo?.prefix2ndList || [],
          }}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      </Spin>
    </div>
  )
}

export default KeralaPage
