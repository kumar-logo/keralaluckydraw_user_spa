import { useMemo } from 'react'
import { Image } from '@nextui-org/react'
import clsx from 'clsx'
import { useUIStore } from '../../stores/uiStore'
import { resolveAssetUrl } from '../../utils/helpers'

const LIGHT_FALLBACK = '/images/common/error-img-light.webp'
const DARK_FALLBACK = '/images/common/error-img-dark.webp'

interface GameImageProps {
  src?: string
  imgId?: string
  variant?: string
  alt?: string
  classNames?: {
    wrapper?: string
    img?: string
    zoomedWrapper?: string
    blurredImg?: string
  }
  className?: string
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  [key: string]: unknown
}

export const GameImage = ({
  classNames: cn = {},
  src,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  imgId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant = 'original512',
  ...rest
}: GameImageProps) => {
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  const resolvedSrc = useMemo(() => {
    if (!src) return ''
    return resolveAssetUrl(src)
  }, [src])

  const fallback = useMemo(() => (isDarkMode ? DARK_FALLBACK : LIGHT_FALLBACK), [isDarkMode])

  return (
    <Image
      src={resolvedSrc}
      classNames={{
        wrapper: clsx('max-w-none! bg-cover bg-no-repeat bg-center bg-gray dark:bg-selected', cn.wrapper),
        img: clsx('opacity-100!', cn.img),
        zoomedWrapper: cn.zoomedWrapper,
        blurredImg: cn.blurredImg,
      }}
      fallbackSrc={fallback}
      {...rest}
    />
  )
}

export default GameImage
