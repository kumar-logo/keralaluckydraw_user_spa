import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { withLoading } from '../../utils/helpers'
import { Spin } from '../shared/Spin'
import { Pagination } from '../shared/Pagination'
import { ResultTable } from '../shared/ResultTable'
import { DiceSingle, DiceNum, DiceSumBadge } from '../dice/DiceVisuals'
import { ResultGameCover } from './ResultGameCover'
import { ResultCycleTabs } from './ResultCycleTabs'
import { getDiceGameInfo, getDiceDrawHistory } from '../../services/diceApi'

const PAGE_SIZE = 15

interface DiceTab {
  tabMin: number
  diceID: number
}

interface DiceInfo {
  tabs: DiceTab[]
  lessSec: number
  tabMin: number
  roundNo: string
}

interface DiceDraw {
  issueNo: string
  result: string
  totalCount: number
}

export const DiceResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tabs, setTabs] = useState<DiceTab[]>([])
  const [diceID, setDiceID] = useState('201')
  const [content, setContent] = useState<DiceDraw[]>([])
  const [info, setInfo] = useState<DiceInfo>()
  const [loading, setLoading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [pageNo, setPageNo] = useState(1)

  const loadInfo = (id: string) =>
    getDiceGameInfo(id).then((data) => {
      const result = data as unknown as DiceInfo
      setInfo(result)
      setTabs(result.tabs)
    })

  const loadHistory = (id = '', page = 1) =>
    getDiceDrawHistory(Number(id), page, PAGE_SIZE).then((data) => {
      const result = data as unknown as { totalSize: number; content: DiceDraw[] }
      setPageNo(page)
      setTotalSize(result.totalSize)
      setContent(result.content || [])
    })

  useEffect(() => {
    withLoading(setLoading, Promise.all([loadInfo(diceID), loadHistory(diceID)]))
  }, [diceID])

  return (
    <Spin loading={loading} className="flex-1 flex flex-col overflow-hidden">
      <ResultGameCover
        icon="/images/games/dice/logo.webp"
        onTimeEnd={() => loadInfo(diceID)}
        countDown={info?.lessSec}
        desc={tabs.map((tab) => tab.tabMin + 'min').join(' ')}
        gameType="dice"
        title="Dice Result"
        onPlay={() => navigate('/games/k3?id=' + diceID)}
        subheading={`${info?.tabMin} Min Issue number`}
        nextDraw={info?.roundNo}
      />
      <div className="border-t border-[#fff] border-dashed p-2 flex-1 flex-col flex overflow-hidden">
        <ResultCycleTabs
          tabOptions={tabs.map((tab) => ({ title: tab.tabMin, key: tab.diceID + '' }))}
          selectedKey={diceID}
          onSelectionChange={setDiceID}
        />
        <div className="mt-2 flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <ResultTable
              dataList={content}
              className="w-full rounded-sm!"
              tdWrapClassName="py-0"
              pageNo={0}
              total={1}
              notuseInnerNodata
              th={
                <div className="flex flex-1 items-center mx-2">
                  <div className="flex-1 text-left">{t('common.label.table.issue')}</div>
                  <div className="flex-2 text-right">{t('common.label.table.number')}</div>
                </div>
              }
              td={(draw: DiceDraw) => (
                <div className="flex flex-1 items-center px-2 justify-between py-3">
                  <div className="text-xs text-main font-bold">{draw.issueNo}</div>
                  <div className="flex items-center gap-x-3">
                    <div className="flex items-center gap-x-1">
                      {draw.result.split(',').map((value, k) => (
                        <DiceSingle key={k} num={Number(value)} size={24} />
                      ))}
                    </div>
                    {draw.result && new Set(draw.result.split(',')).size === 1 ? (
                      <>
                        <DiceNum num={0} size={24} emptyChar="-" />
                        <div className="flex items-center gap-1">
                          <div className="result-dice-table-value flex items-center justify-center">
                            <DiceSumBadge size={24} emptyChar="-" />
                          </div>
                          <div className="result-dice-table-number flex items-center justify-center">
                            <DiceSumBadge size={24} emptyChar="-" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <DiceNum num={draw.totalCount} size={24} />
                        <div className="flex items-center gap-1">
                          <div className="result-dice-table-value flex items-center justify-center">
                            <DiceSumBadge size={24} type={draw.totalCount > 10 ? 'big' : 'small'} />
                          </div>
                          <div className="result-dice-table-number flex items-center justify-center">
                            <DiceSumBadge size={24} type={draw.totalCount % 2 ? 'odd' : 'even'} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            />
          </div>
        </div>
        <div className="mt-2">
          <Pagination
            onPrev={() => loadHistory(diceID, pageNo - 1)}
            onNext={() => loadHistory(diceID, pageNo + 1)}
            onPage={(page) => loadHistory(diceID, page)}
            totalPage={totalSize ? Math.ceil(totalSize / PAGE_SIZE) : 0}
            totalSize={totalSize}
            pageNo={pageNo}
          />
          <div className="w-full h-(--nav-bar-height) shrink-0" />
        </div>
      </div>
    </Spin>
  )
}
