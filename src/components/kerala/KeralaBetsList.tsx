import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { KeralaSection } from './KeralaSection'
import { KeralaCodeBadge } from './KeralaCodeBadge'
import { DeleteConfirm } from '../shared/DeleteConfirm'
import { DeleteIcon } from '../shared/DeleteIcon'
import { PlusIcon } from '../shared/PlusIcon'

interface KeralaBetsListProps {
  betsList?: string[]
  onBets?: (count: number) => void
  onClear?: () => void
  onDelItem?: (index: number) => void
  isInsurance?: boolean
}

export function KeralaBetsList({
  betsList = [],
  onBets,
  onClear,
  onDelItem,
  isInsurance = false,
}: KeralaBetsListProps) {
  const { t } = useTranslation()

  const title = `${t('common.label.games.shoppingCart')} (${betsList.length})`

  const rightNode = isInsurance ? (
    <Fragment />
  ) : (
    <DeleteConfirm
      onDel={() => onClear?.()}
      isDisabled={betsList.length === 0}
      className="px-3 h-8 py-2 bg-transparent rounded-sm"
    >
      <DeleteIcon className="size-4 text-sec-acc" />
    </DeleteConfirm>
  )

  return (
    <KeralaSection title={title} right={rightNode}>
      {betsList.length ? (
        <div className="flex flex-wrap px-2 py-3 justify-between gap-y-3 max-h-52 overflow-auto">
          {betsList.map((digit, index) => (
            <KeralaCodeBadge
              key={index}
              isInsurance={isInsurance}
              digit={digit}
              onDel={() => onDelItem?.(index)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-3 text-sm text-acc">
          <p>{t('common.tip.warn.notAddNums')}</p>
        </div>
      )}

      {!isInsurance && (
        <div className="flex px-3 pb-3 pt-0 mt-3">
          <Button
            onPress={() => onBets?.(10)}
            className="flex flex-1 py-3 font-bold text-sm text-primary rounded-lg border border-primary bg-selected"
          >
            10 {t('common.label.games.picks')}
          </Button>
          <Button
            onPress={() => onBets?.(25)}
            className="flex flex-1 py-3 font-bold text-sm text-primary rounded-lg border border-primary bg-selected mx-2"
          >
            25 {t('common.label.games.picks')}
          </Button>
          <Button
            onPress={() => onBets?.(1)}
            className="flex flex-1 py-3 font-bold text-sm text-primary rounded-lg border border-primary bg-selected items-center"
          >
            <div className="flex items-center gap-x-1">
              <PlusIcon className="text-primary" />
              {t('common.label.games.quickAdd')}
            </div>
          </Button>
        </div>
      )}
    </KeralaSection>
  )
}
