import { useState, useEffect } from 'react'
import { Spin } from '../shared/Spin'
import { NoData } from '../shared/NoData'
import { Pagination } from '../shared/Pagination'
import { ShowMore } from '../shared/ShowMore'
import { KeralaDigitBall } from './KeralaDigitBall'
import { getKeralaDrawDetailList, KeralaDrawDetail } from '../../services/keralaApi'
import { formatDate } from '../../utils/date'

const PAGE_SIZE = 10

function parsePrizeLevel(level: string): string | number {
  if (
    level.endsWith('th') ||
    level.endsWith('st') ||
    level.endsWith('nd') ||
    level.endsWith('rd')
  )
    return +level.substring(0, level.length - 2)
  return level === 'Cons' ? 'cons' : 'lucky'
}

export function KeralaHistoryItem({
  drawTime,
  roundNo,
  codeList = [],
}: KeralaDrawDetail) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="p-3 rounded-sm bg-white dark:bg-charcoal">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-main">
          {drawTime ? formatDate(drawTime, 'dddd dd Mon yyyy') : ''}
        </p>
        <div className="rounded border border-gray px-2 py-1">
          <p className="text-xs font-bold">No.{roundNo}</p>
        </div>
      </div>

      <div className="flex flex-col gap-y-1 mt-3">
        {codeList
          .slice(0, showMore ? Infinity : 3)
          .map((tier, tierIdx) => (
            <div
              key={tierIdx}
              className="flex p-2 bg-selected justify-between items-start"
            >
              <div>
                <div className={`lottery-top-icon-${parsePrizeLevel(tier.level)} mb-1`} />
                <p className="text-xs font-bold text-acc capitalize">
                  total prizes
                </p>
                <p className="text-sm font-bold text-main">RS{tier.prize}</p>
              </div>
              <div>
                <p className="text-xs text-right text-acc font-bold">Result</p>
                <div className="flex flex-col gap-y-2">
                  {tier.codes.map((code, codeIdx) => (
                    <div key={codeIdx} className="flex items-center gap-x-0.5">
                      {code.split('').map((char, charIdx) => (
                        <KeralaDigitBall
                          key={charIdx}
                          digit={char}
                          outline={charIdx !== 0}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>

      {!!codeList.length && codeList.length > 3 && (
        <ShowMore
          className="p-0! mt-3"
          showMore={showMore}
          setShowMore={setShowMore}
        />
      )}
    </div>
  )
}

interface KeralaHistoryProps {
  gameID: number
  gameCode?: string
  version?: number
}

export function KeralaHistory({ gameID, gameCode, version }: KeralaHistoryProps) {
  const [loading, setLoading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [firstLoad, setFirstLoad] = useState(true)
  const [list, setList] = useState<KeralaDrawDetail[]>([])
  const [pageNo, setPageNo] = useState(1)

  useEffect(() => {
    if (gameID) fetchPage(1)
  }, [gameID, version])

  const fetchPage = async (page: number) => {
    try {
      setLoading(true)
      const data = await getKeralaDrawDetailList(
        { keralaID: gameID, pageNo: page, size: PAGE_SIZE },
        gameCode || ''
      )
      if (data) {
        setList(data.records || [])
        setTotalSize(data.totalSize)
        setPageNo(page)
      }
    } finally {
      setFirstLoad(false)
      setLoading(false)
    }
  }

  return (
    <Spin
      loading={firstLoad || loading}
      className="flex flex-col"
      style={{ minHeight: '100%' }}
    >
      {list.length > 0 && (
        <div className="bg-light-gray p-2 gap-y-2 flex flex-col">
          {list.map((item, index) => (
            <KeralaHistoryItem key={index} {...item} />
          ))}
        </div>
      )}
      {list.length === 0 && !firstLoad && !loading && (
        <div className="flex-1 flex justify-center items-center">
          <NoData />
        </div>
      )}
      <Pagination
        onPrev={() => fetchPage(pageNo - 1)}
        onNext={() => fetchPage(pageNo + 1)}
        onPage={(page) => fetchPage(page)}
        totalPage={totalSize ? Math.ceil(totalSize / PAGE_SIZE) : 0}
        totalSize={totalSize}
        pageNo={pageNo}
      />
    </Spin>
  )
}
