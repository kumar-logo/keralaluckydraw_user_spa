import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { Section, ActionButton, SpriteIcon, ClaimHandler } from './earnMoneyShared'
import { RebateActivity } from '../../services/hallApi'

export const RebateSection = ({ data, onClaim }: { data?: RebateActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const actID = data?.actID ?? 0

  return (
    <Section
      title={t('common.label.rebate')}
      desc={t('earnMoney.desc.rebate')}
      id="EarnMoneyRebate"
      rightNode={
        <ActionButton roundedFull bordered className="h-7 text-10! px-3" onPress={() => navigate('/rebate')}>
          {t('common.label.history')}
        </ActionButton>
      }
    >
      {data?.info?.map((item) => (
        <div key={item.id} className="mt-2 py-1 flex items-center justify-between text-10 h-9">
          <div className="flex items-center">
            {formatDate(item.createTime, 'Mon dd')}
            <SpriteIcon pos="goldCoin" className="size-3 ml-2 mr-1" scale={0.75} />
            <span className="text-primary font-black text-xs">{formatCurrency(item.rebateAmount)}</span>
          </div>
          <ActionButton className="h-7 min-w-17 text-10!" roundedFull onPress={() => onClaim(actID, item.actKey, item.timeKey)}>
            {t('common.label.claim')}
          </ActionButton>
        </div>
      ))}
      {(!data?.info || data.info.length === 0) && (
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold text-main text-center my-3 px-4"
            dangerouslySetInnerHTML={{ __html: t('earnMoney.desc.rebateEmpty') }} />
          <ActionButton className="text-10! h-7 px-7" roundedFull onPress={() => navigate('/index/home')}>
            {t('earnMoney.label.goBet')}
          </ActionButton>
        </div>
      )}
    </Section>
  )
}
