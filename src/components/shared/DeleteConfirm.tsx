import { useTranslation } from 'react-i18next'
import { AnimatedButton } from './AnimatedButton'
import { ConfirmDialog } from './ConfirmDialog'
import { DeleteIcon } from './DeleteIcon'

interface DeleteConfirmProps {
  iconProps?: React.SVGProps<SVGSVGElement>
  onDel: () => Promise<boolean> | void
  tipKey?: string
  isDisabled?: boolean
  children?: React.ReactNode
  className?: string
}

export const DeleteConfirm = ({
  iconProps,
  onDel,
  tipKey = 'common.tip.confirm.clearNumbers',
  isDisabled = false,
  children,
  className,
}: DeleteConfirmProps) => {
  const { t } = useTranslation()
  const { render, show } = ConfirmDialog({
    title: 'Tip',
    subTitle: t(tipKey),
    onConfirm: onDel,
  })

  return (
    <AnimatedButton
      isIconOnly
      className={'bg-transparent min-w-0 min-h-0 ' + className}
      style={{ height: 'auto', width: 'auto' }}
      onPress={() => {
        if (tipKey) show(); else onDel?.()
      }}
      isDisabled={isDisabled}
    >
      {children || <DeleteIcon {...iconProps} />}
      {render}
    </AnimatedButton>
  )
}
