import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollShadow, Progress, RadioGroup, Radio, type RadioProps } from '@nextui-org/react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import clsx from 'clsx'
import { getDiceDrawHistory, getDiceDrawAnalyze, getDiceOrderList } from '../../services/diceApi'
import type { DiceGameInfoDto, DiceHistoryItem, DiceAnalyzeDto, DiceOrderDto, DiceBetDto } from '../../services/diceApi'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { usePagination } from '../../hooks/usePagination'
import { Pagination } from '../shared/Pagination'
import { NoData } from '../shared/NoData'
import { ShowMore } from '../shared/ShowMore'
import { DiceSingle, DiceNum, DiceSumBadge } from './DiceVisuals'
import { renderBetIcon } from './diceBetOptions'

function computeSumColor(result: string): { sum: number; color: 'r' | 'g' | 'b' } {
  const digits = result.split(',').join('')
  const sum = result.split(',').reduce((acc, val) => acc + +val, 0)
  if (['111', '222', '333', '444', '555', '666'].includes(digits)) return { sum, color: 'g' }
  return sum <= 10 ? { sum, color: 'b' } : { sum, color: 'r' }
}

const bstMap: Record<string, string> = { r: 'B', g: 'T', b: 'S' }

const ScrollArea = ({ maskWidth = 28, children, className = '', disableAnimate = false }: {
  maskWidth?: number; children: React.ReactNode; className?: string; disableAnimate?: boolean
}) => {
  const vwWidth = maskWidth / 375 * 100
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { scrollX, scrollXProgress } = useScroll({ container: containerRef, axis: 'x' })
  const autoScroll = useRef(true)

  const leftOpacity = useTransform(() => {
    const scrollPos = scrollX.get()
    return scrollXProgress.get() === 1 ? (scrollPos === 0 ? 0 : 1) : scrollPos / maskWidth
  })
  const rightOpacity = useTransform(() => {
    const scrollPos = scrollX.get()
    const progress = scrollXProgress.get()
    return scrollPos === 0 ? (progress === 1 ? 0 : 1) : (scrollPos / progress - scrollPos) / maskWidth
  })

  useMotionValueEvent(scrollX, 'change', (v) => {
    const prev = scrollX.getPrevious()
    if (prev && v < prev) autoScroll.current = false
  })

  const tick = useCallback(() => {
    if (!autoScroll.current) return
    if (scrollXProgress.get() >= 1) { autoScroll.current = false; return }
    containerRef.current?.scrollTo({ left: scrollX.get() + 1 })
    requestAnimationFrame(tick)
  }, [scrollX, scrollXProgress])

  useEffect(() => {
    if (disableAnimate) return
    animRef.current = setTimeout(tick, 1000)
    return () => { if (animRef.current != null) clearTimeout(animRef.current) }
  }, [disableAnimate, tick])

  const maskBase = useMemo(() => 'absolute top-0 bottom-0 z-10 h-full pointer-events-none', [])

  return (
    <div className={`overflow-hidden relative ${className}`}>
      <motion.div className={`${maskBase} scroll-area-mask-left duration-200`} style={{ opacity: leftOpacity, width: `${vwWidth}vw` }} />
      <motion.div className={`${maskBase} scroll-area-mask-right duration-200`} style={{ opacity: rightOpacity, width: `${vwWidth}vw` }} />
      <div className="w-full h-full flex items-center overflow-x-auto" ref={containerRef}>
        <div>{children}</div>
      </div>
    </div>
  )
}

