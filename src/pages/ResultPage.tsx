import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useLocation } from 'react-router-dom'
import { TopBarWrapper as TopBar } from '../components/shared/TopBarWrapper'
import { ScrollableTabs } from '../components/shared/ScrollableTabs'
import { useResultSubBarStore } from '../stores/resultSubBarStore'
import { KeralaResult } from '../components/result/KeralaResult'
import { DubaiResult } from '../components/result/DubaiResult'
import { ThreeDigitResult } from '../components/result/ThreeDigitResult'
import { FourFiveDigitResult } from '../components/result/FourFiveDigitResult'
import { QuickDigitsResult } from '../components/result/QuickDigitsResult'
import { ColorResult } from '../components/result/ColorResult'
import { DiceResult } from '../components/result/DiceResult'

export const ResultPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { pathname } = useLocation()
  const subBarKey = useResultSubBarStore((s) => s.subBarKey)
  const setSubBarKey = useResultSubBarStore((s) => s.setSubBarKey)
  const isIndexEmbed = useMemo(() => pathname.indexOf('/index/') > -1, [pathname])

  useEffect(() => {
    const key = searchParams.get('key')
    if (key) setSubBarKey(key)
  }, [searchParams, setSubBarKey])

  const tabs = useMemo(
    () => [
      { render: t('result.digit.title'), key: '3digit' },
      { render: t('result.quickDigits.title'), key: 'quickDigits' },
      { render: t('common.label.games.kerala'), key: 'kerala' },
      { render: t('result.dubai.title'), key: 'dubai' },
      { render: t('result.mixDigit.title'), key: '45d' },
      { render: t('wingo.title'), key: 'color' },
      { render: t('k3.title.default'), key: 'dice' },
    ],
    [t]
  )

  return (
    <div className="result bg-light-gray flex flex-col overflow-hidden flex-1">
      <TopBar hideBack={isIndexEmbed} title={t('common.label.result')} rightNodeType="service" />

      <ScrollableTabs
        tabOptions={tabs}
        activeKey={subBarKey}
        onTabChange={setSubBarKey}
        className="bg-white dark:bg-light-gray h-10 flex items-end sticky top-0 z-20"
        indicatorClassName="bg-primary h-0.5!"
        indicatorDesignWidth={20}
        tabItemActiveClassName="text-bg-main! font-bold"
        tabItemClassName="text-sm text-sec whitespace-nowrap"
        tabItemWrapClassName="pb-2"
      />

      <div
        className="w-full h-4 -mt-4 pointer-events-none"
        style={{ boxShadow: ' rgba(0, 0, 0, 0.1) 0px 4px 16px 0px' }}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {subBarKey === 'dice' && <DiceResult />}
        {subBarKey === 'color' && <ColorResult />}
        {subBarKey === '3digit' && <ThreeDigitResult />}
        {subBarKey === '45d' && <FourFiveDigitResult />}
        {subBarKey === 'quickDigits' && <QuickDigitsResult />}
        {subBarKey === 'kerala' && <KeralaResult gameCode="kerala" />}
        {subBarKey === 'punjab' && <KeralaResult gameCode="punjab" />}
        {subBarKey === 'dubai' && <DubaiResult />}
      </div>
    </div>
  )
}

export default ResultPage
