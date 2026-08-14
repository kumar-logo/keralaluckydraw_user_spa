import { useState, useEffect } from 'react'
import { Button, Image } from '@nextui-org/react'
import { useCountdown } from '../../hooks/useCountdown'
import { CountdownDisplay } from '../shared/CountdownDisplay'

const GAME_TYPE_COLORS: Record<string, string> = {
  color: '#4C914F',
  dice: '#BD4444',
  digit: '#2F76E1',
  kerala: '#EF9000',
  mixLotto: '#66468A',
  punjab: '#448124',
  '45d': '#8C73FF',
  dubai: '#8637BD',
}

interface ResultGameCoverProps {
  icon: string
  title: React.ReactNode
  gameType: string
  desc?: string
  subheading?: string
  nextDraw?: React.ReactNode
  countDown?: number
  descClassName?: string
  coverClass?: string
  className?: string
  hidePlayBtn?: boolean
  right?: React.ReactNode
  bottom?: React.ReactNode
  onPlay?: () => void
  onTimeEnd?: () => void
}

export const ResultGameCover = ({
  icon,
  title,
  gameType,
  desc = '',
  subheading = '',
  nextDraw = '',
  countDown = -1,
  descClassName = '',
  coverClass = '',
  className = '',
  hidePlayBtn = false,
  right,
  bottom,
  onPlay,
  onTimeEnd,
}: ResultGameCoverProps) => {
  const [started, setStarted] = useState(false)
  const { remainValue, remainTime } = useCountdown({ countDown: started, initRemainTime: countDown })

  useEffect(() => {
    if (countDown >= 0) setStarted(true)
  }, [countDown])

  useEffect(() => {
    if (started && remainTime === 0) onTimeEnd?.()
  }, [remainTime, started])

  return (
    <>
      <div className={`p-3 ${className}`} style={{ backgroundColor: GAME_TYPE_COLORS[gameType] }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-1">
            <Image src={icon} classNames={{ img: `h-13 rounded-none ${coverClass}`, wrapper: 'rounded-none' }} />
            {title ? (
              <div className="text-white ml-2 font-bold">
                <p>{title}</p>
                {desc ? <p className={`text-xs mt-1 ${descClassName}`}>{desc}</p> : null}
              </div>
            ) : null}
          </div>
          {right}
        </div>
        {!hidePlayBtn && (
          <div className="bg-[rgba(0,0,0,0.20)] p-2 flex justify-between items-center mt-2">
            <div className="text-white">
              <p className="text-10">{subheading}</p>
              <p className="text-xs font-bold mt-1">{nextDraw}</p>
            </div>
            <div className="flex items-center gap-x-2">
              <CountdownDisplay timeData={remainValue} />
              {countDown > 0 && (
                <Button
                  onPress={onPlay}
                  className="h-7 rounded-full bg-[rgba(255,255,255,0.30)] border border-white text-white text-xs font-bold min-w-0 px-3"
                >
                  Play
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      {bottom}
    </>
  )
}
