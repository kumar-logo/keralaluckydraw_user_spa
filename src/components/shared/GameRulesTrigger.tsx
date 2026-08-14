import { useState, useMemo } from 'react'
import { Modal, ModalContent } from '@nextui-org/react'
import { useTranslation } from 'react-i18next'

const ChevronDown = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TabIcon = () => (
  <svg style={{ width: '1.25rem', height: '1.3125rem' }} viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.66602 18.834H18.3327" stroke="var(--color-white)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.66602 11.334L4.99935 12.1673V16.334H1.66602V11.334Z" fill="var(--color-white)" />
    <path d="M8.33398 10.5007L11.6673 8.83398V16.334H8.33398V10.5007Z" fill="var(--color-white)" />
    <path d="M15 7.16667L18.3333 5.5V16.3333H15V7.16667Z" fill="var(--color-white)" />
    <path d="M1.66602 7.99935L4.99935 8.83268L18.3327 2.16602H14.166" stroke="var(--color-white)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RulesIcon = ({ onClick }: { onClick?: () => void }) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center w-12 text-white text-xs cursor-pointer" onClick={onClick}>
      <svg className="size-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18.75C14.8325 18.75 18.75 14.8325 18.75 10C18.75 5.16751 14.8325 1.25 10 1.25C5.16751 1.25 1.25 5.16751 1.25 10C1.25 14.8325 5.16751 18.75 10 18.75ZM9.97997 9.24892C9.32709 9.75353 8.59362 10.3204 8.73011 11.3409H10.2074C10.1158 10.5513 10.7013 10.1075 11.3052 9.64958C11.9007 9.19803 12.5142 8.73285 12.5142 7.90909C12.5142 6.39773 11.3097 5.625 9.66193 5.625C8.44602 5.625 7.44602 6.18182 6.71875 7.02273L7.65057 7.875C8.20739 7.29545 8.77557 6.97727 9.46875 6.97727C10.3665 6.97727 10.9119 7.36364 10.9119 8.05682C10.9119 8.52861 10.4685 8.87133 9.97997 9.24892ZM8.46875 13.3636C8.46875 13.9545 8.8892 14.375 9.48011 14.375C10.0483 14.375 10.4801 13.9545 10.4801 13.3636C10.4801 12.7727 10.0483 12.3636 9.48011 12.3636C8.90057 12.3636 8.46875 12.7727 8.46875 13.3636Z" fill="currentColor" />
      </svg>
      {t('common.label.games.rules')}
    </div>
  )
}

interface GameRulesTriggerProps {
  triggleRules?: () => void
  supportRuleTrigger?: { triggerRender?: React.ReactNode; children?: React.ReactNode; titlePrefix?: string; [key: string]: any }
  triggleScroll?: () => void
  pid?: string
  cid?: string
  className?: string
}

export const GameRulesTrigger = ({
  triggleRules,
  supportRuleTrigger,
  triggleScroll,
  pid,
  cid,
  className,
}: GameRulesTriggerProps) => {
  const [rulesOpen, setRulesOpen] = useState(false)
  const hasRules = useMemo(() => !!(triggleRules || supportRuleTrigger), [triggleRules, supportRuleTrigger])

  const handleRulesClick = () => {
    if (triggleRules) triggleRules()
    else if (supportRuleTrigger) setRulesOpen(true)
  }

  return (
    <>
      <div className={'flex items-center bg-black/10' + (className ? ' ' + className : '')}>
        {hasRules && (
          <RulesIcon onClick={handleRulesClick} />
        )}
        {(triggleScroll || (pid && cid)) && (
          <>
            {hasRules && <div className="h-8 w-px bg-white/30" />}
            <div
              className="flex flex-col items-center w-12"
              onClick={() => {
                if (triggleScroll) {
                  triggleScroll()
                } else if (pid && cid) {
                  const container = document.querySelector(`#${pid}`)
                  const target = document.querySelector(`#${cid}`)
                  if (container && target) {
                    container.scrollTo({
                      top: target.getBoundingClientRect().top,
                      behavior: 'smooth',
                    })
                  }
                }
              }}
            >
              <TabIcon />
              <ChevronDown className="size-3.5 text-white!" />
            </div>
          </>
        )}
      </div>

      {supportRuleTrigger?.children && (
        <Modal
          isOpen={rulesOpen}
          onOpenChange={(v) => { if (!v) setRulesOpen(false) }}
          placement="center"
          hideCloseButton
          radius="none"
          classNames={{
            backdrop: 'z-60',
            wrapper: 'z-60',
          }}
        >
          <ModalContent className="flex flex-col mx-2 p-5 rounded-2xl max-h-[80vh] capitalize">
            <div className="w-full flex items-center justify-between font-bold text-main mb-3">
              <span>{supportRuleTrigger.titlePrefix ? supportRuleTrigger.titlePrefix + ' ' : ''}Rules</span>
              <div className="text-sec-acc cursor-pointer" onClick={() => setRulesOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.8359 8.70685C17.2265 8.31632 17.2265 7.68316 16.8359 7.29264C16.4454 6.90212 15.8122 6.90213 15.4217 7.29266L12.0644 10.65L8.70712 7.29266C8.3166 6.90213 7.68343 6.90212 7.2929 7.29264C6.90237 7.68316 6.90237 8.31632 7.29288 8.70685L10.6502 12.0643L7.29288 15.4217C6.90237 15.8122 6.90237 16.4454 7.2929 16.8359C7.68343 17.2264 8.3166 17.2264 8.70712 16.8359L12.0644 13.4785L15.4217 16.8359C15.8122 17.2264 16.4454 17.2264 16.8359 16.8359C17.2265 16.4454 17.2265 15.8122 16.8359 15.4217L13.4786 12.0643L16.8359 8.70685Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto text-sm text-sec">
              {supportRuleTrigger.children}
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}
