import { useMemo, ReactNode } from 'react'
import clsx from 'clsx'

interface SpriteConfig {
  image: string
  size: [number, number] | string
  posMap: Record<string, [number, number] | string>
}

interface SpriteProps {
  pos: string
  scale?: number
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
  onClick?: () => void
  [key: string]: any
}

export const createSpriteIcon = (config: SpriteConfig) => {
  const { image, size, posMap } = config
  return ({ pos, scale = 1, className, style, children, ...rest }: SpriteProps) => {
    const [bgSize, bgPos] = useMemo(() => {
      const position = posMap[pos]
      const isString = typeof size === 'string'
      const sizeValue = isString ? size : `${size[0] * scale}rem ${size[1] * scale}rem`
      const bgPosition = typeof position === 'string' ? position : `${-position[0] * (isString ? 1 : scale)}rem ${-position[1] * (isString ? 1 : scale)}rem`
      return [sizeValue, bgPosition]
    }, [pos, scale])

    return (
      <div
        className={clsx('bg-no-repeat', className)}
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: bgSize,
          backgroundPosition: bgPos,
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    )
  }
}

export const HomeSpriteIcon = createSpriteIcon({
  image: '/images/home/sprite-v7.webp',
  size: [23.5, 57.125],
  posMap: {
    fireTabIcon: '0 0',
    casinoTabIcon: '-2.625rem 0',
    slotTabIcon: '-5.25rem 0',
    lotteryTabIcon: '-7.875rem 0',
    fishingTabIcon: '-10.5rem 0',
    liveTabIcon: '-13.125rem 0',
    tabActiveBg: '0 52.375rem',
    totalStatisticsBg: '0 -2.625rem',
    compensationBannerBg: '0 -21rem',
    downloadBannerBg: '0 -27.75rem',
    firstRechargeBg: '0 -32.375rem',
    giftCodeBg: '-7.125rem -32.375rem',
    rankingBg: '-14.25rem -32.375rem',
    '5dIcon': [0, 37.25],
    raceIcon: [1.625, 37.25],
    dubaiIcon: [3.25, 37.25],
    '3dIcon': [4.875, 37.25],
    keralaIcon: [6.5, 37.25],
    mysteryBoxIcon: '-8.125rem -37.25rem',
    colorIcon: [15, 37.25],
    diceIcon: [16.625, 37.25],
    winprizeIcon: '-9.75rem -37.5rem',
    raceBg: '0 -38.875rem',
    k3Bg: '0 -45.625rem',
    wingoBg: '-10.875rem -45.625rem',
    recentIcon: [10.875, 37.375],
    collectIcon: [12.25, 37.375],
    allIcon: [13.625, 37.375],
  },
})

const SOCIAL_ICON_OFFSETS: Record<string, number> = {
  DownLoad: 0,
  CopyLink: -3.125,
  Whatsapp: -6.25,
  Facebook: -9.375,
  Telegram: -12.5,
  SMS: -15.625,
  Email: -18.75,
  Ins: -21.875,
  x: -25,
}

export const SocialIcon = ({ type, size = 48, ...rest }: { type: string; size?: number; className?: string; [key: string]: any }) => {
  const [dim, bgSize, bgPos] = useMemo(() => {
    const offset = SOCIAL_ICON_OFFSETS[type] || 0
    const scaleFactor = size / 48
    return [
      size / 16 + 'rem',
      `${28 * scaleFactor}rem ${3 * scaleFactor}rem`,
      `top 0rem left ${offset * scaleFactor}rem`,
    ]
  }, [size, type])

  return (
    <div
      style={{
        backgroundImage: 'url(/images/referral/icon-sprite-v2.webp)',
        backgroundSize: bgSize,
        backgroundPosition: bgPos,
        height: dim,
        width: dim,
      }}
      {...rest}
    />
  )
}

export const RankSpriteIcon = createSpriteIcon({
  image: '/images/bet-rank/special-sprite-v2.webp',
  size: [20.4375, 50],
  posMap: {
    prize7000: [0, 0],
    prize2500: [4, 0],
    prize1000: [8, 0],
    prize500: [11.875, 0],
    prize100: [15.25, 0],
    bg: [0, 1.25],
    snow: [0, 7.625],
    bg2: [0, 36.25],
    newyearIcon: 'right -0.875rem top 0',
    christmasIcon: [1.125, 49],
    holiIcon: [0, 49],
    bg3: [0, 42.625],
  },
})

export const EarnMoneySpriteIcon = createSpriteIcon({
  image: '/images/earn-money/icon-sprite-v3.webp',
  size: [25.75, 2.25],
  posMap: {
    rank1st: [0, 0.375],
    rank2nd: [1.125, 0.375],
    rank3rd: [2.25, 0.375],
    phone: [3.375, 0],
    profile: [5.25, 0],
    download: [7.125, 0],
    tg: [9, 0],
    person: [10.875, 0],
    goldCoin: [12.75, 0.375],
    wallet: [13.875, 0.125],
    insurance: [15.5, 0.125],
    checkin: [17.125, 0.125],
    avatar: [18.75, 0.25],
    ticket: [20.125, 0.375],
    spin: [21.25, 0.375],
    mysteryBox: [22.375, 0.375],
    download2: [23.5, 0],
  },
})
