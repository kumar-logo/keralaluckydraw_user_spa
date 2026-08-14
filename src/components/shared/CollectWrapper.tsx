import { useState, useEffect } from 'react'
import { Button } from '@nextui-org/react'
import clsx from 'clsx'
import { useAuthStore } from '../../stores/authStore'
import { useGameStore } from '../../stores/gameStore'
import { StarIcon } from './StarIcon'

const requireAuth = () => {
  const token = useAuthStore.getState().token || localStorage.getItem('token')
  if (token) return true
  window.dispatchEvent(new CustomEvent('openLoginModal'))
  return false
}

export const CollectWrapper = ({
  className,
  children,
  game,
  ...rest
}: {
  className?: string
  children: React.ReactNode
  game: any
  [key: string]: any
}) => {
  const updateCollect = useGameStore((s) => s.updateCollect)
  const [isCollected, setIsCollected] = useState(false)

  useEffect(() => {
    setIsCollected(game.isCollect)
  }, [game])

  const handleCollect = () => {
    if (!requireAuth()) return
    const prev = isCollected
    setIsCollected(!prev)

    const homeMenuIcon = document.getElementById('HomeMenuIcon')
    if (!prev && homeMenuIcon) {

    }
    updateCollect(game, !prev).catch(() => {
      setIsCollected(prev)
    })
  }

  return (
    <div className={clsx('relative', className)} {...rest}>
      <Button
        className="size-5 p-0 min-h-auto min-w-auto absolute top-1 right-1 z-15 rounded-full"
        isIconOnly
        onPress={handleCollect}
      >
        <StarIcon
          className={clsx('duration-200 bg-gray/60', isCollected ? 'text-primary' : 'text-main')}
          fill={isCollected}
        />
      </Button>
      {children}
    </div>
  )
}
