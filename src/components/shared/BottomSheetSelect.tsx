import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, ScrollShadow } from '@nextui-org/react'
import { useUIStore } from '../../stores/uiStore'
import { CloseIcon } from './CloseIcon'
import { CheckIcon } from './CheckIcon'
import { NavBarSpacer } from './NavBarSpacer'

interface BottomSheetSelectProps {
  disabled?: boolean
  children: React.ReactNode
  sheetHeaderTitle?: string
  sheetHeaderTitleRender?: React.ReactNode
  list: any[]
  itemRender?: (item: any, index: number) => React.ReactNode
  itemHeight?: number | string
  labelKey?: string
  valueKey?: string
  value: any
  onValueChange?: (value: any) => void
  onValueDetailChange?: (item: any) => void
  className?: string
  onOpenChange?: (isOpen: boolean) => void
  hiddenCorrect?: boolean
}

export const BottomSheetSelect = ({
  disabled = false,
  children,
  sheetHeaderTitle,
  sheetHeaderTitleRender,
  list,
  itemRender,
  itemHeight,
  labelKey = 'label',
  valueKey = 'value',
  value,
  onValueChange,
  onValueDetailChange,
  className,
  onOpenChange: onOpenChangeProp,
  hiddenCorrect = false,
}: BottomSheetSelectProps) => {
  const { t } = useTranslation()
  const { isOpen, onOpenChange } = useDisclosure()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onOpenChangeProp?.(isOpen)
    if (!isOpen) return
    const container = scrollRef.current
    const selected = container?.getElementsByClassName('bg-selected')[0] as HTMLElement
    if (!selected) return
    const { height, top } = selected.getBoundingClientRect()
    container!.children[0].scrollTo({
      top: top - container!.getBoundingClientRect().top - height,
    })
  }, [isOpen])

  const screenWidth = useUIStore((s) => s.screenWidth)

  return (
    <>
      <div
        className={`${disabled ? 'opacity-30' : ''} ${className}`}
        onClick={disabled ? undefined : onOpenChange}
      >
        {children}
      </div>
      <Modal
        isOpen={isOpen}
        backdrop="blur"
        placement="bottom"
        classNames={{
          base: 'z-65',
          wrapper: 'z-65',
          backdrop: 'z-65',
        }}
        hideCloseButton
        onOpenChange={onOpenChange}
        style={{ padding: 0 }}
      >
        <ModalContent
          className="m-0 rounded-none rounded-t-lg sm:my-0 sm:mx-0"
          style={{ maxWidth: screenWidth }}
        >
          <ModalHeader className="p-5 text-sm text-main justify-between">
            {sheetHeaderTitleRender || (
              <>
                {sheetHeaderTitle || t('common.label.choese')}
                <div className="flex-1" />
                <CloseIcon className="text-sec-acc" onClick={onOpenChange} />
              </>
            )}
          </ModalHeader>
          <ModalBody className="max-h-[50vh] pb-3 pt-0 px-5 flex flex-col">
            <div ref={scrollRef} className="flex flex-col flex-1 overflow-hidden">
              <ScrollShadow>
                {list.map((item, index) => {
                  const row = item as any
                  return (
                    <div
                      key={index}
                      className={`px-3 flex items-center text-sm text-sec ${row[valueKey] === value ? 'bg-selected' : ''} ${!itemHeight && 'h-12'} ${!itemRender && item.disabled ? 'opacity-30' : ''}`}
                      style={{ height: itemHeight }}
                      onClick={() => {
                        if (item.disabled) return
                        onValueChange?.(row[valueKey])
                        onValueDetailChange?.(item)
                        onOpenChange()
                      }}
                    >
                      {itemRender ? (
                        itemRender(item, index)
                      ) : (
                        <>
                          {row[labelKey]}
                          <div className="flex-1" />
                        </>
                      )}
                      {!hiddenCorrect && row[valueKey] === value && <CheckIcon />}
                    </div>
                  )
                })}
              </ScrollShadow>
            </div>
            <NavBarSpacer />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