const AnalyzeResultGrid = ({ data }: { data: DiceHistoryItem[] }) => {
  const rows = useMemo(() => {
    if (!data) return []
    const result: DiceHistoryItem[][] = []
    let row: DiceHistoryItem[] = []
    for (let i = 0; i < data.length; i++) {
      row.push(data[i])
      if (i % 13 === 12) { result.push(row); row = [] }
    }
    if (row.length) result.push(row)
    return result
  }, [data])

  return (
    <ScrollArea className="p-3" maskWidth={80}>
      {rows.map((row, r) => (
        <div key={r} className="flex gap-x-0.5 mt-0.5 first:mt-0">
          {row.map((item, c) => {
            const { sum, color } = computeSumColor(item.result)
            return (
              <div key={c} className="w-6.5 flex flex-col items-center justify-center text-10 bg-selected rounded-sm">
                <div className="flex flex-col items-center justify-center rounded-sm py-1">
                  <p className={`color-num-${color} mb-1`}>{sum}</p>
                  <p className="text-acc">{item.result.split(',').join('')}</p>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </ScrollArea>
  )
}

const AnalyzeBSTChart = ({ data }: { data: DiceHistoryItem[] }) => {
  const groups = useMemo(() => {
    if (!data) return []
    const colors = data.map(o => computeSumColor(o.result))
    let last: string | null = null
    const result: { bst: string; color: string; count: number }[] = []
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i].color
      if (last == null || bstMap[color] !== last || (result.length > 0 && result[result.length - 1].count >= 6)) {
        result.push({ bst: bstMap[color], color: color, count: 1 })
        last = bstMap[color]
        continue
      }
      if (result.length > 0) result[result.length - 1].count++
    }
    return result
  }, [data])

  return (
    <ScrollArea className="p-3" maskWidth={80}>
      <div className="flex bg-light-gray dark:bg-selected">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {Array(6).fill(0).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className={clsx(
                  'size-6 flex items-center justify-center m-0.25 bg-white dark:bg-gray',
                  groupIdx > 0 && 'ml-0',
                  rowIdx > 0 && 'mt-0',
                )}
              >
                {rowIdx < group.count && (
                  <div className="flex flex-col flex-center">
                    <p className={`bg-letter-${group.color} letter-item flex items-center justify-center text-main text-xs`}>
                      {group.bst}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function ResultTable<T>({ dataList, th, td, tdWrapClassName, className }: {
  dataList: T[]; th: ReactNode; td: (item: T) => ReactNode; tdWrapClassName?: string; className?: string
}) {
  return (
    <div className={`rounded-t bg-white dark:bg-gray overflow-hidden ${className || ''}`}>
      <div className="brand-sec-head flex justify-between items-center px-3 py-2 h-12">
        {th}
      </div>
      {dataList?.map((item, i) => (
        <div key={i} className={`border-b border-selected ${tdWrapClassName || ''}`}>{td(item)}</div>
      ))}
    </div>
  )
}

export const DiceHistoryTab = ({ gameInfo, tab, setLoading, updateVersion }: {
  gameInfo: DiceGameInfoDto; tab: string; setLoading: (v: boolean) => void; updateVersion: number
}) => {
  const { t } = useTranslation()
  const diceID = gameInfo?.tabs?.find((u) => u.tabMin + '' === tab)?.diceID
  const {
    resultList, resultPageNo, resultTotalPage, totalSize,
    init, refreshNextPage, refreshPrevPage, refreshCurrentPage,
  } = usePagination<DiceHistoryItem>(
    (page, size) => {
      if (!diceID) return Promise.resolve({ content: [], totalPages: 0, totalSize: 0 })
      setLoading(true)
      return getDiceDrawHistory(diceID, page, size).finally(() => setLoading(false))
    },
    { pageSize: 10, append: false }
  )

  useEffect(() => { init() }, [updateVersion])

  return (
    <div className="flex flex-col size-full">
      <ScrollShadow className="p-2 pt-0 flex-1 overflow-auto">
        <ResultTable
          dataList={resultList}
          tdWrapClassName="py-0"
          th={
            <div className="flex flex-1 items-center mx-3 justify-between">
              <div className="result-dice-table-issue flex-center">{t('common.label.table.issue')}</div>
              <div className="flex flex-1 items-center justify-end">{t('common.label.table.number')}</div>
            </div>
          }
          td={(item) => {
            const dice = item.result.split(',')
            const isLeopard = new Set(dice).size === 1
            return (
              <div className="flex flex-1 items-center mx-3 justify-between py-3">
                <div className="result-dice-table-issue text-sec text-xs">{item.issueNo}</div>
                <div className="flex flex-1 flex-row items-center gap-1 justify-end">
                  <div className="flex items-center gap-0.5">
                    {dice.map((v, j) => <DiceSingle key={j} num={+v} size={24} />)}
                  </div>
                  <DiceNum size={24} num={isLeopard ? 0 : item.totalCount || 0} emptyChar={isLeopard ? '-' : '?'} />
                  <div className="flex items-center gap-0.5">
                    {item.totalCount ? (
                      <DiceSumBadge size={24} type={isLeopard ? undefined : item.totalCount > 10 ? 'big' : 'small'} emptyChar={isLeopard ? '-' : '?'} />
                    ) : '-'}
                    {item.totalCount ? (
                      <DiceSumBadge size={24} type={isLeopard ? undefined : item.totalCount % 2 ? 'odd' : 'even'} emptyChar={isLeopard ? '-' : '?'} />
                    ) : '-'}
                  </div>
                </div>
              </div>
            )
          }}
        />
      </ScrollShadow>
      <Pagination
        onPrev={refreshPrevPage} onNext={refreshNextPage} onPage={refreshCurrentPage}
        totalPage={resultTotalPage} totalSize={totalSize} pageNo={resultPageNo}
      />
    </div>
  )
}

const formatOdds = (v: number) => (v || 0).toFixed(2)

const DiceStats = ({ data, typeCount }: { data: DiceAnalyzeDto; typeCount: string }) => {
  const { t } = useTranslation()
  const items = useMemo(() => [
    { num: 1, percent: formatOdds(data?.count1) },
    { num: 2, percent: formatOdds(data?.count2) },
    { num: 3, percent: formatOdds(data?.count3) },
    { num: 4, percent: formatOdds(data?.count4) },
    { num: 5, percent: formatOdds(data?.count5) },
    { num: 6, percent: formatOdds(data?.count6) },
  ], [data, typeCount])

  const ratios = useMemo(() => {
    const big = formatOdds(data?.bigPer)
    const small = formatOdds(data?.smallPer)
    return { big, small, triple: (100 - +big - +small).toFixed(2) }
  }, [data, typeCount])

  return (
    <>
      <div className="flex-col">
        <div className="border-b border-selected px-2.5 py-3">
          <div className="flex justify-between flex-wrap px-2 gap-y-5 mb-3">
            {items.map(o => (
              <div key={o.num} className="flex items-center justify-center">
                <div className="mt-1 mr-1"><DiceSingle num={o.num} size={28} /></div>
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-sec text-center mb-1">{o.percent}%</p>
                  <Progress
                    aria-label="Loading..."
                    classNames={{ base: 'content-round-bar h-2', track: 'content-round-track', indicator: 'bg-[#F15802]!' }}
                    value={+o.percent}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex p-3 flex-col">
          <div className="flex justify-between mb-1">
            <p className="text-sm font-bold dice-small-text uppercase">{t('common.label.games.Small')}</p>
            <p className="text-sm font-bold dice-big-text uppercase">{t('common.label.games.Big')}</p>
          </div>
          <div className="flex items-center justify-center rounded-2xl">
            <div className="dice-small-div rounded-l-lg h-4 text-xs text-main font-bold text-center" style={{ width: `${ratios.small}%` }}>{ratios.small}%</div>
            <div className="dice-green-div h-4" style={{ width: `${ratios.triple}%` }} />
            <div className="dice-big-div rounded-r-lg h-4 text-xs text-main font-bold text-center" style={{ width: `${ratios.big}%` }}>{ratios.big}%</div>
          </div>
        </div>
      </div>
    </>
  )
}

const AnalyzeRadio = ({ children, ...props }: RadioProps) => (
  <Radio
    {...props}
    classNames={{
      base: 'bg-light-gray dark:bg-selected flex-1 dice-round-radio p-0 m-0 items-center justify-center rounded-sm max-w-full data-[selected=true]:bg-primary!',
      control: 'hidden', wrapper: 'hidden', labelWrapper: 'ml-0',
      label: 'text-xs text-sec group-data-[selected=true]:text-black',
    }}
  >
    {children}
  </Radio>
)

export const DiceAnalyzeTab = ({ gameInfo, tab, setLoading, updateVersion }: {
  gameInfo: DiceGameInfoDto; tab: string; setLoading: (v: boolean) => void; updateVersion: number
}) => {
  const { t } = useTranslation()
  const [data, setData] = useState<DiceAnalyzeDto>()
  const [count, setCount] = useState('50')
  const diceID = gameInfo?.tabs?.find((u) => u.tabMin + '' === tab)?.diceID

  useEffect(() => {
    if (!diceID) return
    setLoading(true)
    getDiceDrawAnalyze(diceID, +count).then(setData).catch(() => setData(undefined)).finally(() => setLoading(false))
  }, [updateVersion, count])

  const options = useMemo(() => ['50', '100', '200', '600'].map(p => ({
    label: `${p} ${t('k3.diceAnalyze.round')}`,
    value: p,
  })), [t])

  return (
    <div className="flex flex-col w-full mb-16" style={{ minHeight: 'calc(100vh - 9.375rem)' }}>
      <div className="w-full bg-white dark:bg-gray">
        {!!data && <AnalyzeResultGrid data={data?.latest} />}
        {!!data && <AnalyzeBSTChart data={data?.latest} />}
        <RadioGroup
          orientation="horizontal"
          classNames={{ base: 'w-full px-3 content-round pt-3 mt-3 border-t border-selected', wrapper: 'justify-between w-full gap-0 *:not-last:mr-1' }}
          value={count} onValueChange={setCount}
        >
          {options.map(u => <AnalyzeRadio key={u.value} value={u.value}>{u.label}</AnalyzeRadio>)}
        </RadioGroup>
        {!!data && <DiceStats data={data} typeCount={count} />}
      </div>
    </div>
  )
}

const OrderDetailRow = ({ data, awardStatus }: { data: DiceBetDto; awardStatus: number }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const pending = awardStatus === 2
  const won = !pending && (data.status === 1 || data.prize > 0)
  const status = useMemo(
    () => pending ? t('common.label.toBeDrawn') : won ? t('common.label.won') : t('common.label.nowin'),
    [pending, won, t]
  )

  return (
    <div className="flex flex-col p-2 flex-1" onClick={() => setExpanded(v => !v)}>
      <div className="flex justify-between items-center">
        <div className="w-20 flex">{renderBetIcon(data.betItem)}</div>
        <div className="w-19 text-sec items-center justify-center text-center text-sm font-bold">{formatCurrency(data.amount)}</div>
        <div className="w-19 flex justify-end items-center">
          <div className="flex flex-col items-end mr-1">
            <div className="text-xs text-sec">{status}</div>
            <div className={`text-sm font-bold ${!pending && data.prize > 0 ? 'text-bg-sec' : 'text-main'}`}>
              {pending ? '...' : formatCurrency(data.prize)}
            </div>
          </div>
          <div className="w-3.5 h-3.5" style={{ transition: '0.2s', transform: expanded ? 'rotate(90deg)' : '' }}>
            <svg viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L1 11" stroke="var(--bg-icon-gray)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="flex flex-col">
          <div className="mt-2 py-2 flex justify-between text-xs">
            <p className="text-acc">{t('common.label.games.Delivery')}</p>
            <p className="text-sec">{formatCurrency(data.basePrice)}</p>
          </div>
          <div className="my-3 py-2 flex justify-between text-xs">
            <p className="text-acc">{t('common.label.games.Fee')}</p>
            <p className="text-sec">{formatCurrency(data.amount - data.basePrice)}</p>
          </div>
          <div className="py-2 flex justify-between text-xs">
            <p className="text-acc">{t('common.label.games.bettingTime')}</p>
            <p className="text-sec">{formatDate(data?.createTime, 'yyyy-MM-dd hh:mm:ss')}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const OrderCard = ({ data }: { data: DiceOrderDto }) => {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)

  const [statusInfo, isLeopard] = useMemo(() => {
    let sum = 0
    if (data.typeList.every((d) => d.status !== 0)) {
      sum = data.typeList.some((d) => d.status === 1) ? 1 : 2
    }
    const map: Record<number, { className: string; text: string; status: number }> = {
      0: { className: 'order-tobedrawn', text: t('common.label.toBeDrawn').toLocaleUpperCase() + '...', status: 2 },
      1: { className: 'order-won', text: t('common.label.won').toLocaleUpperCase(), status: 1 },
      2: { className: 'order-nowin', text: t('common.label.nowin').toLocaleUpperCase(), status: 0 },
    }
    return [map[sum], data.result && new Set(data.result.split(',')).size === 1] as const
  }, [data, t])

  return (
    <div className="flex flex-col">

      <div className="bg-[#D6E0E8] dark:bg-gray border-b border-dashed border-text-sec-acc rounded-b-xl flex p-3 justify-between">
        <div className="flex flex-col items-start text-sec text-sm">
          <p className="font-bold text-main">{data.tabMin}Min</p>
          <p>{data.roundNo}</p>
        </div>
        <div className="flex flex-col text-xs">
          <div className="text-right">
            <span className="text-acc mr-2">{t('common.label.games.drawTime')}</span>
            {formatDate(data.drawSec, 'dd-MM hh:mm')}
          </div>
          <div className="flex items-center justify-end gap-1">
            {data.result ? data.result.split(',').map((m, x) => (
              <DiceSingle key={x} size={24} num={+m} />
            )) : Array(3).fill(0).map((_, x) => (
              <div key={x} className="w-6 h-6 bg-light-gray text-main text-xl font-bold flex justify-center items-center">?</div>
            ))}
            <DiceNum num={data.resultCount} size={24} emptyChar={isLeopard ? '-' : '?'} />
            <DiceSumBadge size={24} emptyChar={isLeopard ? '-' : '?'} type={!isLeopard && data.resultCount ? data.resultCount > 10 ? 'big' : 'small' : undefined} />
            <DiceSumBadge size={24} emptyChar={isLeopard ? '-' : '?'} type={!isLeopard && data.resultCount ? data.resultCount % 2 ? 'odd' : 'even' : undefined} />
          </div>
        </div>
      </div>

      <div className="rounded-t-xl flex flex-col bg-white dark:bg-gray">
        <div className={`${statusInfo.className} my-3 mx-2 p-2 flex justify-between items-center rounded-l-sm text-xs`}>
          <p className="text">{statusInfo.text}</p>
          <div className="flex items-center justify-center gap-x-2">
            <p className="text-acc">ID</p>
            <p className="text-sec">{data.orderGroup}</p>
          </div>
        </div>

        <div className="p-2 flex flex-col border-t border-gray">
          <div className="flex justify-between text-xs mb-2">
            <div className="flex flex-col">
              <span className="text-sm text-main font-bold">{t('common.label.games.myBets')}</span>
              <span className="text-acc">{t('common.label.games.bettingTime')}<span className="text-sec ml-2">{formatDate(data.createTime, 'dd-MM-yyyy hh:mm:ss')}</span></span>
            </div>
            <div className="flex flex-col text-right">
              <span>{t('common.label.games.totalPayment')}</span>
              <span className="text-sm text-main">{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>

          {statusInfo.status !== 2 && (
            statusInfo.status === 1 ? (
              <div className="rounded-sm bg-light-gray dark:bg-charcoal px-3 text-xs text-center py-1 text-sec">
                {t('common.tip.info.orderWin')}<br />{t('common.tip.info.orderWinAmount')}
                <span className="text-base font-bold text-bg-sec"> {formatCurrency(data.typeList.reduce((m, x) => m + (x.prize || 0), 0))}</span>
              </div>
            ) : (
              <div className="py-2 text-primary text-sm text-center">{t('common.tip.info.orderNoWin')}</div>
            )
          )}
        </div>

        <ResultTable
          dataList={showMore ? data.typeList : data.typeList.slice(0, 3)}
          className="rounded-none px-2 bg-white dark:bg-gray pb-2"
          th={
            <div className="flex justify-between px-2 flex-1">
              <div className="dice-order-table-number text-left">{t('common.label.table.number')}</div>
              <div className="dice-order-table-payment text-center">{t('common.label.games.payment')}</div>
              <div className="dice-order-table-result text-right">{t('common.label.result')}</div>
            </div>
          }
          td={(item) => <OrderDetailRow data={item} awardStatus={statusInfo.status} />}
        />
        {data.typeList.length > 3 && <ShowMore showMore={showMore} setShowMore={setShowMore} />}
      </div>
    </div>
  )
}

export const DiceOrderTab = ({ gameInfo, tab, setLoading, updateVersion }: {
  gameInfo: DiceGameInfoDto; tab: string; setLoading: (v: boolean) => void; updateVersion: number
}) => {
  const diceID = gameInfo?.tabs?.find((b) => b.tabMin + '' === tab)?.diceID
  const {
    resultList, resultPageNo, resultTotalPage, totalSize,
    init, refreshCurrentPage, refreshNextPage, refreshPrevPage,
  } = usePagination<DiceOrderDto>(
    (page, size) => {
      if (!diceID) return Promise.resolve({ content: [], totalPages: 0, totalSize: 0 })
      setLoading(true)
      return getDiceOrderList({
        diceID,
        pageNo: page,
        size,
        orderStatus: 3,
        yearMonth: formatDate(new Date(), 'yyyyMM'),
      }).finally(() => setLoading(false))
    },
    { pageSize: 10, append: false }
  )

  useEffect(() => { init() }, [updateVersion])

  return (
    <div className="flex flex-col size-full">
      <ScrollShadow className="flex-1 flex flex-col overflow-y-auto p-2 pt-0">
        {!resultList || resultList.length === 0 ? (
          <div className="h-72"><NoData /></div>
        ) : (
          <div className="flex flex-col gap-y-2">
            {resultList?.map((p, h) => <OrderCard key={h} data={p} />)}
          </div>
        )}
      </ScrollShadow>
      <Pagination
        pageNo={resultPageNo} totalPage={resultTotalPage} totalSize={totalSize}
        onNext={refreshNextPage} onPage={refreshCurrentPage} onPrev={refreshPrevPage}
      />
    </div>
  )
}
