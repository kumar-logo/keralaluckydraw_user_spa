import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, Button } from '@nextui-org/react'
import { ScrollPicker } from './ScrollPicker'

const DEFAULT_OPTIONS = '-0123456789'.split('')

interface NumberPickerModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectValue: string[]
  onConfirm: (values: string[]) => void
  length?: number
  scopMap?: Record<number, string[]>
}

export const NumberPickerModal = ({
  isOpen,
  onOpenChange,
  selectValue,
  onConfirm,
  length = 7,
  scopMap = {},
}: NumberPickerModalProps) => {
  const { t } = useTranslation()

  const [pickerValue, setPickerValue] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (let i = 0; i < length; i++) init[i] = '-'
    return init
  })

  useEffect(() => {
    if (selectValue && selectValue.length) {
      const v: Record<string, string> = {}
      selectValue.forEach((val, idx) => {
        v[idx] = val
      })
      setPickerValue(v)
    }
  }, [selectValue])

  const columns = useMemo(() => {
    const cols: Record<string, string[]> = {}
    for (let i = 0; i < length; i++) {
      cols[i] = DEFAULT_OPTIONS
    }
    if (scopMap) {
      Object.keys(scopMap).forEach((key) => {
        const scope = scopMap[parseInt(key)]
        if (scope && scope.length) {
          cols[parseInt(key)] = ['-', ...scope]
        }
      })
    }
    return cols
  }, [scopMap, length])

  const hasEmpty = useMemo(
    () => Object.values(pickerValue).some((v) => v === '-'),
    [pickerValue]
  )

  return (
    <Modal
      placement="bottom"
      backdrop="opaque"
      classNames={{
        base: 'dice m-0 rounded-t-lg',
      }}
      radius="none"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton
    >
      <ModalContent className="h-100">
        {(onClose) => (
          <>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-main text-sm font-bold">
                  {t('common.tip.info.selectNumber')}
                </p>
                <p
                  className="text-xs text-acc"
                  dangerouslySetInnerHTML={{
                    __html: t('common.tip.info.selectNumberTip', {
                      num: `<span class="font-bold">${length}</span>`,
                    }),
                  }}
                />
              </div>
              <Button
                isDisabled={hasEmpty}
                onPress={() => {
                  onConfirm(Object.values(pickerValue))
                  onClose()
                }}
                className="text-sm font-bold text-black bg-linear-primary-tb shadow-btn-primary px-5 py-3 rounded-lg"
              >
                {t('common.label.confirm')}
              </Button>
            </div>

            <div className="px-5">
              <ScrollPicker
                itemHeight={56}
                height={300}
                value={pickerValue}
                onChange={setPickerValue}
                columns={columns}
              >
                <div className="absolute h-[56px] w-full top-[50%] pointer-events-none translate-y-[-50%] flex">
                  {Object.keys(columns).map((_, idx) => (
                    <div key={idx} className="flex flex-1 justify-center items-center">
                      <div className="flex size-10 rounded-full bg-selected border border-main/40" />
                    </div>
                  ))}
                </div>
              </ScrollPicker>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
