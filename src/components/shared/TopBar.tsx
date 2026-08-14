import { useUIStore } from '../../stores/uiStore'
import { useGoBack } from '../../hooks/useGoBack'
import { BackIcon } from './BackIcon'

interface TopBarProps {
  title?: React.ReactNode
  titleAlignLeft?: boolean
  hideBack?: boolean
  onBack?: () => void
  leftNode?: React.ReactNode
  rightNode?: React.ReactNode
  color?: string
  background?: string
  boxShadow?: string
  leftIconClassName?: string
  className?: string
}

export const TopBar = ({
  title,
  titleAlignLeft = true,
  hideBack,
  onBack,
  leftNode,
  rightNode,
  color,
  background,
  boxShadow = '0px 4px 16px 0px rgba(0, 0, 0, 0.10)',
  leftIconClassName,
  className,
}: TopBarProps) => {
  const statusBarHeight = useUIStore((s) => s.statusBarHeight)
  const goBack = useGoBack()

  return (
    <div
      className={'flex flex-col w-full bg-white dark:bg-gray relative z-40' + (className ? ' ' + className : '')}
      style={{ background, boxShadow }}
    >
      <div style={{ height: statusBarHeight }} />
      <div className="w-full h-11 flex items-center relative z-50">
        <div className="absolute top-0 left-0 h-full pl-3 flex items-center rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
          {!hideBack && (
            <div className="mr-2 rtl:mr-0 rtl:ml-2" onClick={onBack || goBack}>
              <BackIcon className={leftIconClassName} />
            </div>
          )}
          {leftNode}
          {title && titleAlignLeft && (
            <div className="font-bold text-main" style={{ color }}>
              {title}
            </div>
          )}
        </div>
        {title && !titleAlignLeft && (
          <div className="flex flex-1 items-center justify-center font-bold text-main" style={{ color }}>
            {title}
          </div>
        )}
        <div className="absolute top-0 right-0 h-full pr-3 flex items-center rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-3">
          {rightNode}
        </div>
      </div>
    </div>
  )
}
