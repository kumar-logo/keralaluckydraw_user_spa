import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Tabs, Tab, Input, Image, Checkbox } from '@nextui-org/react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useAppConfigStore } from '../stores/configStore'
import { sendSms, loginPassword, loginSms, loginTelegram, type LoginResultDto } from '../services/userApi'
import { toast } from '../utils/toast'
import { withLoading } from '../utils/helpers'
import { useGoBack } from '../hooks/useGoBack'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { NavBarSpacer } from '../components/shared/NavBarSpacer'
import { OtpInput } from '../components/shared/OtpInput'
import './auth.css'

interface TelegramAuth {
  WebApp?: { initData?: string }
  Login?: {
    auth: (
      options: { bot_id: string; request_access: string; embed: number },
      callback: (user: unknown) => void,
    ) => void
  }
}

interface GoogleAccounts {
  accounts?: { hasInitialize?: boolean }
}

type SocialLoginWindow = Window & {
  Telegram?: TelegramAuth
  google?: GoogleAccounts
}

const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`size-4 ${className}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.99976 14.9507C10.6866 14.9507 12.8648 12.7726 12.8648 10.0857C12.8648 7.39884 10.6866 5.2207 7.99976 5.2207C5.3129 5.2207 3.13477 7.39884 3.13477 10.0857C3.13477 12.7726 5.3129 14.9507 7.99976 14.9507Z" stroke="currentColor" strokeWidth="2.09056" />
    <path d="M10.4324 5.91578V3.48328C10.4324 2.13985 9.34332 1.05078 7.99988 1.05078C6.65645 1.05078 5.56738 2.13985 5.56738 3.48328V5.91578" stroke="currentColor" strokeWidth="2.09056" strokeLinejoin="round" />
    <path d="M8 8.69336V11.4734" stroke="currentColor" strokeWidth="2.09056" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PhoneTabIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`size-4 ${className}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.67188 11L9.33854 11" stroke="currentColor" strokeWidth="2.00533" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3.00267" y="1.00267" width="9.99467" height="13.9947" rx="2.00533" stroke="currentColor" strokeWidth="2.00533" />
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

