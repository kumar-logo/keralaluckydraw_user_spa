import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, Button } from '@nextui-org/react'
import { ScrollPicker } from './ScrollPicker'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthPickerModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onConfirm: (month: string) => void
  yearsBack?: number
}

export const MonthPickerModal = ({
  isOpen,
  onOpenChange,
  value,
  onConfirm,
  yearsBack = 3,
}: MonthPickerModalProps) => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const years = useMemo(() => {
    const arr: string[] = []
    for (let y = currentYear - yearsBack; y <= currentYear; y++) arr.push(String(y))
    return arr
  }, [currentYear, yearsBack])

  const [pickerValue, setPickerValue] = useState<Record<string, string>>({
    month: MONTHS[currentMonth],
    year: String(currentYear),
  })

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      if (y && m) setPickerValue({ month: MONTHS[m - 1], year: String(y) })
    }
  }, [value])

  const columns = useMemo(() => ({ month: MONTHS, year: years }), [years])

  const toMonthString = (pv: Record<string, string>) => {
    const m = MONTHS.indexOf(pv.month) + 1
    return `${pv.year}-${String(m).padStart(2, '0')}`
  }

  return (
    <Modal
      placement="bottom"
      backdrop="opaque"
      classNames={{ base: 'm-0 rounded-t-lg bg-white dark:bg-gray' }}
      radius="none"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton
    >
      <ModalContent className="h-100">
        {(onClose) => (
          <>
            <div className="p-5 flex items-center justify-between">
              <p className="text-main text-base font-bold">{t('common.label.selectMonth')}</p>
              <Button
                onPress={() => {
                  onConfirm(toMonthString(pickerValue))
                  onClose()
                }}
                className="text-sm font-bold text-black bg-linear-primary-tb shadow-btn-primary px-6 py-3 rounded-lg"
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
              />
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
