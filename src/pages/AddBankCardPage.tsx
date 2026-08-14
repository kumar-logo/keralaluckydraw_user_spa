import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@nextui-org/react'
import { addCard, editCard, type BankCardDto } from '../services/financeApi'
import { toast } from '../utils/toast'
import { withLoading } from '../utils/helpers'
import { TopBar } from '../components/shared/TopBar'

const EMPTY_CARD: BankCardDto = {
  id: 0,
  bankName: '',
  cardNo: '',
  holderName: '',
  ifscCode: '',
  upiAddress: '',
  gpayId: '',
  phonepeId: '',
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/

export const AddBankCardPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const editCardData: BankCardDto = { ...EMPTY_CARD, ...(location.state as { card?: Partial<BankCardDto> } | null)?.card }
  const isEdit = editCardData.id > 0
  const [loading, setLoading] = useState(false)
  const [holderName, setHolderName] = useState(editCardData.holderName)
  const [bankName, setBankName] = useState(editCardData.bankName)
  const [accountNo, setAccountNo] = useState(editCardData.cardNo)
  const [confirmAccountNo, setConfirmAccountNo] = useState(editCardData.cardNo)
  const [ifscCode, setIfscCode] = useState(editCardData.ifscCode)
  const [upiAddress, setUpiAddress] = useState(editCardData.upiAddress)
  const [gpayId, setGpayId] = useState(editCardData.gpayId)
  const [phonepeId, setPhonepeId] = useState(editCardData.phonepeId)

  const canSubmit =
    !!holderName.trim() &&
    !!bankName.trim() &&
    !!accountNo &&
    !!confirmAccountNo &&
    !!ifscCode.trim()

  const handleSubmit = () => {
    if (!holderName.trim()) {
      toast.warning(t('bankcard.tip.holderRequired', 'Enter the account holder name'))
      return
    }
    if (!bankName.trim()) {
      toast.warning(t('bankcard.tip.bankRequired', 'Enter the bank name'))
      return
    }
    if (!accountNo || accountNo.length < 6) {
      toast.warning(t('bankcard.tip.accountRequired', 'Enter a valid account number'))
      return
    }
    if (accountNo !== confirmAccountNo) {
      toast.warning(t('bankcard.tip.accountNotMatch'))
      return
    }
    if (!IFSC_REGEX.test(ifscCode.trim().toUpperCase())) {
      toast.warning(t('bankcard.tip.ifscInvalid', 'Enter a valid 11-character IFSC code'))
      return
    }
    const payload = {
      holderName: holderName.trim(),
      bankName: bankName.trim(),
      cardNo: accountNo,
      ifscCode: ifscCode.trim().toUpperCase(),
      upiAddress: upiAddress.trim(),
      gpayId: gpayId.trim(),
      phonepeId: phonepeId.trim(),
    }
    const request = isEdit
      ? editCard({ ...payload, id: editCardData.id })
      : addCard(payload)
    withLoading(setLoading, request.then(() => {
      toast.success(t(isEdit ? 'common.tip.success.update' : 'common.tip.success.add'))
      navigate(-1)
    }))
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar title={isEdit ? t('bankcard.label.editCard', 'Edit Bank Card') : t('bankcard.label.addCard')} />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.holderName')}</label>
          <Input
            value={holderName}
            onValueChange={setHolderName}
            placeholder={t('bankcard.ph.holderName')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.bankName')}</label>
          <Input
            value={bankName}
            onValueChange={setBankName}
            placeholder={t('bankcard.ph.bankName')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.accountNo')}</label>
          <Input
            value={accountNo}
            onValueChange={(v) => setAccountNo(v.replace(/\D/g, ''))}
            placeholder={t('bankcard.ph.accountNo')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.confirmAccountNo')}</label>
          <Input
            value={confirmAccountNo}
            onValueChange={(v) => setConfirmAccountNo(v.replace(/\D/g, ''))}
            placeholder={t('bankcard.ph.confirmAccountNo')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.ifsc')}</label>
          <Input
            value={ifscCode}
            onValueChange={(v) => setIfscCode(v.toUpperCase().slice(0, 11))}
            maxLength={11}
            placeholder={t('bankcard.ph.ifsc')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.upiId', 'UPI ID')}</label>
          <Input
            value={upiAddress}
            onValueChange={setUpiAddress}
            placeholder={t('bankcard.ph.upiId', 'Enter UPI ID')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.gpay', 'Gpay')}</label>
          <Input
            value={gpayId}
            onValueChange={setGpayId}
            placeholder={t('bankcard.ph.gpay', 'Enter Gpay number / UPI')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

        <div>
          <label className="text-xs text-acc mb-1 block">{t('bankcard.label.phonepe', 'PhonePe')}</label>
          <Input
            value={phonepeId}
            onValueChange={setPhonepeId}
            placeholder={t('bankcard.ph.phonepe', 'Enter PhonePe number / UPI')}
            classNames={{ inputWrapper: 'h-12 bg-white dark:bg-gray shadow-none border border-gray dark:border-selected focus-within:border-primary rounded-lg px-3' }}
          />
        </div>

      </div>

      <div className="shrink-0 p-4">
        <Button
          isLoading={loading}
          isDisabled={!canSubmit}
          className="h-13 text-black font-bold text-base rounded-full bg-linear-primary-tb disabled:opacity-60 shadow-btn-primary w-full"
          onPress={handleSubmit}
        >
          {t('common.label.confirm')}
        </Button>
      </div>
    </div>
  )
}

export default AddBankCardPage
