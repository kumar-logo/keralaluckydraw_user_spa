import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@nextui-org/react'
import { sendSms, updatePassword, resetPassword } from '../services/userApi'
import { useAppConfigStore } from '../stores/configStore'
import { useAuthStore } from '../stores/authStore'
import { toast } from '../utils/toast'
import { TopBarWrapper } from '../components/shared/TopBarWrapper'
import { OtpInput } from '../components/shared/OtpInput'

const EyeIcon = ({ close, className = '' }: { close: boolean; className?: string }) => (
  <svg className={`size-4 ${className}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {close ? (
      <>
        <path fillRule="evenodd" clipRule="evenodd" d="M2.7817 2L1.90234 2.86501L13.2181 14L14.0974 13.1347L2.7817 2V2Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M5.47594 3.80698C6.26174 3.45222 7.12468 3.24988 8.03696 3.2404C8.05115 3.24012 8.06534 3.23998 8.07953 3.23998C9.94046 3.23998 11.5752 4.33605 12.816 5.65651C13.4421 6.32272 13.9579 7.04094 14.3191 7.65461C14.4282 7.83996 14.5197 8.00923 14.5956 8.15681C14.5157 8.31313 14.4174 8.49303 14.2991 8.69106C14.0033 9.18623 13.5765 9.81073 13.019 10.405L13.893 11.2642C14.5124 10.6046 14.9819 9.91175 15.3053 9.37013C15.5303 8.99309 15.6957 8.68159 15.8006 8.47466C15.8602 8.35733 15.9042 8.26462 15.9329 8.20036C15.9472 8.16823 15.9578 8.14302 15.9647 8.12531L15.9725 8.10511L15.9748 8.09899L15.9754 8.09727V8.0964C15.9757 8.09554 15.9757 8.09497 15.2002 7.81198C15.9757 7.529 15.9757 7.52814 15.9754 7.52728L15.9748 7.52556L15.9725 7.51972L15.9647 7.49923C15.9578 7.48152 15.9472 7.45631 15.9329 7.42418C15.9042 7.35993 15.8602 7.26721 15.8006 7.14988C15.6812 6.91523 15.504 6.58266 15.2636 6.17684C14.7836 5.3666 14.0674 4.34625 13.1135 3.44004L12.2342 4.30505C13.0971 5.12409 13.7531 6.04951 14.1965 6.79794C14.2742 6.92896 14.3446 7.05304 14.408 7.16837C14.5122 7.35799 14.594 7.51333 14.6573 7.63333C14.6635 7.64514 14.6694 7.65666 14.6751 7.66789C14.6793 7.67618 14.6833 7.68427 14.687 7.69215C14.6913 7.68361 14.6958 7.67456 14.7005 7.66502C14.638 7.55 14.5575 7.39953 14.4549 7.21533C14.1259 6.62377 13.6409 5.94635 13.0522 5.3199C12.4591 4.68877 11.8003 4.13698 11.1118 3.77498L10.5481 4.79735C10.8949 4.97968 11.2619 5.23454 11.6281 5.54024C10.7273 4.82982 9.55019 4.35898 8.09021 4.36283C7.74649 4.36771 7.41785 4.40581 7.10443 4.47414L5.47594 3.80698Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M6.01325 6.91003L6.65219 7.53849L9.11157 9.9585C8.78277 10.1401 8.40343 10.2435 7.99995 10.2435C6.74353 10.2435 5.72363 9.2399 5.72363 8.00358C5.72363 7.60656 5.82897 7.23357 6.01325 6.91003ZM7.95793 5.76423C7.97184 5.76395 7.98604 5.76367 7.99995 5.76367C9.25637 5.76367 10.2763 6.76754 10.2763 8.00358C10.2763 8.01755 10.2763 8.03124 10.276 8.04493L7.95793 5.76423Z" fill="currentColor" />
      </>
    ) : (
      <>
        <path fillRule="evenodd" clipRule="evenodd" d="M8.10099 2.80085C11.1033 2.84412 13.5665 5.58677 14.8002 7.94659C14.8002 7.94659 14.3661 8.84926 13.9589 9.4271C13.7618 9.70665 13.5546 9.97898 13.3368 10.2424C13.1815 10.4299 13.021 10.6125 12.8547 10.7899C11.3677 12.3766 9.2322 13.5603 6.97717 13.1007C4.472 12.5901 2.42851 10.4091 1.2002 8.06343C1.2002 8.06343 1.63632 7.15988 2.04576 6.58291C2.22918 6.32414 2.42169 6.07229 2.62329 5.82794C2.77775 5.64071 2.93789 5.4581 3.10342 5.28068C4.4172 3.87402 6.10293 2.79104 8.10099 2.80085V2.80085ZM8.09049 3.9548C6.4181 3.94845 5.02738 4.89728 3.92712 6.07517C3.77749 6.23528 3.63325 6.4003 3.49355 6.56935C3.30984 6.79206 3.13437 7.02199 2.96713 7.25768C2.79989 7.49309 2.6284 7.79023 2.49239 8.04266C3.57533 9.89157 5.20086 11.5616 7.20063 11.9693C9.06411 12.3492 10.8032 11.3054 12.0321 9.99427C12.1823 9.83416 12.3274 9.66886 12.4677 9.49951C12.6664 9.2592 12.8555 9.01082 13.0352 8.75551C13.2016 8.51924 13.3728 8.22152 13.5086 7.9688C12.3847 6.05758 10.4619 3.9923 8.09049 3.9548Z" fill="currentColor" />
        <path fillRule="evenodd" clipRule="evenodd" d="M7.99995 5.69141C9.25637 5.69141 10.2766 6.72794 10.2766 8.00421C10.2766 9.28076 9.25637 10.317 7.99995 10.317C6.74382 10.317 5.72363 9.28076 5.72363 8.00421C5.72363 6.72794 6.74382 5.69141 7.99995 5.69141Z" fill="currentColor" />
      </>
    )}
  </svg>
)

const inputClassNames = {
  label: '-mt-1.5',
  base: 'bg-transparent rounded-lg',
  inputWrapper: 'bg-transparent group-data-[focus=true]:bg-light-gray/50 dark:group-data-[focus=true]:bg-black/50 shadow-none border border-gray dark:border-selected data-[focus=true]:border-primary! rounded-lg h-12 px-3',
  input: 'placeholder:text-acc text-xs outline-none',
}

const PasswordInput = ({ userPassword, setUserPassword, isSet, isConfirm }: { userPassword: string; setUserPassword: (v: string) => void; isSet?: boolean; isConfirm?: boolean }) => {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  const placeholder = isSet ? (isConfirm ? 'signin.ph.confirmpwd' : 'signin.ph.setPwd') : 'common.label.password'

  return (
    <Input
      value={userPassword}
      type={show ? 'text' : 'password'}
      data-has-helper="false"
      labelPlacement="outside"
      classNames={inputClassNames}
      placeholder={t(placeholder)}
      onChange={(e) => {
        if (e) {
          if (/^[A-Za-z0-9~!@#$%^&*()_+[\]{};:,.<>?]*$/.test(e.target.value)) {
            setUserPassword(e.target.value)
          } else {
            setUserPassword(userPassword)
          }
        } else {
          setUserPassword('')
        }
      }}
      maxLength={18}
      endContent={
        <div className="size-5" onClick={() => setShow(!show)}>
          <EyeIcon close={!show} className="text-sec" />
        </div>
      }
    />
  )
}

const PhoneInput = ({ userPhone, setUserPhone }: { userPhone: string; setUserPhone: (v: string) => void }) => {
  const { t } = useTranslation()

  return (
    <Input
      value={userPhone}
      type="tel"
      data-has-helper="false"
      labelPlacement="outside"
      classNames={inputClassNames}
      placeholder={t('signin.ph.phoneNum')}
      startContent={<span className="pr-2.5 text-main text-xs rtl:pr-0 rtl:pl-2.5">+91</span>}
      onChange={(e) => {
        if (e && /^[0-9]+$/.test(e.target.value)) setUserPhone(e.target.value)
        else setUserPhone('')
      }}
      maxLength={10}
    />
  )
}

const PrimaryButton = ({ onPress, isLoading, isDisabled, children }: { onPress: () => void; isLoading: boolean; isDisabled: boolean; children: React.ReactNode }) => (
  <Button
    isLoading={isLoading}
    isDisabled={isDisabled}
    className="h-13 text-black font-bold text-base shrink-0 rounded-full bg-linear-primary-tb disabled:opacity-60 shadow-btn-primary"
    onPress={onPress}
  >
    {children}
  </Button>
)

export const SetPasswordPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const isGuest = !token
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const otp = useAppConfigStore((s) => s.otp)
  const otpVisible = otp.enabled && (otp.smsEnabled || otp.whatsappEnabled)
  const otpRequired = otpVisible || isGuest

  const isDisabled = useMemo(
    () => !(password && confirmPassword && (otpRequired ? smsCode : true) && (isGuest ? phone.length === 10 : true)),
    [password, confirmPassword, smsCode, otpRequired, isGuest, phone]
  )

  const handleSubmit = () => {
    if (confirmPassword !== password) {
      toast.show({ message: t('signin.tip.pwdNotMath'), icon: 'warning' })
      return
    }
    if (password.length < 6) {
      toast.show({ message: t('signin.tip.pwdLenErr'), icon: 'warning' })
      return
    }
    setLoading(true)
    const action = isGuest
      ? resetPassword(phone, smsCode, password).then(() => navigate('/login', { replace: true }))
      : updatePassword(password, smsCode).then(() => navigate(-1))
    action.then(() => {
      toast.show({ message: t('common.tip.success.success'), icon: 'success' })
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <div className="flex flex-col bg-white dark:bg-light-gray size-full">
      <TopBarWrapper title={t('signin.label.resetPwd')} rightNodeType="service" />

      <div className="flex-1 p-3 flex flex-col">

        {isGuest ? (
          <div className="mb-3">
            <PhoneInput userPhone={phone} setUserPhone={setPhone} />
          </div>
        ) : null}

        <PasswordInput isSet userPassword={password} setUserPassword={setPassword} />

        <div className="my-3">
          <PasswordInput isSet isConfirm userPassword={confirmPassword} setUserPassword={setConfirmPassword} />
        </div>

        {otpRequired ? (
          <OtpInput
            value={smsCode}
            onChange={setSmsCode}
            canSend={isGuest ? !!(phone && phone.length === 10) : true}
            send={async () => {
              const data = await sendSms(isGuest ? phone : undefined, isGuest ? 'reset' : 'change_password')
              if (data && data.sent === false) {
                toast.warning(t('common.tip.error.fail', 'Failed to send code'))
                return false
              }
              toast.show({ message: t('common.tip.success.success'), icon: 'success' })
              return true
            }}
          />
        ) : null}

        <div className="h-3" />

        <PrimaryButton isLoading={loading} isDisabled={isDisabled} onPress={handleSubmit}>
          {t('common.label.confirm')}
        </PrimaryButton>
      </div>
    </div>
  )
}

export default SetPasswordPage
