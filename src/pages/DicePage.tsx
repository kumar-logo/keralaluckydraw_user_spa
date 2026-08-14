import { useState, useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@nextui-org/react'
import { getDiceGameInfo, getDiceDrawResult } from '../services/diceApi'
import type { DiceGameInfoDto, DiceTabDto, DiceOdds } from '../services/diceApi'
import { checkAuth } from '../utils/helpers'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { dispatchPrizeNotification } from '../utils/prizeDispatch'
import { useGoBack } from '../hooks/useGoBack'
import { useGameRound } from '../hooks/useGameRound'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { NavBarSpacer } from '../components/shared/NavBarSpacer'
import { TabList } from '../components/shared/TabList'
import { SubTab } from '../components/shared/SubTab'
import { GameTimeTabs } from '../components/shared/GameTimeTabs'
import { DiceTimer } from '../components/dice/DiceTimer'
import { useGameRulesModal } from '../components/shared/GameRules'
import { DiceBettingPanel } from '../components/dice/DiceBettingPanel'
import { DiceHistoryTab, DiceAnalyzeTab, DiceOrderTab } from '../components/dice/DiceHistory'

export const DicePage = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isBonus] = useState(!!searchParams.get('isBonus'))
  const goBack = useGoBack()

  const [tabs, setTabs] = useState<DiceTabDto[]>([])
  const [activeTabMin, setActiveTabMin] = useState<string>()
  const activeTabInfo = useMemo(() => tabs.find(o => o.tabMin + '' === activeTabMin), [activeTabMin, tabs])
  const [historyTabMin, setHistoryTabMin] = useState<string>()
  const [gameInfo, setGameInfo] = useState<DiceGameInfoDto>()
  const [loading, setLoading] = useState(false)
  const [innerLoading, setInnerLoading] = useState(false)
  const [canBetting, setCanBetting] = useState(true)
  const [odds, setOdds] = useState<DiceOdds>()
  const [tabKey, setTabKey] = useState('history')
  const [orderNum, setOrderNum] = useState(0)
  const [updateVersion, setUpdateVersion] = useState(0)

  const gameInfoRef = useRef<DiceGameInfoDto | null>(null)
  const { round, result, serverOffset } = useGameRound(gameInfo?.diceID)
  const { render: rulesRender, show: showRules } = useGameRulesModal(gameInfo?.diceID)
  const lastResultRoundRef = useRef<string | null>(null)
  const lastRoundRef = useRef<string | null>(null)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)

  const fetchInfo = (params: URLSearchParams = searchParams) => {
    const id = params.get('id')
    if (!id) { goBack(); return }
    lastFetchAt.current = Date.now()
    setUpdateVersion(v => v + 1)
    setLoading(true)
    getDiceGameInfo(id).then((data) => {
      if (!data?.tabs) return
      setTabs(data.tabs)
      const tab = data.tabs.find((e) => e.diceID + '' === id)
      const tabMin = ((tab?.tabMin) || data.tabs[0].tabMin) + ''
      setActiveTabMin(tabMin)
      if (!historyTabMin) setHistoryTabMin(tabMin)
      setGameInfo(data)
      gameInfoRef.current = data
      setOdds(data.odds)

      const lastKey = 'last_check_k3_result_' + data.diceID
      const lastChecked = localStorage.getItem(lastKey)
      if (checkAuth(false, false) && data.lastRoundNo && lastChecked !== data.lastRoundNo) {
        localStorage.setItem(lastKey, data.lastRoundNo)
        fetchAndSyncBalance()
        getDiceDrawResult(data.diceID, data.lastRoundNo).then((res) => {
          if (res.totalPrize) dispatchPrizeNotification(res.totalPrize, !isBonus)
        })
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') fetchInfo() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabMin])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInfo() }, [])

  const handleNextLottery = () => {
    const now = Date.now()
    if (now - lastPushAt.current < 5000) return
    if (now - lastFetchAt.current < 5000) return
    fetchInfo()
  }

  useEffect(() => {
    if (!result || !gameInfoRef.current) return
    if (result.roundNo === lastResultRoundRef.current) return
    lastResultRoundRef.current = result.roundNo
    lastPushAt.current = Date.now()
    fetchInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  useEffect(() => {
    if (!round || !gameInfoRef.current) return
    setGameInfo((prev) => (prev ? { ...prev, roundNo: round.roundNo, status: round.status } : prev))
    if (round.roundNo === lastRoundRef.current) return
    lastRoundRef.current = round.roundNo
    lastPushAt.current = Date.now()
  }, [round])

  useEffect(() => {
    if (!tabs.length) return
    const diceID = activeTabInfo?.diceID
    if (diceID && diceID !== gameInfo?.diceID) {
      const params = new URLSearchParams()
      params.set('id', diceID + '')
      if (isBonus) params.set('isBonus', 'true')
      setSearchParams(params, { replace: true })
      fetchInfo(params)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabMin])

  const handleBetting = (v: boolean) => setCanBetting(v)
  const handlePaidSuccess = () => {
    if (tabKey === 'order') setUpdateVersion(v => v + 1)
    else setOrderNum(v => v + 1)
  }
  const handleTabMinChange = (v: string) => {
    setActiveTabMin(v)
    setHistoryTabMin(v)
    setOrderNum(0)
  }
  const handleTabKeyChange = (v: string) => {
    setTabKey(v)
    if (v === 'order') setOrderNum(0)
  }

  const bottomTabs = useMemo(() => [
    { title: t('common.label.result'), key: 'history' },
    { title: t('common.label.games.analyze'), key: 'analyze' },
    {
      title: orderNum ? (
        <Badge
          color="primary"
          className="text-black! text-[10px]! border-none! size-3! min-h-auto! min-w-auto!"
          content={orderNum + ''}
        >
          {t('common.label.games.myOrder')}
        </Badge>
      ) : t('common.label.games.myOrder'),
      key: 'order',
    },
  ], [orderNum, t])

  const paletteStyle = useMemo(() => {
    const p: Record<string, string> = gameInfo?.palette || {}
    return Object.keys(p).reduce<Record<string, string>>((vars, key) => {
      vars[`--bg-k3-${key}`] = p[key]
      return vars
    }, {})
  }, [gameInfo])

  return (
    <div className="dice size-full flex flex-col bg-light-gray" style={paletteStyle as CSSProperties}>
      <TopBarWrapper title={t('k3.title.default')} isBonus={isBonus} />
      <Banner />

      <Spin loading={loading} className="flex-1 flex-col overflow-hidden">
        <div id="Dice_Game_Container" className="flex-1 flex flex-col overflow-y-auto">

          <GameTimeTabs
            tabOptions={tabs.map(o => ({
              title: (
                <div className="din text-main text-xl flex items-center">
                  {o.tabMin}
                  <span className="text-sec text-xs ml-2 capitalize">{t('common.label.games.minutes')}</span>
                </div>
              ),
              key: o.tabMin + '',
            }))}
            selectedKey={activeTabMin + ''}
            onSelectionChange={(v) => handleTabMinChange(v as string)}
            className="pt-2"
            tabItemWrapClassName="*:not-last:mr-2 pb-2"
          />

          <DiceTimer
            onNextLottery={handleNextLottery}
            onBetting={handleBetting}
            gameInfo={gameInfo}
            onRule={showRules}
            drawTime={round?.drawTime}
            serverOffset={serverOffset}
          />
          {rulesRender}

          <DiceBettingPanel
            canBetting={canBetting}
            onPaidSuccess={handlePaidSuccess}
            gameInfo={gameInfo}
            isBonus={isBonus}
          />

          <div id="Dice_Btn_Tab" />

          <Spin className="flex-col" loading={innerLoading}>
            <TabList
              classNameBase=""
              fitTabContent={false}
              tabOptions={bottomTabs}
              selectedKey={tabKey}
              onSelectionChange={(v) => handleTabKeyChange(v as string)}
            />

            <div className="p-2">
              <SubTab
                tabs={tabs.map(o => ({
                  label: (
                    <div className="text-sec din text-xs font-bold">
                      <span className="text-main text-base mr-2">{o.tabMin}</span>
                      <span className="capitalize">{t('common.label.games.minutes')}</span>
                    </div>
                  ),
                  value: o.tabMin + '',
                }))}
                value={historyTabMin || ''}
                onChange={(v) => { setHistoryTabMin(v); setUpdateVersion(k => k + 1) }}
              />
            </div>

            <div className="flex flex-col min-h-[calc(100dvh-8.625rem)] max-h-[calc(100dvh-8.625rem)] overflow-x-hidden overflow-y-auto">
              {gameInfo && historyTabMin ? (
                <>
                  {tabKey === 'history' && (
                    <DiceHistoryTab updateVersion={updateVersion} setLoading={setInnerLoading} gameInfo={gameInfo} tab={historyTabMin} />
                  )}
                  {tabKey === 'analyze' && (
                    <DiceAnalyzeTab updateVersion={updateVersion} setLoading={setInnerLoading} gameInfo={gameInfo} tab={historyTabMin} />
                  )}
                  {tabKey === 'order' && (
                    <DiceOrderTab updateVersion={updateVersion} setLoading={setInnerLoading} gameInfo={gameInfo} tab={historyTabMin} />
                  )}
                </>
              ) : null}
            </div>
          </Spin>
        </div>
      </Spin>
      <NavBarSpacer />
    </div>
  )
}

export default DicePage
