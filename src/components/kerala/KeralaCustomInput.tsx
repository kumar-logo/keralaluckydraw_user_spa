import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { KeralaSection } from './KeralaSection'
import { PlusIcon } from '../shared/PlusIcon'

const DigitCircle = ({ digit }: { digit?: string }) => (
  <div
    style={{ boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25) inset' }}
    className="flex justify-center items-center size-9 rounded-full border border-text-main/40"
  >
    <p className="font-bold text-main">{digit || '-'}</p>
  </div>
)

interface KeralaCustomInputProps {
  first?: string
  customCode?: string[]
  onSelect?: () => void
  onReset?: () => void
  onCustomAdd?: () => void
}

export function KeralaCustomInput({
  first = '-',
  customCode,
  onSelect,
  onReset,
  onCustomAdd,
}: KeralaCustomInputProps) {
  const { t } = useTranslation()

  return (
    <KeralaSection
      title={t('common.tip.info.customTickets')}
      right={
        <Button
          onPress={onReset}
          isDisabled={customCode?.[0] === '-'}
          className="px-3 h-8 py-2 bg-transparent rounded-sm border border-[#9FA5AC] font-bold text-xs"
        >
          Reset
        </Button>
      }
    >
      <div
        className="flex p-3 justify-between items-center"
        onClick={onSelect}
      >
        <div className="w-9 h-9 flex justify-center items-center">
          <p className="font-bold text-main">{first}</p>
        </div>
        {customCode?.map((digit, index) => (
          <DigitCircle key={index} digit={digit === '-' ? '' : digit} />
        ))}
      </div>

      <div className="p-2">
        <div className="bg-charcoal p-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-main">
              {t('common.tip.info.selectNumber')}
            </p>
            <p className="text-xs font-bold">
              {t('common.tip.info.selectNumberTip', { num: 7 })}
            </p>
          </div>
          <Button
            onPress={onCustomAdd}
            isDisabled={customCode?.[0] === '-'}
            className="rounded-full bg-primary text-black text-sm font-bold py-3 px-5 flex items-center gap-0"
          >
            <PlusIcon className="text-black mr-1" />
            {t('common.label.games.add')}
          </Button>
        </div>
      </div>
    </KeralaSection>
  )
}
