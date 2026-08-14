import { useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TopBarWrapper as TopBar } from '../components/shared/TopBarWrapper'
import { useDigitPositionConfigStore } from '../stores/digitPositionConfigStore'
import { OrderRecord } from '../components/order_detail/orderDetailTypes'
import { useStoredOrder } from '../components/order_detail/useStoredOrder'
import { ColorBetDetail } from '../components/color/ColorBetDetail'
import { DiceBetDetail } from '../components/dice/DiceBetDetail'
import { ThreeDigitBetDetail } from '../components/three_digit/ThreeDigitBetDetail'
import { FourFiveDigitBetDetail } from '../components/four_five_digit/FourFiveDigitBetDetail'
import { KeralaBetDetail } from '../components/kerala/KeralaBetDetail'
import { DubaiBetDetail } from '../components/dubai/DubaiBetDetail'
import { RaceBetDetail } from '../components/race/RaceBetDetail'

const DETAIL_BY_TYPE: Record<string, (props: { order: OrderRecord }) => ReactNode> = {
  kerala: KeralaBetDetail,
  digit: ThreeDigitBetDetail,
  '45d': FourFiveDigitBetDetail,
  color: ColorBetDetail,
  dice: DiceBetDetail,
  race: RaceBetDetail,
  dubai: DubaiBetDetail,
}

export const MyBetDetailPage = () => {
  const { t } = useTranslation()
  const order = useStoredOrder()
  const fetchPositionConfigs = useDigitPositionConfigStore((s) => s.fetchConfigs)
  const type = new URLSearchParams(window.location.search).get('type') || ''
  const Detail = DETAIL_BY_TYPE[type]

  useEffect(() => {
    if (type === 'digit' || type === '45d') fetchPositionConfigs()
  }, [type, fetchPositionConfigs])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <TopBar title={t('myBets.details.title')} rightNodeType="service" />
      {order && Detail ? <Detail order={order} /> : null}
    </div>
  )
}

export default MyBetDetailPage
