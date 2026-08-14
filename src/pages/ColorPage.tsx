import { useState, useEffect, useRef, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@nextui-org/react'
import { getColorGameInfo, getColorDrawHistory, getColorDrawResult } from '../services/colorApi'
import type { ColorGameInfoDto, ColorTabDto, ColorHistoryItem } from '../services/colorApi'
import { withLoading, checkAuth } from '../utils/helpers'
import { toast } from '../utils/toast'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { dispatchPrizeNotification } from '../utils/prizeDispatch'
import { useGoBack } from '../hooks/useGoBack'
import { usePagination } from '../hooks/usePagination'
import { useGameRound } from '../hooks/useGameRound'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { TabList } from '../components/shared/TabList'
import { SubTab } from '../components/shared/SubTab'
import { NavBarSpacer } from '../components/shared/NavBarSpacer'
import { GameTimeTabs } from '../components/shared/GameTimeTabs'
import { ColorTimer } from '../components/color/ColorTimer'
import { ColorBettingPanel, type ColorBettingPanelRef } from '../components/color/ColorBettingPanel'
import { ColorHistory } from '../components/color/ColorHistory'
import { ColorAnalyze } from '../components/color/ColorAnalyze'
import { ColorOrder } from '../components/color/ColorOrder'
import { useBetModal } from '../components/color/useBetModal'
import { useGameRulesModal } from '../components/shared/GameRules'
import { WingoColorContext } from '../components/shared/WingoBall'
import { classifyColorBet, colorBetName, ColorBetKind } from '../utils/colorBet'

const toBetSlipItem = (code: string | number): string | number =>
  classifyColorBet(code) === ColorBetKind.Number ? Number(code) : colorBetName(code)

function parseQueryParams() {
  const params: Record<string, string> = {}
  const entries = new URLSearchParams(location.href.split('?')[1]).entries()
  for (const [key, val] of entries) params[key] = val
  return params
}

const ColorPageComponent = () => {
  const [tabs, setTabs] = useState<ColorTabDto[]>([])
  const [activeTab, setActiveTab] = useState<string>()
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.tabMin + '' === activeTab),
    [activeTab, tabs]
  )
  const [historyTab, setHistoryTab] = useState<string>()
  const historyTabRef = useRef<string>(undefined)
  const [gameInfo, setGameInfo] = useState<ColorGameInfoDto>()
  const gameInfoRef = useRef<ColorGameInfoDto | null>(null)
  const { round, result, serverOffset } = useGameRound(gameInfo?.colorID)
  const lastRoundRef = useRef<string | null>(null)
  const lastPushAt = useRef(0)
  const lastFetchAt = useRef(0)
  const lastPushRoundRef = useRef<string | null>(null)

  useEffect(() => {
    if (!tabs.length) return
    const tabData = tabs.find((tab) => tab.tabMin + '' === activeTab)
    const colorID = tabData?.colorID
    if (colorID && colorID !== gameInfo?.colorID) {
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?id=${
          tabs.find((tab) => tab.tabMin + '' === activeTab)?.colorID
        }${isBonus ? '&isBonus=true' : ''}`
      )
      fetchInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const [orderNum, setOrderNum] = useState(0)
  const [orderVersion, setOrderVersion] = useState(0)
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [canBetting, setCanBetting] = useState(true)

  const onBetSuccess = (item: string | number) => {
    bettingPanelRef.current?.addDrop(item)
    if (tabKey !== 'order') setOrderNum((prev) => prev + 1)
    else setOrderVersion((prev) => prev + 1)
  }

  const [isBonus, setIsBonus] = useState(false)
  const { renderModal, show: showBetModal, hide: hideBetModal } = useBetModal(onBetSuccess, isBonus)
  const bettingPanelRef = useRef<ColorBettingPanelRef>(null)
  const { render: rulesRender, show: showRules } = useGameRulesModal(gameInfo?.colorID)
  const hasInitRef = useRef(false)
  const tabSwitchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    fetchInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goBack = useGoBack()

  const fetchInfo = () => {
    const params = parseQueryParams()
    const { id, isBonus: bonusParam } = params
    if (!id) {
      goBack()
      return
    }
    lastFetchAt.current = Date.now()
    setIsBonus(!!bonusParam)
    setLoading(true)

    getColorGameInfo(id)
      .then((data) => {
        if (!data || !data.tabs) return
        setTabs(data.tabs)
        const found = data.tabs.find((tab) => tab.colorID + '' === id)
        const tabMin = (found?.tabMin || data.tabs[0].tabMin) + ''
        setActiveTab(tabMin)
        if (!historyTabRef.current) historyTabRef.current = tabMin
        if (!historyTab) setHistoryTab(tabMin)
        gameInfoRef.current = data
        setGameInfo(data)

        const lastKey = 'last_check_wingo_result_' + data.colorID
        const lastChecked = localStorage.getItem(lastKey)
        if (checkAuth(false, false) && data.lastRoundNo && lastChecked !== data.lastRoundNo) {
          localStorage.setItem(lastKey, data.lastRoundNo)
          fetchAndSyncBalance()
          getColorDrawResult(data.colorID, data.lastRoundNo).then((res) => {
            if (res.totalPrize) dispatchPrizeNotification(res.totalPrize, !bonusParam)
          })
        }

        if (tabKey === 'order') {
          setOrderVersion((prev) => prev + 1)
        } else {
          paginationInit()
        }
      })
      .finally(() => setLoading(false))
  }

  const handleNextLottery = () => {
    if (Date.now() - lastPushAt.current < 5000) return
    if (Date.now() - lastFetchAt.current < 5000) return
    fetchInfo()
  }

  const {
    resultList,
    resultPageNo,
    resultTotalPage,
    totalSize,
    init: paginationInit,
    refreshNextPage,
    refreshPrevPage,
    refreshCurrentPage,
  } = usePagination<ColorHistoryItem>(
    (page, size) => {
      const colorID = gameInfoRef.current?.tabs?.find((tab) => tab.tabMin + '' === historyTabRef.current)?.colorID
      return colorID
        ? withLoading(setHistoryLoading, getColorDrawHistory(colorID, page, size))
        : Promise.resolve({ totalPages: 0, totalSize: 0, content: [] })
    },
    { pageSize: 10, append: false }
  )

  const onNextPage = () => refreshNextPage()
  const onPrevPage = () => {
    if (resultPageNo === 2) hasInitRef.current = true
    return refreshPrevPage()
  }
  const onGoToPage = (page: number) => {
    if (page === 1) hasInitRef.current = true
    return refreshCurrentPage(page)
  }

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        hasInitRef.current = true
        fetchInfo()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  useEffect(() => {
    if (!result || !gameInfoRef.current) return
    if (result.roundNo === lastPushRoundRef.current) return
    lastPushRoundRef.current = result.roundNo
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
    if (!canBetting) {
      hideBetModal()
      toast.show({
        icon: 'warning',
        message: t('common.tip.warn.betUnable', {
          time: currentTab?.stopSec || 10,
        }),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBetting])

  useEffect(() => {
    if (gameInfo) {
      bettingPanelRef.current?.allDrop(
        (gameInfo.tickets ?? []).map((item) => toBetSlipItem(item.item))
      )
    }
  }, [gameInfo])

  const tabOptions = useMemo(
    () => [
      { title: t('common.label.resultHistory'), key: 'history' },
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
        ) : (
          t('common.label.games.myOrder')
        ),
        key: 'order',
      },
    ],
    [orderNum, t]
  )

  const [tabKey, setTabKey] = useState('history')
  const [forceMinH, setForceMinH] = useState(false)

  const handleBottomTabChange = (key: string) => {
    setTabKey(key)
    if (tabSwitchTimeout.current) clearTimeout(tabSwitchTimeout.current)
    setForceMinH(true)
    tabSwitchTimeout.current = setTimeout(() => {
      setForceMinH(false)
    }, 500)
    if (key === 'order') setOrderNum(0)
  }

  const handleTimeTabChange = (key: string) => {
    setActiveTab(key)
    historyTabRef.current = key
    setHistoryTab(key)
    setOrderNum(0)
  }

  const handlePay = (selectBtnContent: string | number) => {
    if (gameInfo) {
      showBetModal({ selectBtnContent, gameInfo })
    }
  }

  const paletteStyle = useMemo(() => {
    const palette: Record<string, string> = gameInfo?.palette || {}
    return Object.keys(palette).reduce<Record<string, string>>((vars, key) => {
      vars[`--game-color-${key}`] = palette[key]
      return vars
    }, {})
  }, [gameInfo])

  return (
    <WingoColorContext.Provider value={gameInfo?.numberColors ?? null}>
    <div className="size-full flex flex-col" style={paletteStyle as CSSProperties}>
      <TopBarWrapper title={t('wingo.title')} isBonus={isBonus} />
      <Banner />
      <Spin loading={loading} className="flex-1 flex-col overflow-hidden">
        <div
          id="Wingo_Game_Container"
          className="flex-1 flex-col overflow-y-auto wingo"
        >

          <GameTimeTabs
            tabOptions={tabs.map((tab) => ({
              title: (
                <div className="din text-main text-xl flex items-center">
                  {tab.tabMin}
                  <span className="text-sec text-xs ml-2 capitalize">
                    {t('common.label.games.minutes')}
                  </span>
                </div>
              ),
              key: tab.tabMin + '',
            }))}
            selectedKey={activeTab + ''}
            onSelectionChange={(key) => handleTimeTabChange(key)}
            className="pt-2"
            tabItemWrapClassName="*:not-last:mr-2 pb-2"
          />

          <ColorTimer
            gameInfo={gameInfo}
            onNextLottery={handleNextLottery}
            onBetting={setCanBetting}
            onRule={showRules}
            drawTime={round?.drawTime}
            serverOffset={serverOffset}
          />

          <ColorBettingPanel
            ref={bettingPanelRef}
            canBetting={canBetting}
            onPay={handlePay}
          />

          <div id="Wingo_Btn_Tab" />

          <Spin className="flex-col" loading={historyLoading}>

            <TabList
              fitTabContent={false}
              tabOptions={tabOptions}
              selectedKey={tabKey}
              onSelectionChange={(key) => handleBottomTabChange(key)}
            />

            {tabs.length > 1 && (
              <div className="p-2 bg-light-gray sticky top-0 z-20">
                <SubTab
                  tabs={tabs.map((tab) => ({
                    label: (
                      <div className="text-sec din text-xs font-bold">
                        <span className="text-main text-base mr-2 capitalize">
                          {tab.tabMin}
                        </span>
                        {t('common.label.games.minutes')}
                      </div>
                    ),
                    value: tab.tabMin + '',
                  }))}
                  value={historyTab}
                  onChange={(val) => {
                    historyTabRef.current = val
                    setHistoryTab(val)
                    if (tabKey === 'order') {
                      setOrderVersion((prev) => prev + 1)
                    } else {
                      paginationInit()
                    }
                  }}
                />
              </div>
            )}

            <div className={`flex flex-col ${forceMinH ? 'min-h-screen' : ''}`}>
              {tabKey === 'history' && (
                <ColorHistory
                  latestLottery={{
                    pageNo: resultPageNo,
                    totalPage: resultTotalPage,
                    totalSize,
                    onNext: onNextPage,
                    onPage: onGoToPage,
                    onPrev: onPrevPage,
                    list: resultList,
                  }}
                />
              )}
              {tabKey === 'analyze' && (
                <ColorAnalyze
                  latestLottery={{
                    pageNo: resultPageNo,
                    totalPage: resultTotalPage,
                    totalSize,
                    onNext: onNextPage,
                    onPage: onGoToPage,
                    onPrev: onPrevPage,
                    list: resultList,
                  }}
                />
              )}
              {tabKey === 'order' && gameInfo && historyTab && (
                <ColorOrder
                  setLoading={setHistoryLoading}
                  version={orderVersion}
                  gameInfo={gameInfo}
                  tab={historyTab}
                />
              )}
            </div>
          </Spin>

          {renderModal}
          {rulesRender}
        </div>
      </Spin>
      <NavBarSpacer />
    </div>
    </WingoColorContext.Provider>
  )
}

export const ColorPage = ColorPageComponent
export default ColorPageComponent
