import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Input, Image, Checkbox } from '@nextui-org/react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useAppConfigStore } from '../stores/configStore'
import { sendSms, register } from '../services/userApi'
import { toast } from '../utils/toast'
import { withLoading } from '../utils/helpers'
import { useGoBack } from '../hooks/useGoBack'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { NavBarSpacer } from '../components/shared/NavBarSpacer'
import { OtpInput } from '../components/shared/OtpInput'
import './auth.css'

const CloseIcon = ({ className = '', ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg className={`size-6 text-sec ${className}`} {...props} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.8002 7.2002L7.2002 16.8002" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.2002 7.2002L16.8002 16.8002" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const EyeIcon = ({ close, className = '' }: { close: boolean; className?: string }) => (
  <svg className={`size-4 ${className}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {close ? (
      <>
        <path fillRule="evenodd" clipRule="evenodd" d="M2.7817 2L1.90234 2.86501L13.2181 14L14.0974 13.1347L2.7817 2V2Z" fill="currentColor" />
        <path d="M3.76045 4.69374L4.58813 5.50818C3.68209 6.26729 2.9606 7.2122 2.49438 8.03893L2.49296 8.04173C3.7914 10.178 5.85165 12.1969 8.45194 11.8907C9.15383 11.808 9.80859 11.5719 10.4068 11.2341L11.2447 12.0583C10.0786 12.7948 8.74184 13.1848 7.29348 12.992C4.68183 12.6445 2.54634 10.5367 1.2002 8.06128C1.83224 6.80988 2.69683 5.61267 3.76045 4.69374V4.69374ZM5.64295 3.48676C6.37324 3.16657 7.16343 2.97826 8.00729 2.96485C8.05414 2.96457 8.61038 2.99055 8.86251 3.03134C9.02066 3.05705 9.17825 3.08918 9.33356 3.12913C11.8109 3.76419 13.6463 5.82501 14.8002 7.94813C14.3161 8.91009 13.6821 9.84885 12.9259 10.6532L12.1232 9.86338C12.6817 9.27106 13.1474 8.61169 13.506 7.97216C13.506 7.97216 13.1454 7.40163 12.872 7.04345C12.6962 6.81323 12.5114 6.58971 12.3172 6.3743C12.1638 6.20443 11.5684 5.62748 11.4267 5.50734C10.4761 4.70296 9.35997 4.07181 8.02121 4.08242C7.50274 4.09053 7.00415 4.19111 6.53082 4.36042L5.64295 3.48676V3.48676Z" fill="currentColor" />
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
  base: 'bg-transparent',
  inputWrapper: 'auth-field',
  input: 'auth-field-input outline-none',
}

const PasswordInput = ({ userPassword, setUserPassword, isSet, isConfirm }: { userPassword: string; setUserPassword: (v: string) => void; isSet?: boolean; isConfirm?: boolean }) => {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  return (
    <Input
      value={userPassword}
      type={show ? 'text' : 'password'}
      data-has-helper="false"
      labelPlacement="outside"
      classNames={inputClassNames}
      placeholder={t(isConfirm ? 'signin.ph.confirmpwd' : isSet ? 'signin.ph.setPwd' : 'common.label.password')}
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

const PhoneInput = ({ userPhone, setUserPhone, ...rest }: { userPhone: string; setUserPhone: (v: string) => void; onFocus?: () => void }) => {
  const { t } = useTranslation()

  return (
    <Input
      {...rest}
      placeholder={t('signin.ph.phoneNum')}
      value={userPhone}
      startContent={
        <span className="auth-prefix text-xs">+91</span>
      }
      type="tel"
      data-has-helper="false"
      labelPlacement="outside"
      classNames={inputClassNames}
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
    className="auth-btn shrink-0 disabled:opacity-60"
    onPress={onPress}
  >
    {children}
  </Button>
)

export const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const setToken = useAuthStore((s) => s.setToken)

  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const statusBarHeight = useUIStore((s) => s.statusBarHeight)
  const rem = useUIStore((s) => s.rem)
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const loginBgLightUrl = useAppConfigStore((s) => s.loginBgLightUrl)
  const loginBgDarkUrl = useAppConfigStore((s) => s.loginBgDarkUrl)
  const otp = useAppConfigStore((s) => s.otp)
  const authBgUrl = isDarkMode ? loginBgDarkUrl : loginBgLightUrl
  const otpVisible = otp.enabled && (otp.smsEnabled || otp.whatsappEnabled)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('invite') || params.get('inviteCode') || params.get('code') || params.get('referral')
    if (fromUrl) setInviteCode(fromUrl)
  }, [])

  const isDisabled = useMemo(
    () => !(phone && phone.length === 10 && (otpVisible ? otpCode : true) && password && confirmPassword && agreed),
    [phone, otpCode, password, confirmPassword, agreed, otpVisible]
  )

  const goBack = useGoBack()

  const handleRegister = () => {
    if (password.length < 6) {
      toast.show({ message: t('signin.tip.pwdLenErr'), icon: 'warning' })
      return
    }
    if (password !== confirmPassword) {
      toast.show({ message: t('signin.tip.pwdNotMath'), icon: 'warning' })
      return
    }
    withLoading(setLoading, register(phone, otpCode, password, inviteCode || undefined).then((data) => {
      if (data.token) setToken(data.token)
      requestAnimationFrame(() => {
        fetchAndSyncBalance()
        toast.success(t('common.tip.success.login'))
        navigate('/index/home', { replace: true })
      })
    }).catch((err: { data?: { msg?: string }; response?: { data?: { msg?: string } } }) => {
      const msg = err.data?.msg ?? err.response?.data?.msg
      if (!msg) toast.show({ message: t('common.label.failed'), icon: 'warning' })
      setLoading(false)
    }))
  }

  return (
    <div
      className="auth-root relative flex flex-col size-full text-main overflow-x-hidden overflow-y-auto bg-no-repeat"
      ref={mainRef}
      style={authBgUrl ? { backgroundImage: `url(${authBgUrl})`, backgroundSize: '100% auto' } : undefined}
    >

      <div className="shrink-0" style={{ height: statusBarHeight }} />

      <div className="shrink-0 h-11 flex items-center justify-between px-4 sticky relative z-20" style={{ top: statusBarHeight }}>
        <Image src="/images/logos/logo.png" alt="Kerala Lucky Draw" className="auth-logo h-9 w-9 object-contain" />
        <CloseIcon className="auth-close" onClick={goBack} />
      </div>

      <div className="shrink-0" style={{ height: 12.75 * rem - statusBarHeight }} />

      <div className="auth-sheet flex flex-col p-4 flex-1" ref={formRef}>

        <div className="auth-head mb-4">
          <div className="auth-title">{t('common.label.register')}</div>
        </div>

        <div className="auth-fields">

          <PhoneInput
            userPhone={phone}
            setUserPhone={setPhone}
            onFocus={() => {
              if (!scrolled && formRef.current && mainRef.current) {
                mainRef.current.scrollTo({
                  top: formRef.current.getBoundingClientRect().top,
                  behavior: 'smooth',
                })
                setScrolled(true)
              }
            }}
          />

          {otpVisible ? (
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              canSend={phone.trim().length > 9}
              send={async () => {
                await sendSms(phone)
                toast.show({ message: t('common.tip.success.success'), icon: 'success' })
                return true
              }}
            />
          ) : null}

          <PasswordInput userPassword={password} setUserPassword={setPassword} />

          <PasswordInput userPassword={confirmPassword} isConfirm setUserPassword={setConfirmPassword} />

          <Input
            placeholder={t('signin.ph.inviteCode')}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            data-has-helper="false"
            labelPlacement="outside"
            classNames={inputClassNames}
          />

        </div>

        <Checkbox
          isSelected={agreed}
          onValueChange={setAgreed}
          className="my-4"
          classNames={{
            wrapper: 'before:border-primary',
            icon: 'text-black size-3 font-black stroke-3',
            label: 'text-sm',
          }}
        >
          {t('signin.tip.pg18')}
        </Checkbox>

        <PrimaryButton isLoading={loading} isDisabled={isDisabled} onPress={handleRegister}>
          {t('common.label.register')}
        </PrimaryButton>

        <div className="text-center mt-4 text-sm shrink-0">
          <span
            onClick={() => navigate('/login?origin=register_tip', { replace: true })}
            className="auth-link"
          >
            {t('common.label.login')}
          </span>
        </div>
      </div>

      <NavBarSpacer />
    </div>
  )
}

export default RegisterPage
