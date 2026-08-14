import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { resolveAssetUrl } from '../../utils/helpers'
import { TicketCard as GameHeaderCard } from '../shared/TicketCard'
import { CountdownDisplay } from '../shared/CountdownDisplay'
import { ScrollToTabButton } from '../shared/ScrollToTabButton'
import { subscribeToClock } from '../../hooks/useClock'
import { useUIStore } from '../../stores/uiStore'
import { formatDate } from '../../utils/date'
import { KeralaGameInfo } from '../../services/keralaApi'

interface KeralaGameHeaderProps {
  info?: KeralaGameInfo
  onTimeEnd?: () => void
  drawTime?: number
  serverOffset?: number
}

export function KeralaGameHeader({ info, onTimeEnd, drawTime, serverOffset }: KeralaGameHeaderProps) {
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const { t } = useTranslation()
  const [remainSec, setRemainSec] = useState(0)
  const wasCountingRef = useRef(false)

  useEffect(() => {
    return subscribeToClock(() => {
      const hasDraw = typeof drawTime === 'number' && drawTime > 0
      const secs = hasDraw
        ? Math.round((drawTime - (Date.now() + (serverOffset || 0))) / 1000)
        : Math.max(0, Math.trunc(info?.drawTimeLong || 0))
      setRemainSec(secs)
    })
  }, [drawTime, serverOffset, info])

  const remainValue = useMemo(() => {
    const s = Math.max(0, remainSec)
    return {
      days: String(Math.floor(s / 86400)).padStart(2, '0'),
      hours: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
      seconds: String(s % 60).padStart(2, '0'),
    }
  }, [remainSec])

  useEffect(() => {
    if (remainSec > 0) {
      wasCountingRef.current = true
    } else if (wasCountingRef.current) {
      wasCountingRef.current = false
      setTimeout(() => onTimeEnd?.(), 1000)
    }
  }, [remainSec])

  const lastPrefixChars = (info?.lastPrefix || '').split('')
  const lastCodeDigits = (info?.lastCode || '------').split('')

  return (
    <GameHeaderCard
      className="flex flex-col text-white shrink-0"
      bgColor={isDarkMode ? 'var(--bg-color-gray)' : 'var(--bg-color-lightGray)'}
      cardClassName="bg-linear-to-b from-[#D0A1FF] to-[#9328FF]"
    >
      <div className="flex items-center">
        <img
          alt="gameLogo"
          src={resolveAssetUrl(info?.icon)}
          className="size-10 rounded-sm mr-2 object-contain"
        />
        <div className="flex flex-col font-bold">
          <span className="text-sm mb-1">{info?.keralaName}</span>
          <span className="text-xs">NO.{info?.roundNo}</span>
        </div>
        <div className="flex-1 flex justify-end">
          <div className="flex flex-col rounded-sm border border-black/20 bg-white/10 text-center px-2 py-1">
            <span className="text-9 mb-1">
              {t('common.label.games.LastDrawResult')}
            </span>
            <div className="flex items-center gap-0.5">
              {lastPrefixChars.map((char, charIdx) => (
                <div
                  key={'p' + charIdx}
                  className="size-4.5 text-xs flex items-center justify-center rounded-full bg-black text-white"
                >
                  {char}
                </div>
              ))}
              {lastCodeDigits.map((char, charIdx) => (
                <div
                  key={charIdx}
                  className="size-4.5 text-xs flex items-center justify-center rounded-full bg-white text-black border border-black"
                >
                  {char}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <div className="flex-1 flex p-2 bg-black/20 justify-between items-center">
          <div className="flex flex-col">
            <span className="text-10">New Draw</span>
            <p className="text-sm font-bold">
              {info?.drawTimeSec ? formatDate(info.drawTimeSec * 1000, 'MMMM ddsuffix hh:mm') : '-- --'}
            </p>
          </div>
          <CountdownDisplay timeData={remainValue} />
        </div>
        <ScrollToTabButton
          className="bg-black/20!"
          pid="Kerala_Game_Container"
          cid="Kerala_Btn_Tab"
        />
      </div>
    </GameHeaderCard>
  )
}
