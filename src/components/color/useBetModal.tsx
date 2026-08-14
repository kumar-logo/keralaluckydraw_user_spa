import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalContent,
  useDisclosure,
  RadioGroup,
  Button,
} from '@nextui-org/react'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/format'
import { toast } from '../../utils/toast'
import { checkInsufficientBalance } from '../../utils/balanceCheck'
import { fetchAndSyncBalance } from '../../utils/fetchBalance'
import { debounce, withLoading, checkAuth } from '../../utils/helpers'
import { FullBall } from '../shared/WingoBall'
import { AmountRadio } from '../shared/AmountRadio'
import { MultiplierRadio } from '../shared/MultiplierRadio'
import { CounterButton } from '../shared/CounterButton'
import { CountInput } from '../shared/CountInput'
import { PreSaleCheckbox } from '../shared/PreSaleCheckbox'
import { usePreSaleRule } from '../shared/PreSaleRule'
import { createColorOrder } from '../../services/colorApi'
import type { ColorGameInfoDto } from '../../services/colorApi'

const AMOUNT_OPTIONS = [
  { label: formatCurrency(10, 0), value: '10' },
  { label: formatCurrency(100, 0), value: '100' },
  { label: formatCurrency(500, 0), value: '500' },
  { label: formatCurrency(1000, 0), value: '1000' },
]

const MULTIPLIER_OPTIONS = [
  { label: 'x1', value: '1' },
  { label: 'x3', value: '3' },
  { label: 'x9', value: '9' },
  { label: 'x27', value: '27' },
  { label: 'x81', value: '81' },
  { label: 'x243', value: '243' },
  { label: 'x729', value: '729' },
]

