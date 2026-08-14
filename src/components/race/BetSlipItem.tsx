import { useTranslation } from 'react-i18next'
import { Button, Input } from '@nextui-org/react'
import { PlayerBadge, GroupBadge, RankBadge } from './Badges'
import { stateNames, getRunnerState, CURRENCY } from '../../config/raceConstants'
import { formatCurrency } from '../../utils/format'
import { DeleteIcon } from '../shared/DeleteIcon'

export const RaceBetSlipItem = ({ orderType, amount, no, state, odds, single, onDelete, updateAmount }: {
  orderType: number
  amount: number
  no: number[]
  state: number
  odds: number
  single: boolean
  onDelete: () => void
  updateAmount: (v: string) => void
}) => {
  const { t } = useTranslation()

  return (
    <div className="bg-light-gray dark:bg-gray p-3 rounded-lg last:mb-0 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {orderType === 3 ? (
            <>
              <GroupBadge state={state} />
              <span className="text-main font-bold ml-2">{stateNames[state]}</span>
            </>
          ) : no.length > 1 ? (
            no.map((runnerNo, rank) => (
              <div key={runnerNo} className="flex items-center mr-5">
                <RankBadge no={rank} />
                <div className="mx-1"><PlayerBadge size={22} state={getRunnerState(runnerNo, single)} /></div>
                <span className="text-sm font-bold">{runnerNo}</span>
              </div>
            ))
          ) : (
            <>
              <PlayerBadge size={22} state={state} />
              <span className="text-main font-bold ml-2">{no}</span>
            </>
          )}
        </div>
        <DeleteIcon onClick={onDelete} />
      </div>

      <div className="my-3 flex items-center">
        <div className="flex-1 mr-2">
          <Input
            className="h-7 rounded-sm border border-gray dark:border-acc text-main"
            classNames={{
              inputWrapper: 'min-h-0! flex px-2 items-center justify-center',
              input: 'text-xs font-bold ps-0!',
            }}
            startContent={<p className="text-xs">{CURRENCY}</p>}
            max={1000}
            min={10}
            value={amount + ''}
            onValueChange={(val: string) => updateAmount(val.replace(/[^0-9]/g, ''))}
          />
        </div>
        <Button
          className="h-7 border border-primary text-primary font-bold text-xs rounded-sm px-6"
          onPress={() => updateAmount('1000')}
        >
          MAX
        </Button>
      </div>

      <div className="flex items-center">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="font-black">{formatCurrency(amount, 0)}</div>
          <div className="text-10 capitalize">{t('common.label.pay')}</div>
        </div>
        <div className="w-px bg-gray h-4" />
        <div className="flex-1 flex flex-col items-center justify-center text-primary">
          <div className="font-black">{formatCurrency(amount * odds, 0)}</div>
          <div className="text-10 capitalize">{t('common.label.win')}</div>
        </div>
      </div>
    </div>
  )
}
