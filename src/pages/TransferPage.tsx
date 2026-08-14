import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@nextui-org/react'
import { getTransferList, transferBalance, type TransferInfoDto } from '../services/financeApi'
import { toast } from '../utils/toast'
import { formatCurrency } from '../utils/format'
import { withLoading } from '../utils/helpers'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { evaluateTransfer } from '../utils/transferValidation'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Spin } from '../components/shared/Spin'

const QUICK_AMOUNTS = [100, 200, 500, 1000]

export const TransferPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<TransferInfoDto | null>(null)
  const [amount, setAmount] = useState('')

  const fetchInfo = useCallback(
    () => getTransferList().then((data) => setInfo(data)),
    []
  )

  useEffect(() => {
    withLoading(setLoading, fetchInfo())
  }, [fetchInfo])

  const withdrawableBalance = info?.withdrawableBalance ?? 0
  const minAmount = info?.minAmount ?? 0
  const maxAmount = info?.maxAmount ?? 0

  const num = Number(amount)
  const tier = info?.list.find((p) => p.maxAmount >= num && p.minAmount <= num)
  const receiveAmount = num * (1 + (tier?.pct ?? 0))

  const { maxTransferable, isValid, errorKey } = evaluateTransfer(amount, {
    withdrawableBalance,
    minAmount,
    maxAmount,
  })

  const handleSubmit = () => {
    withLoading(
      setSubmitting,
      transferBalance(num).then(() => {
        toast.success(t('recharge.transfer.suc'))
        setAmount('')
        fetchAndSyncBalance()
        fetchInfo()
      })
    )
  }

  const isDisabled = !isValid

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBarWrapper title={t('common.label.transfer')} rightNode={null} rightNodeType="service" />

      <Spin className="overflow-auto flex-1 flex-col" loading={loading}>
        <div className="flex flex-col flex-1 overflow-y-auto p-2 text-black">
          <div className="flex flex-col p-5 bg-linear-primary-tr rounded-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs opacity-70">{t('recharge.transfer.balance')}</div>
                <div className="flex">
                  <div className="din font-bold text-2xl">{formatCurrency(withdrawableBalance)}</div>
                </div>
              </div>
              <div className="flex items-center" onClick={() => navigate('/record/transfer')}>
                <div className="capitalize w-20 text-xs mr-3 text-right rtl:text-left rtl:ml-3 rtl:mr-0">
                  {t('recharge.transfer.transferRecords')}
                </div>
                <svg viewBox="0 0 14 14" className="size-3.5 rtl:rotate-180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray relative flex flex-col mt-3 p-3">
            <div className="text-sm text-main mb-2">{t('recharge.transfer.action.title')}</div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minAmount}
              max={maxAmount}
              className="outline-hidden w-full h-12 rounded-sm border border-gray dark:border-text-sec bg-selected text-main py-2 px-3 mb-2"
              type="number"
              placeholder={t('recharge.transfer.placeholder') + formatCurrency(withdrawableBalance)}
            />
            <div
              className="max-btn text-primary text-sm font-bold absolute right-6 top-13 uppercase rtl:right-auto rtl:left-6"
              style={{ opacity: num >= withdrawableBalance ? 0.3 : 1 }}
              onClick={() => setAmount('' + maxTransferable)}
            >
              {t('common.label.max')}
            </div>
            {errorKey ? (
              <div className="text-xs text-danger mb-2">
                {t(errorKey, { min: formatCurrency(minAmount), max: formatCurrency(maxTransferable) })}
              </div>
            ) : null}
            <div className="text-sm text-acc border-b border-gray pb-3">
              {t('recharge.transfer.action.received')}
              <span className="text-main font-bold">{formatCurrency(receiveAmount)}</span>
            </div>
            <div className="pt-2 pb-2 gap-2 flex items-center justify-between">
              {QUICK_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  className="flex-1 rounded-sm font-bold text-main bg-selected"
                  onPress={() => setAmount('' + value)}
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="text-xs dark:text-sec">{t('recharge.transfer.action.tip')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray pl-5 pr-5 pt-3 pb-3">
          <div className="text-acc text-sm h-6 mb-3 flex items-center justify-center">
            {t('recharge.transfer.get')}
            <span className="ml-1 text-primary text-xl font-bold">{formatCurrency(receiveAmount)}</span>
          </div>
          <Button
            isLoading={submitting}
            isDisabled={isDisabled}
            onPress={handleSubmit}
            className="bg-linear-primary-tr shadow-btn-primary text-sm font-bold w-full h-12 text-black rounded-full"
          >
            {t('common.label.confirm')}
          </Button>
        </div>
      </Spin>
    </div>
  )
}

export default TransferPage