const g1ClassNames = {
  label: '-mt-1.5',
  base: 'bg-transparent',
  inputWrapper: 'auth-field',
  input: 'auth-field-input outline-none',
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
      classNames={g1ClassNames}
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

const PhoneInput = ({ userPhone, setUserPhone, ...rest }: { userPhone: string; setUserPhone: (v: string) => void; onFocus?: () => void }) => {
  const { t } = useTranslation()

  return (
    <Input
      {...rest}
      value={userPhone}
      type="tel"
      data-has-helper="false"
      labelPlacement="outside"
      classNames={g1ClassNames}
      placeholder={t('signin.ph.phoneNum')}
      startContent={
        <span className="auth-prefix text-xs">+91</span>
      }
      onChange={(e) => {
        if (e && /^[0-9]+$/.test(e.target.value)) setUserPhone(e.target.value)
        else setUserPhone('')
      }}
      maxLength={10}
    />
  )
}

const CloseIcon = ({ className = '', ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg className={`size-6 text-sec ${className}`} {...props} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.8002 7.2002L7.2002 16.8002" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.2002 7.2002L16.8002 16.8002" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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

const TelegramIcon = () => (
  <svg className="size-full" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M417.28 795.733333 429.226667 615.253333 756.906667 320C771.413333 306.773333 753.92 300.373333 734.72 311.893333L330.24 567.466667 155.306667 512C117.76 501.333333 117.333333 475.306667 163.84 456.533333L845.226667 193.706667C876.373333 179.626667 906.24 201.386667 894.293333 249.173333L778.24 795.733333C770.133333 834.56 746.666667 843.946667 714.24 826.026667L537.6 695.466667 452.693333 777.813333C442.88 787.626667 434.773333 795.733333 417.28 795.733333Z"
      fill="#176BE3"
    />
  </svg>
)

const GoogleIcon = () => (
  <svg className="size-full" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M214.101333 512c0-32.512 5.546667-63.701333 15.36-92.928L57.173333 290.218667A491.861333 491.861333 0 0 0 4.693333 512c0 79.701333 18.858667 154.88 52.394667 221.610667l172.202667-129.066667A290.56 290.56 0 0 1 214.101333 512" fill="#FBBC05" />
    <path d="M516.693333 216.192c72.106667 0 137.258667 25.002667 188.458667 65.962667L854.101333 136.533333C763.349333 59.178667 646.997333 11.392 516.693333 11.392c-202.325333 0-376.234667 113.28-459.52 278.826667l172.373334 128.853333c39.68-118.016 152.832-202.88 287.146666-202.88" fill="#EA4335" />
    <path d="M516.693333 807.808c-134.357333 0-247.509333-84.864-287.232-202.88l-172.288 128.853333c83.242667 165.546667 257.152 278.826667 459.52 278.826667 124.842667 0 244.053333-43.392 333.568-124.757333l-163.584-123.818667c-46.122667 28.458667-104.234667 43.776-170.026666 43.776" fill="#34A853" />
    <path d="M1005.397333 512c0-29.568-4.693333-61.44-11.648-91.008H516.650667V614.4h274.602666c-13.696 65.962667-51.072 116.650667-104.533333 149.632l163.541333 123.818667c93.994667-85.418667 155.136-212.650667 155.136-375.850667" fill="#4285F4" />
  </svg>
)

export const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const goBack = useGoBack()
  const isDarkMode = useUIStore(s => s.isDarkMode)
  const rem = useUIStore(s => s.rem)
  const statusBarHeight = useUIStore(s => s.statusBarHeight)
  const loginBgLightUrl = useAppConfigStore(s => s.loginBgLightUrl)
  const loginBgDarkUrl = useAppConfigStore(s => s.loginBgDarkUrl)
  const otp = useAppConfigStore(s => s.otp)
  const socialLogin = useAppConfigStore(s => s.socialLogin)
  const authBgUrl = isDarkMode ? loginBgDarkUrl : loginBgLightUrl
  const otpVisible = otp.enabled && (otp.smsEnabled || otp.whatsappEnabled)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loginType, setLoginType] = useState<'PWD' | 'OTP'>('PWD')
  const [savePwd, setSavePwd] = useState(false)
  const setToken = useAuthStore((s) => s.setToken)
  const removeToken = useAuthStore((s) => s.removeToken)

  useEffect(() => {

    removeToken()
    setSavePwd(!!localStorage.getItem('savePwd'))
    setPhone(localStorage.getItem('userPhone') || '')
    const lastType = localStorage.getItem('lastLoginType')
    if (lastType === 'PWD' || (lastType === 'OTP' && otpVisible)) setLoginType(lastType)
  }, [otpVisible, removeToken])

  const isPWD = useMemo(() => loginType === 'PWD', [loginType])
  const isDisabled = useMemo(
    () => !(phone && phone.length === 10 && (isPWD ? password : otpCode)),
    [phone, password, otpCode, isPWD]
  )

  const onLoginSuccess = (data: LoginResultDto) => {
    if (!data.token) return
    setToken(data.token)
    if (savePwd) {
      localStorage.setItem('savePwd', 'true')
      localStorage.setItem('userPhone', phone)
    } else {
      localStorage.removeItem('savePwd')
      localStorage.removeItem('userPhone')
    }
    localStorage.removeItem('userPassword')
    localStorage.setItem('lastLoginType', loginType)
    requestAnimationFrame(() => {
      fetchAndSyncBalance()
      toast.success(t('common.tip.success.login'))
      goBack()
    })
  }

  const handleLogin = () => {
    if (isPWD && password.length < 6) {
      toast.warning(t('signin.tip.pwdLenErr'))
      return
    }
    const promise = isPWD ? loginPassword(phone, password) : loginSms(phone, otpCode)
    withLoading(setLoading, promise.then(onLoginSuccess))
  }

  const handleSocialLogin = (data: LoginResultDto) => {
    if (data.token) onLoginSuccess(data)
    else toast.warning('login failed, please retry')
  }

  const handleTelegramLogin = () => {
    const telegram = (window as SocialLoginWindow).Telegram
    if (telegram?.WebApp?.initData) {
      loginTelegram({ initData: telegram.WebApp.initData }).then((data) => handleSocialLogin(data))
    } else {
      telegram?.Login?.auth(
        { bot_id: '8275096217', request_access: 'write', embed: 1 },
        (user: unknown) => {
          loginTelegram({ user }).then((data) => handleSocialLogin(data))
        }
      )
    }
  }

  const handleGoogleLogin = () => {
    const google = (window as SocialLoginWindow).google
    if (!google?.accounts?.hasInitialize) {
      toast.warning(t('signin.tip.waitInit', { channel: 'Google' }))
      return
    }

  }

  const channel = localStorage.getItem('channel')

  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

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
          <div className="auth-title">{t('common.label.login')}</div>
          <div className="auth-sub">{t('me.tip.signin')}</div>
        </div>

        <Tabs
          radius="lg"
          selectedKey={loginType}
          classNames={{
            tabList: 'auth-tablist w-full flex',
            tab: 'auth-tab flex-1',
            cursor: 'auth-tabcursor',
          }}
          onSelectionChange={(key) => setLoginType(key as 'PWD' | 'OTP')}
        >
          <Tab
            className="p-0"
            key="PWD"
            title={
              <div className="flex items-center text-xs font-bold">
                <LockIcon className="mr-2" />
                {t('common.label.password')}
              </div>
            }
          />
          {otpVisible ? (
            <Tab
              className="p-0"
              key="OTP"
              title={
                <div className="flex items-center text-xs font-bold">
                  <PhoneTabIcon className="mr-2" />
                  {t('signin.label.otpLogin')}
                </div>
              }
            />
          ) : null}
        </Tabs>

        <div className="flex flex-col my-5">

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

          <div className="mt-3">

            {otpVisible ? (
              <div className={'overflow-hidden duration-200 ' + (isPWD ? 'h-0' : 'h-14')}>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  canSend={phone.trim().length > 9}
                  send={async () => {
                    const data = await sendSms(phone)
                    if (data && data.sent === false) {
                      toast.warning(t('common.tip.error.fail', 'Failed to send code'))
                      return false
                    }
                    toast.show({ message: t('common.tip.success.success'), icon: 'success' })
                    return true
                  }}
                />
              </div>
            ) : null}

            <div className={'overflow-hidden duration-200 ' + (isPWD ? 'h-14' : 'h-0')}>
              <PasswordInput userPassword={password} setUserPassword={setPassword} />
            </div>
          </div>

          <div className={'flex items-center justify-between duration-200 ' + (isPWD ? 'h-6 pt-3' : 'h-0 pt-0')}>
            <div>
              {isPWD && (
                <Checkbox
                  isSelected={savePwd}
                  onValueChange={setSavePwd}
                  className="my-1"
                  classNames={{
                    wrapper: 'before:border-primary',
                    icon: 'text-black size-3 font-black stroke-3',
                    label: 'text-sm',
                  }}
                >
                  {t('signin.label.rememberpwd')}
                </Checkbox>
              )}
            </div>
            {isPWD && (
              <span
                onClick={() => navigate('/set-password')}
                className="text-primary text-sm font-semibold cursor-pointer hover:opacity-70 active:opacity-70"
              >
                {t('signin.label.forgotPwd')}
              </span>
            )}
          </div>
        </div>

        <PrimaryButton isLoading={loading} isDisabled={isDisabled} onPress={handleLogin}>
          {t('common.label.login')}
        </PrimaryButton>

        <div className="text-center text-sm my-5">
          <span
            onClick={() => navigate('/register?origin=login_tip', { replace: true })}
            className="auth-link"
          >
            {t('common.label.register')}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-end items-center *:not-first:mt-2">
          {socialLogin.enabled && (
            <>
              <div className="flex w-full items-center justify-center mb-3">
                <div className="auth-divider h-0.25 flex-1" />
                <span className="text-xs text-sec font-bold mx-3">Or</span>
                <div className="auth-divider h-0.25 flex-1" />
              </div>
              {channel?.startsWith('TG') ? (
                <Button
                  className="auth-social"
                  disabled={loading}
                  onPress={handleTelegramLogin}
                >
                  <div className="size-6"><TelegramIcon /></div>
                  <span className="text-sec font-bold text-xs">
                    {t('signin.label.signinWith', { channel: 'Telegram' })}
                  </span>
                </Button>
              ) : (
                <Button
                  className="auth-social"
                  disabled={loading}
                  onPress={handleGoogleLogin}
                >
                  <div className="size-6"><GoogleIcon /></div>
                  <span className="text-sec font-bold text-xs">
                    {t('signin.label.signinWith', { channel: 'Google' })}
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <NavBarSpacer />
    </div>
  )
}

export default LoginPage
