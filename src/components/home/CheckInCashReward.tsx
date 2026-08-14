import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import lottie from 'lottie-web/build/player/lottie_light'
import { CheckInCardWrapper } from './CheckInModal'
import { useAuthStore } from '../../stores/authStore'
import { fetchJsonCached } from '../../utils/jsonCache'
import { getHomeGameList } from '../../services/hallApi'

const CASH_RAIN_GAME_CODE = 'BRC'
const LOTTERY_CATEGORY_ID = 1

interface LottieKeyframe {
  s?: number[]
  [key: string]: unknown
}

interface LottieTransform {
  a?: { k?: number[] }
  p?: { k?: number[] }
  s?: { k?: number[] | LottieKeyframe[] }
  [key: string]: unknown
}

interface LottieLayer {
  ks?: LottieTransform
  cl?: unknown
  [key: string]: unknown
}

interface LottieAsset {
  h?: number
  w?: number
  p?: string
  [key: string]: unknown
}

interface LottieData {
  assets?: LottieAsset[]
  layers?: LottieLayer[]
  [key: string]: unknown
}

const hourAssetMap: Record<string, string> = {
  '00': '00.webp',
  '0': '00.webp',
  '09': '09.webp',
  '9': '09.webp',
  '12': '12.webp',
  '14': '14.webp',
  '18': '18.webp',
  '20': '20.webp',
}

const CashRewardLottie = ({ onClick }: { onClick?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<ReturnType<typeof lottie.loadAnimation> | null>(null)
  const [cashRewardRunning, setCashRewardRunning] = useState(false)
  const [startHour, setStartHour] = useState(
    localStorage.getItem('lastCashRewardStartHour') ?? '09'
  )

  useEffect(() => {
    setCashRewardRunning(!!sessionStorage.getItem('cashRewardRunning'))

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setCashRewardRunning(detail.cashRewardRunning)
      sessionStorage.setItem(
        'cashRewardRunning',
        detail.cashRewardRunning ? 'true' : ''
      )
      if (detail.startTime) {
        const date = new Date(detail.startTime * 1e3)
        const fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          hour12: false,
        })
        const [{ value: hour }] = fmt
          .formatToParts(date)
          .filter((p) => p.type === 'hour')
        setStartHour(hour)
      }
    }

    window.addEventListener('triggerCashRewardRender', handler)
    return () => {
      window.removeEventListener('triggerCashRewardRender', handler)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    fetchJsonCached<LottieData>('/json/home-cash-reward.json')
      .then((data) => {
        if (!containerRef.current) return

        const clonedData = JSON.parse(JSON.stringify(data)) as LottieData

        if (!cashRewardRunning) {

          if (clonedData.assets?.[0]) {
            clonedData.assets[0].h = 128
          }
          if (clonedData.layers?.[0]?.ks) {
            if (clonedData.layers[0].ks.a?.k?.[1] !== undefined) clonedData.layers[0].ks.a.k[1] = 64
            if (clonedData.layers[0].ks.p?.k) clonedData.layers[0].ks.p.k = [245, 197, 0]
            if (clonedData.layers[0].ks.s?.k) clonedData.layers[0].ks.s.k = [100, 100, 0]
          }

          const resolvedHour = startHour ?? localStorage.getItem('lastCashRewardStartHour') ?? '09'
          if (clonedData.assets?.[1]) {
            clonedData.assets[1].p = hourAssetMap[resolvedHour] || '09.webp'
            clonedData.assets[1].w = 186
          }
          if (clonedData.layers?.[1]?.ks?.a?.k?.[0] !== undefined) {
            clonedData.layers[1].ks.a.k[0] = 93
          }

          if (clonedData.layers?.[2]?.ks?.s?.k) {
            const sk = clonedData.layers[2].ks.s.k as LottieKeyframe[]
            if (sk[0]?.s) sk[0].s = [160, 160, 100]
            if (sk[1]?.s) sk[1].s = [165, 165, 100]
            if (sk[2]?.s) sk[2].s = [160, 160, 100]
            if (sk[3]?.s) sk[3].s = [165, 165, 100]
            if (sk[4]?.s) sk[4].s = [160, 160, 100]
            if (sk[5]?.s) sk[5].s = [165, 165, 100]
            if (sk[6]?.s) sk[6].s = [160, 160, 100]
          }

          if (clonedData.layers?.[4]?.ks?.s?.k) {
            clonedData.layers[4].ks.s.k = [129.167, 129.167, 100]
          }
          if (clonedData.layers?.[4]?.cl !== undefined) {
            delete clonedData.layers[4].cl
          }
        }

        localStorage.setItem('lastCashRewardStartHour', startHour)

        if (animRef.current) {
          animRef.current.destroy()
          animRef.current = null
        }

        animRef.current = lottie.loadAnimation({
          container: containerRef.current!,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: clonedData,
        })
      })
      .catch(() => {})

    return () => {
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
    }
  }, [cashRewardRunning, startHour])

  return (
    <div
      ref={containerRef}
      className="size-14"
      onClick={() => {
        const hasToken = useAuthStore.getState().token || localStorage.getItem('token')
        if (!hasToken) {
          window.dispatchEvent(new CustomEvent('openLoginModal'))
          return
        }
        onClick?.()
      }}
    />
  )
}

