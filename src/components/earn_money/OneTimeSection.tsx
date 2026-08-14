import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { checkAuth } from '../../utils/helpers'
import { Section, ActionButton, SpriteIcon, AwardDisplay, ClaimHandler } from './earnMoneyShared'
import { OneTimeActivity } from '../../services/hallApi'

type OneTimeKey = 'bindPhone' | 'changeNick' | 'downloadApp' | 'changeAvatar' | 'addTG'

const onetimeConfig: Record<OneTimeKey, { titleKey: string; actKey: string; order: number; icon: string }> = {
  bindPhone: { titleKey: 'profile.label.boundPhoneNumber', actKey: 'earnMoney.label.bindNow', order: 2, icon: 'phone' },
  changeNick: { titleKey: 'earnMoney.label.changeNick', actKey: 'earnMoney.label.editNow', order: 3, icon: 'profile' },
  downloadApp: { titleKey: 'common.label.downloadApp', actKey: 'common.label.download', order: 4, icon: 'download' },
  changeAvatar: { titleKey: 'earnMoney.label.editAvatar', actKey: 'earnMoney.label.editNow', order: 5, icon: 'person' },
  addTG: { titleKey: 'earnMoney.label.addTg', actKey: 'earnMoney.label.addNow', order: 10, icon: 'tg' },
}
const onetimeKeys: OneTimeKey[] = ['bindPhone', 'changeNick', 'downloadApp', 'addTG', 'changeAvatar']

export const OneTimeSection = ({ data, onClaim }: { data?: OneTimeActivity; onClaim: ClaimHandler }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!data) return null

  return (
    <Section title={t('earnMoney.label.oneTimeTask')} desc={t('earnMoney.desc.oneTimeTask')} id="onetime">
      <div className="flex flex-col">
        {onetimeKeys.map((key) => {
          const cfg = onetimeConfig[key]
          const val = data[key]
          if (!val) return null
          return (
            <div key={key} className="h-12 not-first:mt-1 flex items-center" style={{ order: cfg.order }} data-act={`${data.actID}-${val.actKey}-${val.timeKey}`}>
              <div className="flex-1 flex items-center">
                <SpriteIcon pos={cfg.icon} className="size-7 shrink-0" />
                <div className="flex flex-col ml-2">
                  <p className="text-xs text-main font-bold">{t(cfg.titleKey)}</p>
                  <AwardDisplay type={val.awardType} num={key === 'downloadApp' ? '5~1000' : val.awardNum} />
                </div>
              </div>
              <ActionButton
                bordered={val.status !== 2}
                roundedFull
                className="min-w-17 h-7 text-10! px-2"
                onPress={() => {
                  if (!checkAuth()) return
                  if (val.status === 2) {
                    onClaim(data.actID, val.actKey, val.timeKey)
                  } else {
                    switch (key) {
                      case 'changeNick': case 'changeAvatar': case 'bindPhone':
                        navigate('/profile'); break
                      case 'addTG':
                        if (val.link) window.open(val.link, '_blank'); break
                      case 'downloadApp':
                        window.dispatchEvent(new CustomEvent('triggerDownload')); break
                    }
                  }
                }}
              >
                {t(val.status === 2 ? 'common.label.claim' : cfg.actKey)}
              </ActionButton>
            </div>
          )
        })}
      </div>

      <div className="flex px-9 flex-wrap -mt-1.5 *:mr-1 *:mb-1">
        {['earnMoney.label.tag1', 'earnMoney.label.tag2', 'earnMoney.label.tag3', 'earnMoney.label.tag4', 'earnMoney.label.tag5'].map((key) => (
          <span key={key} className="bg-primary/20! text-primary! text-8 px-1.5 py-0.5 rounded-full">{t(key)}</span>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-light-gray dark:bg-charcoal px-3 py-2">
        <div className="flex items-center mb-3">
          <SpriteIcon pos="download2" className="size-9 mr-2 shrink-0" />
          <p className="text-xs font-bold text-main">{t('earnMoney.rule.dlTg.title')}</p>
        </div>

        {[1, 2, 3].map((step) => (
          <div key={step} className="flex">
            <div className="self-stretch w-4 mr-2 shrink-0 relative flex flex-col items-center">
              <div className="bg-primary text-black text-11 flex items-center justify-center size-4 rounded-full">{step}</div>
              <div className={clsx('h-full absolute left-1.5 top-0 w-1 bg-primary/15', step === 3 && 'rounded-b-full')} />
            </div>
            <div className={step < 3 ? 'pb-4' : ''}>
              <p className="text-sm font-black text-main leading-4">{t('earnMoney.label.step')}{step}</p>
              <p className="text-10 my-2">{t(`earnMoney.rule.dlTg.step${step}`)}</p>
              {step === 1 && (
                <ActionButton className="h-7 text-10! mt-2" bordered roundedFull
                  onPress={() => {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
                    const url = isIOS
                      ? 'https://apps.apple.com/app/telegram-messenger/id686449807'
                      : 'https://play.google.com/store/apps/details?id=org.telegram.messenger'
                    window.open(url, '_blank')
                  }}>
                  {t('common.label.downloadSth', { sth: 'Telegram' })}
                </ActionButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