export function useBetModal(
  onSuccess?: (item: string | number) => void,
  isBonus?: boolean
) {
  const [ballNode, setBallNode] = useState<React.ReactNode>()
  const { t } = useTranslation()
  const [betItem, setBetItem] = useState<string | number>()
  const [amount, setAmount] = useState('10')
  const [multiplier, setMultiplier] = useState('1')
  const [agreed, setAgreed] = useState(true)
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()

  const handlePreSaleClose = () => {
    setAgreed(true)
  }

  const { show: showPreSale, hide: hidePreSale, render: preSaleRender } = usePreSaleRule({
    onClose: handlePreSaleClose,
  })

  const totalAmount = useMemo(() => (+amount || 0) * (+multiplier || 0), [amount, multiplier])
  const loading = useAuthStore((s) => s.loading)
  const setLoading = useAuthStore((s) => s.setLoading)
  const gameInfoRef = useRef<ColorGameInfoDto | undefined>(void 0)

  const show = ({
    selectBtnContent,
    gameInfo,
  }: {
    selectBtnContent: string | number
    gameInfo: ColorGameInfoDto
  }) => {
    setBallNode(<FullBall content={selectBtnContent} size={52} />)
    setBetItem(selectBtnContent)
    setAmount('10')
    setMultiplier('1')
    onOpen()
    gameInfoRef.current = gameInfo
  }

  const close = () => {
    hidePreSale()
    onClose()
  }

  const handlePay = debounce(async () => {
    if (loading || !gameInfoRef.current) return
    if (!gameInfoRef.current || betItem == null || amount === '' || multiplier === '') {
      toast.show({ icon: 'warning', message: t('pay.tip.require') })
      return
    }
    if (totalAmount < 10) {
      toast.show({ icon: 'warning', message: t('pay.tip.least', { money: 10 }) })
      return
    }
    if (!agreed) {
      showPreSale()
      return
    }
    if (!checkAuth()) return

    const item = String(betItem).toLowerCase()
    const roundNo = gameInfoRef.current.roundNo
    if (!roundNo) return

    if (
      checkInsufficientBalance(
        totalAmount,
        `wingo_${gameInfoRef.current.colorID}_${item}${isBonus ? '_bonus' : ''}`,
        !!isBonus
      )
    )
      return

    withLoading(
      setLoading,
      createColorOrder({
        colorID: gameInfoRef.current.colorID,
        roundNo,
        amount: totalAmount,
        betItem: item + '',
        multiples: 1,
      }).then(() => {
        toast.success(t('pay.tip.paysuccess'))
        setMultiplier('1')
        fetchAndSyncBalance()
        onSuccess?.(betItem!)
        close()
      })
    )
  })

  return {
    renderModal: (
      <Modal
        placement="bottom"
        backdrop="opaque"
        classNames={{
          base: 'color m-0 rounded-t-lg',
        }}
        radius="none"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton
      >
        <ModalContent>

          <div className="flex justify-between pt-5 px-5 pb-3 items-center">
            <span className="font-bold text-sm">{t('common.label.bet')}</span>
            <div onClick={close} className="size-6 text-sec-acc">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.8359 8.7071C17.2265 8.31657 17.2265 7.6834 16.8359 7.29288C16.4454 6.90237 15.8122 6.90237 15.4217 7.2929L12.0644 10.6503L8.70712 7.2929C8.3166 6.90237 7.68343 6.90237 7.2929 7.29288C6.90237 7.6834 6.90237 8.31657 7.29288 8.7071L10.6502 12.0645L7.29288 15.4219C6.90237 15.8125 6.90237 16.4456 7.2929 16.8361C7.68343 17.2267 8.3166 17.2267 8.70712 16.8361L12.0644 13.4787L15.4217 16.8361C15.8122 17.2267 16.4454 17.2267 16.8359 16.8361C17.2265 16.4456 17.2265 15.8125 16.8359 15.4219L13.4786 12.0645L16.8359 8.7071Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-center items-center p-3">{ballNode}</div>

          <div className="px-5 mb-5">

            <RadioGroup
              orientation="horizontal"
              classNames={{
                base: 'w-full',
                wrapper: 'justify-between w-full *:not-last:mr-2 gap-0',
              }}
              value={amount}
              onValueChange={setAmount}
            >
              {AMOUNT_OPTIONS.map((opt) => (
                <AmountRadio key={opt.value} value={opt.value}>
                  {opt.label}
                </AmountRadio>
              ))}
            </RadioGroup>

            <div className="bg-light-gray dark:bg-charcoal mt-3 p-3 flex flex-col rounded">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-sec font-bold">
                  {t('pay.label.quantity')}
                </span>
                <div className="h-10 flex items-center">
                  <CounterButton
                    name="minus"
                    onClick={() => setMultiplier((v) => (+v - 1 + ''))}
                    disabled={+multiplier <= 1}
                  />
                  <CountInput
                    className="w-29 mx-1"
                    value={multiplier}
                    onChange={setMultiplier}
                  />
                  <CounterButton
                    name="plus"
                    onClick={() => setMultiplier((v) => (+v + 1 + ''))}
                    disabled={+multiplier >= 99999}
                  />
                </div>
              </div>

              <RadioGroup
                orientation="horizontal"
                classNames={{
                  base: 'w-full',
                  wrapper: 'justify-between w-full *:not-last:mr-1 gap-0',
                }}
                value={multiplier}
                onValueChange={setMultiplier}
              >
                {MULTIPLIER_OPTIONS.map((opt) => (
                  <MultiplierRadio key={opt.value} value={opt.value}>
                    {opt.label}
                  </MultiplierRadio>
                ))}
              </RadioGroup>
            </div>

            <div className="mt-4">
              <PreSaleCheckbox
                checked={agreed}
                onCheck={(v) => setAgreed(v)}
                label={
                  <div className="flex items-center text-xs text-sec">
                    <div>{t('pay.label.agree')}</div>
                    <div
                      className="text-primary font-bold underline ml-2"
                      onClick={(e) => {
                        showPreSale()
                        e.stopPropagation()
                      }}
                    >
                      {t('pay.label.preSaleRule')}
                    </div>
                  </div>
                }
              />
            </div>

            <Button
              className={`px-0 min-w-0 gap-0 h-12 rounded-full bg-linear-primary-tb shadow-btn-primary flex items-center justify-center text-sm font-bold text-black w-full mt-4 ${totalAmount ? '' : 'opacity-30'}`}
              disabled={!totalAmount}
              onPress={handlePay}
            >
              {`${t('pay.label.total')} ${formatCurrency(totalAmount, 0)}`}
            </Button>

            {preSaleRender}
          </div>
        </ModalContent>
      </Modal>
    ),
    show,
    hide: close,
  }
}
