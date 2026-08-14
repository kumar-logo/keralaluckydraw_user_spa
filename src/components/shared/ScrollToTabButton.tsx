import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RulesIcon } from './RulesIcon'
import { ChevronIcon } from './ChevronIcon'

const ChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    style={{ width: '1.25rem', height: '1.3125rem' }}
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.66602 18.834H18.3327"
      stroke="var(--color-white)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.66602 11.334L4.99935 12.1673V16.334H1.66602V11.334Z"
      fill="var(--color-white)"
    />
    <path
      d="M8.33398 10.5007L11.6673 8.83398V16.334H8.33398V10.5007Z"
      fill="var(--color-white)"
    />
    <path
      d="M15 7.16667L18.3333 5.5V16.3333H15V7.16667Z"
      fill="var(--color-white)"
    />
    <path
      d="M1.66602 7.99935L4.99935 8.83268L18.3327 2.16602H14.166"
      stroke="var(--color-white)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const RulesTrigger = ({ triggleRules }: { triggleRules?: () => void }) => {
  const { t } = useTranslation()
  return (
    <div
      className="text-xs text-white flex flex-col items-center w-12"
      onClick={() => triggleRules?.()}
    >
      <RulesIcon className="size-5 text-white" />
      {t('common.label.games.rules')}
    </div>
  )
}

interface ScrollToTabButtonProps {
  triggleRules?: () => void
  triggleScroll?: () => void
  pid?: string
  cid?: string
  className?: string
}

export const ScrollToTabButton = ({
  triggleRules,
  triggleScroll,
  pid,
  cid,
  className,
}: ScrollToTabButtonProps) => {
  const hasRules = useMemo(() => !!triggleRules, [triggleRules])

  return (
    <div className={'flex items-center bg-black/10' + (className ? ' ' + className : '')}>
      {hasRules && <RulesTrigger triggleRules={triggleRules} />}
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
            <ChartIcon />
            <ChevronIcon className="size-3.5 text-white!" />
          </div>
        </>
      )}
    </div>
  )
}
