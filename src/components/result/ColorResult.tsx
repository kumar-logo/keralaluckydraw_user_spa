import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { withLoading } from '../../utils/helpers'
import { Spin } from '../shared/Spin'
import { Pagination } from '../shared/Pagination'
import { ResultTable } from '../shared/ResultTable'
import { FullBall } from '../shared/WingoBall'
import { ResultGameCover } from './ResultGameCover'
import { ResultCycleTabs } from './ResultCycleTabs'
import { getColorGameInfo, getColorDrawHistory } from '../../services/colorApi'

const PAGE_SIZE = 15

interface WinGoTab {
  tabMin: number
  colorID: number
}

interface WinGoInfo {
  tabs: WinGoTab[]
  lessSec: number
  tabMin: number
  roundNo: string
}

interface WinGoDraw {
  issueNo: string
  number: number
}

export const ColorResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tabs, setTabs] = useState<WinGoTab[]>([])
  const [colorID, setColorID] = useState('101')
  const [content, setContent] = useState<WinGoDraw[]>([])
  const [info, setInfo] = useState<WinGoInfo>()
  const [loading, setLoading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [pageNo, setPageNo] = useState(1)

  const loadInfo = (id: string) =>
    getColorGameInfo(id).then((data) => {
      const result = data as unknown as WinGoInfo
      setInfo(result)
      setTabs(result.tabs)
    })

  const loadHistory = (id = '', page = 1) =>
    withLoading(
      setLoading,
      getColorDrawHistory(Number(id), page, PAGE_SIZE).then((data) => {
        const result = data as unknown as { totalSize: number; content: WinGoDraw[] }
        setPageNo(page)
        setTotalSize(result.totalSize)
        setContent(result.content || [])
      })
    )

  useEffect(() => {
    withLoading(setLoading, Promise.all([loadInfo(colorID), loadHistory(colorID)]))
  }, [colorID])

  return (
    <Spin loading={loading} className="flex-1 flex flex-col color overflow-hidden">
      <ResultGameCover
        onPlay={() => navigate(`/games/wingo?id=${colorID}`)}
        title="Color Result"
        icon="/images/games/wingo/logo.webp"
        onTimeEnd={() => loadInfo(colorID)}
        gameType="color"
        countDown={info?.lessSec}
        desc={tabs.map((tab) => tab.tabMin + 'min').join(' ')}
        subheading={`${info?.tabMin} Min Issue number`}
        nextDraw={info?.roundNo}
      />
      <div className="border-t border-white border-dashed p-2 flex-1 flex-col flex overflow-hidden">
        <ResultCycleTabs
          tabOptions={tabs.map((tab) => ({ title: tab.tabMin, key: tab.colorID + '' }))}
          selectedKey={colorID}
          onSelectionChange={setColorID}
        />
        <div className="mt-1 flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <ResultTable
              tdWrapClassName="py-0"
              className="w-full rounded-sm!"
              dataList={content}
              pageNo={0}
              total={1}
              notuseInnerNodata
              th={
                <div className="flex flex-1 items-center mx-2">
                  <div className="flex-1 text-left">{t('common.label.table.issue')}</div>
                  <div className="flex-2 text-right">{t('common.label.table.number')}</div>
                </div>
              }
              td={(draw: WinGoDraw) => (
                <div className="flex flex-1 items-center py-3 px-2">
                  <div className="text-left text-xs font-bold text-main pr-3 whitespace-break-spaces">{draw?.issueNo}</div>
                  <div className="flex justify-end gap-x-0.5 relative flex-1">
                    {Array(10)
                      .fill(0)
                      .map((_, k) => (
                        <div key={k} className="z-7">
                          <FullBall
                            noneClass="dark:bg-gray border border-[#B2B2B2]"
                            size={20}
                            content={k}
                            textSize={12}
                            none={k !== draw?.number}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            />
          </div>
        </div>
        <div className="mt-2">
          <Pagination
            onPrev={() => loadHistory(colorID, pageNo - 1)}
            onNext={() => loadHistory(colorID, pageNo + 1)}
            onPage={(page) => loadHistory(colorID, page)}
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
