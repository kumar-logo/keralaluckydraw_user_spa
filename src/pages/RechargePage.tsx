import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image, ScrollShadow } from '@nextui-org/react'
import { useAuthStore } from '../stores/authStore'
import { getRechargePanel, rechargeBalance, type PayChannelDto, type AmountBtnDto } from '../services/financeApi'
import { toast } from '../utils/toast'
import { formatCurrency } from '../utils/format'
import { withLoading, resolveAssetUrl } from '../utils/helpers'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { Spin } from '../components/shared/Spin'

const UTR_LENGTH = 12
const UTR_PATTERN = /^\d{12}$/

export const RechargePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [channels, setChannels] = useState<PayChannelDto[]>([])
  const [currentChannel, setCurrentChannel] = useState<PayChannelDto | null>(null)
  const [amountBtns, setAmountBtns] = useState<AmountBtnDto[]>([])
  const [amount, setAmount] = useState('')
  const [proofImage, setProofImage] = useState('')
  const [proofName, setProofName] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const isRecharge = useAuthStore((s) => s.isRecharge)
  const balance = useAuthStore((s) => s.balance)

  useEffect(() => {
    fetchAndSyncBalance()
    withLoading(setLoading, getRechargePanel().then((data) => {
      const channelList = data.rechargeChannelList ?? data.channels ?? []
      const amounts = data.amountBtnList ?? data.amounts ?? []
      setChannels(channelList)
      setAmountBtns(amounts)
      if (channelList.length > 0) {
        setCurrentChannel(channelList[0])
        if (amounts.length > 0) {
          const validAmts = amounts.filter(
            (a) => a.amount >= channelList[0].minAmount && a.amount <= channelList[0].maxAmount
          )
          if (validAmts.length > 0) {
            const secondAmt = validAmts[1] ?? validAmts[0]
            setAmount(isRecharge ? validAmts[0].amount + '' : secondAmt.amount + '')
          }
        }
      }
    }))
  }, [isRecharge])

  const youWillGet = useMemo(() => {
    const num = Number(amount)
    return num || 0
  }, [amount])

  const manualQr = useMemo(
    () => (currentChannel?.mode === 'manual' && currentChannel.qr ? currentChannel.qr : ''),
    [currentChannel],
  )

  const isManual = currentChannel?.mode === 'manual'
  const requireProof = currentChannel?.requireProof !== false
  const showProofUpload = isManual && requireProof
  const isUtrValid = UTR_PATTERN.test(paymentRef)

  const handleProofFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Proof image must be under 5MB')
      return
    }
    setProofName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setProofImage(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!currentChannel || !amount) return
    const num = Number(amount)
    if (currentChannel.minAmount && num < currentChannel.minAmount) {
      toast.warning(t('recharge.tip.minAmount', { amount: formatCurrency(currentChannel.minAmount, 0) }))
      return
    }
    if (currentChannel.maxAmount && num > currentChannel.maxAmount) {
      toast.warning(t('recharge.tip.maxAmount', { amount: formatCurrency(currentChannel.maxAmount, 0) }))
      return
    }
    if (isManual) {
      if (showProofUpload && !proofImage) {
        toast.warning('Please upload your payment proof screenshot')
        return
      }
      if (!isUtrValid) {
        toast.warning('Please enter a valid 12-digit UTR number')
        return
      }
    }
    withLoading(setSubmitting, rechargeBalance(
      currentChannel.id,
      num,
      showProofUpload ? proofImage : undefined,
      isManual ? paymentRef.trim() : undefined,
    ).then((data) => {
      const payUrl = data.payLink ?? data.payUrl
      if (payUrl) {
        window.location.href = payUrl
        return
      }
      if (isManual) {
        toast.success('Payment proof submitted for verification')
        setProofImage('')
        setProofName('')
        setPaymentRef('')
        navigate('/record/recharge')
        return
      }
      fetchAndSyncBalance()
    }))
  }

  return (
    <div className="flex flex-col flex-1 overflow-clip min-h-0">
      <TopBarWrapper title={t('common.label.recharge')} rightNode={null} rightNodeType="service" />

      <Spin className="flex-1 flex flex-col min-h-0" loading={loading}>
        <ScrollShadow className="flex-1 p-2 min-h-0 overflow-y-auto">

          <div className="p-5 flex rounded-sm flex-col bg-linear-primary-tr mb-2 text-black">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs">{t('common.label.balance')}</div>
                <div className="flex items-center">
                  <div className="mr-2 text-2xl font-bold rtl:mr-0 rtl:ml-2">{formatCurrency(balance)}</div>
                </div>
              </div>
              <div className="flex items-center" onClick={() => navigate('/record/recharge')}>
                <div className="w-16 text-xs text-right mr-3 rtl:mr-0 rtl:ml-3">
                  {t('recharge.recharge.rechargeRecords')}
                </div>
                <svg viewBox="0 0 14 14" className="size-3.5 rtl:rotate-180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col p-3 bg-white dark:bg-gray rounded-lg">
            <div className="relative">
              <input
                value={amount}
                readOnly
                min={currentChannel?.minAmount}
                max={currentChannel?.maxAmount}
                className="w-full p-2 border border-gray dark:border-text-acc font-bold h-10 text-main bg-selected rounded-sm outline-none cursor-not-allowed"
                type="number"
                placeholder={t('common.tip.info.recharge.placeholder')}
              />
              {currentChannel?.isCustom === false && (
                <div className="absolute size-full opacity-70 left-0 top-0 flex justify-end items-center pr-3 text-xs text-primary font-bold">
                  {t('recharge.recharge.onlyFixedAmount')}
                </div>
              )}
            </div>

            {(currentChannel?.minAmount || currentChannel?.maxAmount) ? (
              <div className="flex items-center mt-1 mb-2 text-xs">
                {currentChannel?.minAmount ? (
                  <div className="mr-4">
                    <span className="text-acc capitalize">{t('common.label.min')}</span>
                    <span className="ml-1 font-bold text-main">{formatCurrency(currentChannel.minAmount, 0)}</span>
                  </div>
                ) : null}
                {currentChannel?.maxAmount ? (
                  <div>
                    <span className="text-acc capitalize">{t('common.label.max')}</span>
                    <span className="ml-1 font-bold text-main">{formatCurrency(currentChannel.maxAmount, 0)}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-2" />
            )}

            <div className="flex items-center mb-2 flex-wrap">
              <div className="flex items-end">
                <p className="text-10 text-sec text-nowrap">{t('recharge.recharge.youWillGet')}</p>
                <p className="text-sm text-main font-black ml-1 leading-3.5">{formatCurrency(youWillGet)}</p>
              </div>
            </div>

            <div className="mt-1 grid grid-cols-4 gap-2">
              {amountBtns.map((btn, idx) => (
                <Button
                  key={idx}
                  isDisabled={currentChannel ? btn.amount < currentChannel.minAmount || btn.amount > currentChannel.maxAmount : false}
                  className={`rounded col-span-1 h-9 font-bold disabled:opacity-30 overflow-visible relative ${
                    btn.amount + '' === amount
                      ? 'bg-primary text-black'
                      : 'bg-selected text-main'
                  }`}
                  onPress={() => setAmount(btn.amount + '')}
                >
                  {formatCurrency(btn.amount, 0)}
                  {!!btn.bonusPct && btn.bonusPct > 0 && (
                    <p className="absolute left-0 -top-1 text-8 leading-3.5 px-1.5 rounded-full rounded-bl-none bg-primary text-white">
                      +{btn.bonusPct}%
                    </p>
                  )}
                  {btn.mark && (
                    <p className="absolute right-0 -top-1 text-8 leading-3.5 px-1.5 rounded-full rounded-br-none bg-tip text-white">
                      {btn.mark}
                    </p>
                  )}
                  {btn.amount === 1000 && (
                    <Image
                      className=" "
                      classNames={{ wrapper: 'size-10 absolute -left-2.5 -top-1.5', img: 'size-full' }}
                      radius="sm"
                      src="/images/recharge/top-pick.webp"
                    />
                  )}
                  {btn.amount === 20000 && (
                    <Image
                      className=" "
                      classNames={{ wrapper: 'size-10 absolute -left-3 -top-1.5', img: 'size-full' }}
                      radius="sm"
                      src="/images/recharge/best-deal.webp"
                    />
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col my-2 p-3 bg-white dark:bg-gray rounded-lg">
            <div className="text-sm font-bold text-main mb-1">
              {t('common.label.rechargeChannel')}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((ch) => (
                <Button
                  key={ch.id}
                  className={`col-span-1 h-24 bg-selected p-1 flex flex-col items-center justify-center rounded border relative duration-200 disabled:opacity-30 ${
                    currentChannel?.id === ch.id
                      ? ' border-primary'
                      : ' border-gray'
                  }`}
                  onPress={() => setCurrentChannel(ch)}
                >
                  <div className="w-20 h-12 flex items-center justify-center">
                    {ch.icon && <Image className="max-h-12 z-0" radius="none" alt="payIcon" src={resolveAssetUrl(ch.icon)} />}
                  </div>
                  <div className="text-xs text-wrap mt-1">{ch.name}</div>
                </Button>
              ))}
            </div>
          </div>

          {isManual && (
            <div className="flex flex-col items-center my-2 p-3 bg-white dark:bg-gray rounded-lg">
              {manualQr && (
                <>
                  <div className="text-sm font-bold text-main mb-2">{t('recharge.recharge.scanToPay')}</div>
                  <Image
                    radius="sm"
                    alt={t('recharge.recharge.scanToPay')}
                    src={resolveAssetUrl(manualQr)}
                    classNames={{ wrapper: 'size-56', img: 'size-full object-contain' }}
                  />
                </>
              )}
              {showProofUpload && (
                <div className="w-full mt-3">
                  <div className="text-xs font-bold text-main mb-1">Upload payment proof (screenshot)</div>
                  <label className="flex flex-col items-center justify-center w-full py-5 px-3 rounded-lg border-2 border-dashed border-gray dark:border-text-acc bg-selected cursor-pointer active:border-primary transition-colors">
                    <input type="file" accept="image/*" onChange={handleProofFile} className="sr-only" />
                    <svg viewBox="0 0 24 24" className="size-6 text-primary mb-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-xs font-bold text-primary">
                      {proofImage ? 'Change screenshot' : 'Upload screenshot'}
                    </span>
                    {proofName && (
                      <span className="text-10 text-acc mt-1 max-w-full truncate px-2">{proofName}</span>
                    )}
                  </label>
                  {proofImage && (
                    <img
                      src={proofImage}
                      alt="payment proof"
                      className="mt-2 w-28 h-28 object-contain rounded-sm border border-gray dark:border-text-acc block shrink-0"
                    />
                  )}
                </div>
              )}
              <div className="w-full mt-2">
                <div className="text-xs font-bold text-main mb-1">Payment reference / UTR</div>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value.replace(/\D/g, '').slice(0, UTR_LENGTH))}
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={UTR_LENGTH}
                  placeholder="Enter 12-digit UTR number"
                  className="w-full p-2 border border-gray dark:border-text-acc h-10 text-main bg-selected rounded-sm focus:border-primary! outline-none"
                />
                {paymentRef.length > 0 && !isUtrValid && (
                  <div className="text-10 text-danger mt-1">UTR must be exactly 12 digits</div>
                )}
              </div>
            </div>
          )}
        </ScrollShadow>

        <div className="w-full p-2 shrink-0">
          <Button
            isLoading={submitting}
            isDisabled={!amount || !currentChannel || (isManual && ((showProofUpload && !proofImage) || !isUtrValid))}
            className="w-full h-12 bg-linear-primary-tr rounded-full shadow-btn-primary text-black font-bold"
            onPress={handleSubmit}
          >
            {isManual ? 'Submit Payment Proof' : t('common.label.recharge')}
          </Button>
        </div>
      </Spin>
    </div>
  )
}

export default RechargePage
