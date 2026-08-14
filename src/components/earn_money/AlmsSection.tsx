import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { formatCurrency } from '../../utils/format'
import { Section, ActionButton, AwardDisplay, ClaimHandler } from './earnMoneyShared'
import { AlmsActivity, AlmsEntry } from '../../services/hallApi'

interface AlmsItem extends AlmsEntry {
  span: number
}

export const AlmsSection = ({ data, onClaim }: { data?: AlmsActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()

  const [totalAmount, items] = useMemo<[number, AlmsItem[]]>(() => {
    if (!data?.content?.length) return [0, []]
    const { content } = data
    const total = content.reduce((acc, entry) => acc + (entry.award ?? 0), 0)
    const count = content.length
    const mapped = content.map((entry, d) => {
      const span = count === 4 && d >= 3 ? 6 : count === 5 && d >= 3 ? 3 : 2
      return { ...entry, span }
    })
    return [total, mapped]
  }, [data])

  if (!data?.content?.length) return null

  return (
    <Section title={t('earnMoney.label.reliefFunds')} desc={t('earnMoney.desc.reliefFunds')} id="alms">
      <div className="bg-selected h-10 px-3 flex items-center justify-between rounded">
        <div className="text-main text-10 font-bold">Total Refund Amount</div>
        <div className="text-primary font-black din text-base">{formatCurrency(totalAmount, 2, true)}</div>
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {items.map((item, i) => (
          <div
            key={item.actKey + '' + i}
            data-act={`${data.actID}-${item.actKey}-${item.timeKey}`}
            className={clsx('p-2 rounded bg-selected', item.span < 6 ? 'flex flex-col items-center' : 'flex items-center')}
            style={{ gridColumn: `span ${item.span}` }}
          >
            <div className={clsx('flex items-center justify-between', item.span < 6 ? 'w-full mb-2' : 'flex-1 mr-2')}>
              <p className="text-10 font-bold text-main">Day {item.dayIndex}</p>
              <AwardDisplay type={item.awardType} num={item.award} />
            </div>
            <ActionButton
              className="h-7 text-10!"
              roundedFull
              bordered={item.status === 1 || item.status === 0}
              isDisabled={item.status !== 2}
              onPress={() => { if (item.status === 2) onClaim(data.actID, item.actKey, item.timeKey) }}
            >
              {t(item.status === 3 ? 'common.label.claimed' : item.status === 2 ? 'common.label.claim' : item.status === 10 ? 'common.label.expired' : 'common.label.unlock')}
            </ActionButton>
          </div>
        ))}
      </div>
    </Section>
  )
}