export const CheckInCashReward = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const lottieKey = 1
  const [cashRainEnabled, setCashRainEnabled] = useState(false)

  useEffect(() => {
    getHomeGameList({ categoryId: LOTTERY_CATEGORY_ID })
      .then((data) => {
        setCashRainEnabled(
          (data?.home ?? []).some((g) => g.gameCode === CASH_RAIN_GAME_CODE),
        )
      })
      .catch(() => setCashRainEnabled(false))
  }, [])

  return (
    <div className={cashRainEnabled ? 'grid grid-cols-2 gap-2 p-3' : 'grid grid-cols-1 gap-2 p-3'}>

      <CheckInCardWrapper>
        <div className="brand-checkin flex items-center justify-between p-2 h-20.5 relative rounded-lg dark:bg-[radial-gradient(55%_85%_at_70%_70%,_#BB2514_0%,_#362F2A_100%)]">
          <div className="h-full flex flex-col justify-between">
            <div className="text-sm font-bold text-main">{t('earnMoney.label.checkIn')}</div>
            <div className="text-10 text-sec">{t('earnMoney.label.checkInEntryDec')}</div>
            <div>
              <span className="h-6 px-4 rounded bg-primary text-black text-xs font-bold leading-6 inline-block">
                {t('common.label.claim')}
              </span>
            </div>
          </div>
          <lottie-player
            className="size-20 absolute right-0 top-0"
            src="/json/home-check-in.json"
            autoplay
            loop
            key={'home-gold-area-check-in' + lottieKey}
          />
        </div>
      </CheckInCardWrapper>

      {cashRainEnabled && (
        <div
          className="brand-checkin flex items-center justify-between p-2 h-20.5 relative rounded-lg dark:bg-[radial-gradient(55%_85%_at_70%_70%,_#BB2514_0%,_#362F2A_100%)]"
          onClick={() => navigate('/cash-rain')}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="text-sm font-bold text-main">{t('cashReward.label.title')}</div>
            <div className="text-10 text-sec">{t('cashReward.label.entryDesc')}</div>
            <div>
              <span className="h-6 px-4 rounded bg-primary text-black text-xs font-bold leading-6 inline-block">
                {t('common.label.get')}
              </span>
            </div>
          </div>
          <CashRewardLottie
            key={'home-gold-area-cash-rain' + lottieKey}
            onClick={() => navigate('/cash-rain')}
          />
        </div>
      )}
    </div>
  )
}
