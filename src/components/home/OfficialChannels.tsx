import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { SocialIcon } from '../shared/SpriteIcon'

const CHANNELS: { type: string; key: string; labelKey: string }[] = [
  { type: 'Whatsapp', key: 'wa_link', labelKey: 'referral.label.join' },
  { type: 'x', key: 'x_link', labelKey: 'referral.label.follow' },
  { type: 'Telegram', key: 'tg_link', labelKey: 'referral.label.join' },
  { type: 'Facebook', key: 'facebook_link', labelKey: 'referral.label.join' },
  { type: 'Ins', key: 'instagram_link', labelKey: 'referral.label.follow' },
]

const ChannelButton = ({ type, onPress, label }: { type: string; onPress: () => void; label: string }) => (
  <Button
    className="h-auto bg-white dark:bg-selected! rounded-lg flex flex-col items-center justify-center p-2 gap-0"
    onPress={onPress}
  >
    <SocialIcon size={40} type={type} />
    <div className="w-full h-4.5 mt-2 leading-4.5 rounded-full border border-black/40 dark:border-white/40 text-main text-10 font-black">
      {label}
    </div>
  </Button>
)

export const OfficialChannels = () => {
  const { t } = useTranslation()

  const channels = CHANNELS.map((c) => ({
    ...c,
    url: localStorage.getItem(c.key) || '',
  })).filter((c) => c.url)

  if (channels.length === 0) return null

  return (
    <div className="dark:bg-gray w-full p-3" id="OfficialChannel">
      <p className="font-bold text-sm mb-2 text-main">
        {t('home.label.officialChannel')}
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${channels.length}, minmax(0, 1fr))` }}
      >
        {channels.map((c) => (
          <ChannelButton
            key={c.key}
            type={c.type}
            onPress={() => window.open(c.url, '_blank')}
            label={t(c.labelKey)}
          />
        ))}
      </div>
    </div>
  )
}
