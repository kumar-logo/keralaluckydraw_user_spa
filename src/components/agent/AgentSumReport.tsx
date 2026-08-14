import { useState, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, Tab, DateRangePicker } from '@nextui-org/react'
import { parseDate } from '@internationalized/date'
import clsx from 'clsx'
import { getAgentReport } from '../../services/financeApi'
import { formatCurrency } from '../../utils/format'
import { withLoading } from '../../utils/helpers'
import { Spin } from '../shared/Spin'

function getDateRange(days: number, base: Date = new Date()): [Date, Date] {
  const end = new Date(base)
  end.setHours(23, 59, 59, 999)
  const start = new Date(base)
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)
  return [start, end]
}

const TIER_BG: Record<string, string> = {
  A: 'bg-[#98FCFF]',
  B: 'bg-[#C2FEFF]',
  C: 'bg-[#DEFEFF]',
  D: 'bg-[#EDFFFF]',
}

const TierRow = ({ item, className }: { item: any; className: string }) => {
  const { t } = useTranslation()
  return (
    <>
      <tr className={'text-10 text-center h-6 border-b border-[#005092] ' + className}>
        <td>{item.tier}</td>
        <td className="border-x border-[#005092]">{item.data?.invites?.value}</td>
        <td>{item.data?.recharge?.value}</td>
        <td className="border-x border-[#005092]">{item.data?.bets?.value}</td>
        <td className="border-l border-[#005092]" rowSpan={2}>{item.comm}</td>
      </tr>
      <tr className={'text-10 text-center h-6 border-b border-[#005092] ' + className}>
        <td className="break-all">{t('referral.label.commission')}</td>
        <td className="border-x border-[#005092]">{item.data?.invites?.comm || '-'}</td>
        <td>{item.data?.recharge?.comm}</td>
        <td className="border-x border-[#005092]">{item.data?.bets?.comm}</td>
      </tr>
    </>
  )
}

function toCalendarDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return parseDate(`${year}-${month}-${day}`)
}

const DateRangeSelector = ({
  className,
  value,
  onChange,
}: {
  className?: string
  value: [Date, Date]
  onChange: (range: [Date, Date]) => void
}) => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState('1')
  const todayRef = useRef(getDateRange(2)[0])
  const [isOpen, setIsOpen] = useState(false)

  const tabOptions = useMemo(
    () => [
      { title: t('rebate.today'), key: '1' },
      { title: t('rebate.yesterday'), key: '0' },
      { title: t('referral.label.3Days'), key: '3' },
      { title: t('referral.label.7Days'), key: '7' },
      { title: t('referral.label.14Days'), key: '14' },
    ],
    [t],
  )

  return (
    <div className={className}>
      <Tabs
        classNames={{
          base: 'rounded-lg',
          tabList: 'justify-between',
          tab: 'text-xs',
        }}
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          const tabKey = String(key)
          setSelectedTab(tabKey)
          switch (tabKey) {
            case '1':
            case '3':
            case '7':
            case '14':
              onChange(getDateRange(parseInt(tabKey)))
              break
            case '0':
              onChange(getDateRange(1, todayRef.current))
              break
          }
        }}
      >
        {tabOptions.map((opt) => (
          <Tab key={opt.key} title={opt.title} />
        ))}
      </Tabs>

      <div className={clsx('relative my-2')}>
        <DateRangePicker
          isReadOnly={!isOpen}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          classNames={{
            base: 'w-full rounded-lg',
            inputWrapper: 'shadow-none rounded-lg bg-white dark:bg-selected',
            input: 'text-xs',
            segment: 'bg-white/0 shadow-none! border-none! text-sec!',
            separator: 'mx-1',
          }}
          value={{
            start: toCalendarDate(value[0]),
            end: toCalendarDate(value[1]),
          }}
          onChange={(val: any) => {
            if (val) {
              const startD = val.start.toDate('UTC')
              const endRange = getDateRange(1, val.end.toDate('UTC'))
              onChange([startD, endRange[1]])
            }
          }}
          aria-label="agent commission date range"
          startContent={
            <div className="text-nowrap flex-1 text-main text-xs pr-8 rtl:pr-0 rtl:pl-8">
              {t('referral.label.datePicker')}
            </div>
          }
        />
        <div
          className="absolute size-full left-0 top-0"
          onTouchStart={() => !isOpen && setIsOpen(true)}
          onClick={() => !isOpen && setIsOpen(true)}
        />
      </div>
    </div>
  )
}

export interface AgentSumReportData {
  commTotal: number
  list: any[]
}

interface AgentSumReportProps {
  agentSumReport: AgentSumReportData
  sumReportLoading: boolean
  sumDateRange: [Date, Date]
  setSumDateRange: (range: [Date, Date]) => void
}

export const AgentSumReport = ({
  agentSumReport,
  sumReportLoading,
  sumDateRange,
  setSumDateRange,
}: AgentSumReportProps) => {
  const { t } = useTranslation()

  return (
    <Spin loading={sumReportLoading} className="my-2 flex-col rounded-lg">
      <DateRangeSelector value={sumDateRange} onChange={setSumDateRange} />
      <table className="border-[#005092] border w-full dark:text-gray">
        <thead>
          <tr className="h-7 bg-[#edffff] text-center text-10 border-b border-[#005092]">
            <th className="font-medium w-[12.5%]">Tier</th>
            <th className="border-x border-[#005092] font-medium w-[12.5%]">
              {t('common.label.invites')}
            </th>
            <th className="font-medium w-1/4">{t('referral.label.firstRecharge')}</th>
            <th className="border-x border-[#005092] font-medium w-1/4">
              {t('common.label.bets')}
            </th>
            <th className="font-medium w-1/4">{t('referral.label.commission')}</th>
          </tr>
        </thead>
        <tbody>
          {agentSumReport.list.map((item: any) => (
            <TierRow
              key={item.tier}
              item={item}
              className={TIER_BG[item.tier] || TIER_BG.D}
            />
          ))}
          <tr>
            <td colSpan={5}>
              <div className="p-2 flex justify-between items-center font-bold bg-[#55f9ff]">
                <span className="text-xs">{t('referral.label.totalComm')}</span>
                <span className="text-sm">{formatCurrency(agentSumReport.commTotal, 0)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </Spin>
  )
}

export function useAgentSumReport() {
  const [sumReport, setSumReport] = useState<AgentSumReportData>({
    commTotal: 0,
    list: [],
  })
  const [sumDateRange, setSumDateRange] = useState<[Date, Date]>(() => getDateRange(1))
  const [sumReportLoading, setSumReportLoading] = useState(false)

  const fetchReport = useCallback(
    (range: [Date, Date] = sumDateRange) =>
      getAgentReport(
        Math.floor(range[0].getTime() / 1e3),
        Math.floor(range[1].getTime() / 1e3),
      ).then((res: any) =>
        setSumReport({ commTotal: res.commTotal ?? 0, list: res.tierList ?? [] }),
      ),
    [],
  )

  const handleDateRangeChange = useCallback(
    (range: [Date, Date]) => {
      withLoading(setSumReportLoading, fetchReport(range))
      setSumDateRange(range)
    },
    [fetchReport],
  )

  return {
    sumReport,
    sumReportLoading,
    sumDateRange,
    handleDateRangeChange,
    fetchReport,
  }
}

export default AgentSumReport
