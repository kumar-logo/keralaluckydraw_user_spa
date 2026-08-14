import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@nextui-org/react'
import { getWithdrawPanel, getCardList, withdrawBalance, type BankCardDto, type WithdrawPanelDto } from '../services/financeApi'
import { toast } from '../utils/toast'
import { formatCurrency } from '../utils/format'
import { withLoading } from '../utils/helpers'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Spin } from '../components/shared/Spin'

const DEFAULT_WITHDRAW_FEE_RATE = 0.03

export const WithdrawPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cards, setCards] = useState<BankCardDto[]>([])
  const [selectedCard, setSelectedCard] = useState<BankCardDto | null>(null)
  const [panel, setPanel] = useState<WithdrawPanelDto | null>(null)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    fetchAndSyncBalance()
    Promise.all([getWithdrawPanel(), getCardList()])
      .then(([panelData, cardData]) => {
        setPanel(panelData)
        const cardList = Array.isArray(cardData) ? cardData : cardData.list ?? []
        setCards(cardList)
        if (cardList.length > 0) setSelectedCard(cardList[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = () => {
    if (!selectedCard) {
      toast.warning(t('withdraw.tip.selectCard'))
      return
    }
    const num = Number(amount)
    if (!num || num <= 0) {
      toast.warning(t('withdraw.tip.enterAmount', 'Please enter a valid amount'))
      return
    }
    if (panel && num < panel.minAmount) {
      toast.warning(t('withdraw.tip.minAmount', { amount: formatCurrency(panel.minAmount, 0) }))
      return
    }
    if (panel && num > panel.maxAmount) {
      toast.warning(t('withdraw.tip.maxAmount', { amount: formatCurrency(panel.maxAmount, 0) }))
      return
    }
    if (panel && num > Number(panel.withdrawBalance)) {
      toast.warning(t('withdraw.tip.insufficientBalance'))
      return
    }
    withLoading(setSubmitting, withdrawBalance(selectedCard.id, num).then(() => {
      fetchAndSyncBalance()
      navigate('/withdraw/success', { state: { amount: num } })
    }))
  }

  const feeRate = panel ? panel.withdrawFeeRate : DEFAULT_WITHDRAW_FEE_RATE

  const amountNum = Number(amount)
  const amountError = !amount
    ? ''
    : !amountNum || amountNum <= 0
      ? t('withdraw.tip.enterAmount', 'Please enter a valid amount')
      : panel && amountNum < panel.minAmount
        ? t('withdraw.tip.minAmount', { amount: formatCurrency(panel.minAmount, 0) })
        : panel && amountNum > panel.maxAmount
          ? t('withdraw.tip.maxAmount', { amount: formatCurrency(panel.maxAmount, 0) })
          : panel && amountNum > Number(panel.withdrawBalance)
            ? t('withdraw.tip.insufficientBalance')
            : ''
  const canSubmit = !!selectedCard && amountNum > 0 && !amountError

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <TopBarWrapper title={t('common.label.withdraw')} rightNode={null} rightNodeType="service" />

      <Spin className="flex-1 overflow-hidden flex-col" loading={loading}>
        <div className="flex flex-col flex-1 overflow-auto p-2 gap-y-2">

          <div className="flex flex-col justify-between p-5 bg-linear-primary-tr rounded-sm text-black">
            <div className="card-top flex justify-between items-center px-2">
              <div>
                <div className="text-xs opacity-70">{t('withdraw.withdraw-page.label.withdrawAmount')}</div>
                <div className="flex items-center">
                  <div className="font-bold text-2xl mr-2 rtl:ml-2 rtl:mr-0">{formatCurrency(panel ? panel.withdrawBalance : 0)}</div>
                </div>
              </div>
              <div className="flex items-center" onClick={() => navigate('/record/withdraw')}>
                <div className="w-16 text-xs text-right mr-3 rtl:text-left rtl:ml-3 rtl:mr-0">
                  {t('withdraw.withdraw-page.label.withdraw-record')}
                </div>
                <svg viewBox="0 0 14 14" className="size-3.5 rtl:rotate-180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray flex flex-col p-3 gap-y-2 rounded-lg">
            <p className="text-main text-sm">{t('withdraw.withdraw-page.label.transferTo')}</p>
            {cards.length === 0 ? (
              <div className="text-center py-6 text-acc text-sm">
                <p>{t('withdraw.tip.noCard')}</p>
                <Button
                  className="mt-3 bg-primary text-black font-bold rounded-full h-9 px-6"
                  onPress={() => navigate('/withdraw/add-bank-card')}
                >
                  {t('withdraw.label.addCard')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer ${
                      selectedCard?.id === card.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-selected'
                    }`}
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-main">{card.bankName}</div>
                      <button
                        className="text-xs text-primary font-bold px-2 py-1 capitalize"
                        onClick={(e) => { e.stopPropagation(); navigate('/withdraw/add-bank-card', { state: { card } }) }}
                      >
                        {t('common.label.edit')}
                      </button>
                    </div>
                    <div className="text-xs text-acc mt-1">
                      **** **** **** {card.cardNo.slice(-4)}
                    </div>
                    <div className="text-xs text-acc">{card.holderName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-gray rounded-lg">
            <p className="text-xs text-[#EA1200] font-bold capitalize">{t('withdraw.withdraw-page.tip.dontShareOTPTitle')}</p>
            <p className="text-xs capitalize">{t('withdraw.withdraw-page.tip.dontShareOTP')}</p>
          </div>

          <div className="flex flex-col p-3 bg-white dark:bg-gray rounded-lg">
            <div className="flex flex-col pb-3 border-b border-b-gray">
              <p className="text-main text-sm mb-1 flex">{t('withdraw.withdraw-page.label.withdrawAmount')}</p>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full p-2 border border-gray dark:border-text-acc font-bold h-10 text-main bg-selected rounded-sm focus:border-primary! outline-none text-left rtl:text-right"
                type="text"
                inputMode="numeric"
                placeholder={t('withdraw.ph.amount')}
              />
              {amountError ? (
                <p className="text-xs text-[#E20000] font-bold mt-1">{amountError}</p>
              ) : null}
              <p className="text-sm text-acc mt-1">
                {t('withdraw.withdraw-page.label.received')}
                <span className="text-main">{formatCurrency(+(Number(amount) * (1 - feeRate)).toFixed(2) || 0)}</span>
              </p>
              <div
                className="text-acc text-10"
                dangerouslySetInnerHTML={{
                  __html: t('withdraw.withdraw-page.tip.withdrawalOpportunity', {
                    withdrawCountLimit: panel ? panel.withdrawCountLimit : 0,
                    withdrawCountSurplus: panel ? panel.withdrawCountSurplus : 0,
                  })
                }}
              />
            </div>
            <div className="flex flex-col mt-3 text-xs gap-y-4">
              <p>{t('withdraw.withdraw-page.rules.fee-1')}</p>
              <p>{t('withdraw.withdraw-page.rules.fee-2', { rate: feeRate * 100 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray p-3">
          <Button
            isLoading={submitting}
            isDisabled={!canSubmit}
            className="bg-linear-primary-tr text-black shadow-btn-primary font-bold text-sm h-12 w-full rounded-full"
            onPress={handleSubmit}
          >
            {t('common.label.withdraw')}
          </Button>
        </div>
      </Spin>
    </div>
  )
}

export default WithdrawPage
