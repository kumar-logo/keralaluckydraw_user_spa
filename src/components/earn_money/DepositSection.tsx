import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScrollShadow } from '@nextui-org/react'
import clsx from 'clsx'
import { Section, ActionButton, NotificationDot, CURRENCY_SYMBOL, ClaimHandler } from './earnMoneyShared'
import { DepositActivity } from '../../services/hallApi'

export const DepositSection = ({ data, onClaim, onRecharge }: {
  data?: DepositActivity; onClaim: ClaimHandler; onRecharge: (tab: string, min: string) => void
}) => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [activeDay, setActiveDay] = useState(data?.curDayIndex || 1)

  useEffect(() => {
    const actID = searchParams.get('actID')
    if (actID) {
      if (actID !== data?.actID + '') return
      const actKey = searchParams.get('actKey')
      const found = data?.content?.find((d) => d.levelList.find((h) => h.actKey === actKey))
      if (found) {
        setActiveDay(found.day)
        return
      }
    }
    if (data && data.curDayIndex < activeDay) setActiveDay(data.curDayIndex)
  }, [data, activeDay, searchParams])

  const hasClaimable = useMemo(() => {
    if (!data?.content) return {}
    return data.content.reduce((acc: Record<number, boolean>, d) => {
      acc[d.day] = d.levelList.some((u) => u.status === 2)
      return acc
    }, {})
  }, [data])

  const levelList = useMemo(() => {
    if (!data?.content) return []
    const found = data.content.find((d) => d.day === activeDay)
    return found?.levelList || data.content[0].levelList
  }, [data, activeDay])

  if (!data?.content) return null

  return (
    <Section
      title={t('earnMoney.label.deposit')}
      desc={t('earnMoney.desc.deposit')}
      id="deposit"
      ruleRender={
        <div>
          <ul className="list-decimal text-xs pl-4 **:[p]:mt-1 **:[p]:mb-2">
            <li>{t('earnMoney.rule.deposit.rule1')}<p>{t('earnMoney.rule.deposit.rule1desc')}</p></li>
            <li>{t('earnMoney.rule.deposit.rule2')}<p>{t('earnMoney.rule.deposit.rule2desc')}</p></li>
            <li>{t('earnMoney.rule.deposit.rule3')}<p>{t('earnMoney.rule.deposit.rule3desc')}</p></li>
            <li>{t('earnMoney.rule.deposit.rule4')}<p>{t('earnMoney.rule.deposit.rule4desc')}</p></li>
            <li>{t('earnMoney.rule.deposit.rule5')}<p>{t('earnMoney.rule.deposit.rule5desc')}</p></li>
            <li>{t('earnMoney.rule.deposit.rule6')}</li>
          </ul>
        </div>
      }
    >
      <ScrollShadow orientation="horizontal" className="flex pt-2 pb-1 -mt-2">
        {data.content.map((x, d) => (
          <div
            key={x.day + '' + d}
            className={clsx(
              'px-4.5 py-2 relative text-xs font-bold duration-200 rounded not-first:ml-2',
              x.day === activeDay ? 'text-black bg-primary' : 'text-main bg-selected',
              x.day > data.curDayIndex && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => { if (x.day <= data.curDayIndex) setActiveDay(x.day) }}
          >
            Day{x.day}
            {hasClaimable[x.day] ? (
              <div className="absolute -right-1 -top-1">
                <NotificationDot ping />
              </div>
            ) : null}
            <div className="absolute -bottom-2 left-0 w-full flex justify-center">
              <div className={clsx('border-[0.25rem] border-transparent duration-200', x.day === activeDay && 'border-t-primary')} />
            </div>
          </div>
        ))}
      </ScrollShadow>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {levelList.map((x, d) => (
          <div key={x.actKey + '' + d} className="bg-selected py-2 flex flex-col items-center justify-center rounded" data-act={x.actKey ? `${data.actID}-${x.actKey}-${x.timeKey}` : ''}>
            <p className="text-main text-10 din">{CURRENCY_SYMBOL}{x.min}-{CURRENCY_SYMBOL}{x.max}</p>
            <p className="my-1.5 text-bg-sec text-10 font-bold din">Extra: {(x.awardPer * 100).toFixed(0)}%</p>
            <ActionButton
              isDisabled={activeDay !== data.curDayIndex && x.status !== 2}
              onPress={() => {
                if (x.status === 2) onClaim(data.actID, x.actKey, x.timeKey); else onRecharge('deposit', x.min + '')
              }}
              className={clsx('h-5 rounded-full text-10! font-bold px-2 py-0 min-w-16',
                x.status === 2 || x.status === 3
                  ? 'bg-primary text-black'
                  : 'bg-transparent text-primary border border-primary'
              )}
            >
              {t(x.status === 3 ? 'common.label.claimed' : x.status === 2 ? 'common.label.claim' : 'common.label.recharge')}
            </ActionButton>
          </div>
        ))}
      </div>
    </Section>
  )
}
