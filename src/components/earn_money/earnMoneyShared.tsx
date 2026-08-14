import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ScrollShadow, Modal, ModalContent } from '@nextui-org/react'
import clsx from 'clsx'

export const CURRENCY_SYMBOL = '₹'

const SPRITE_IMAGE = '/images/earn-money/icon-sprite-v3.webp'
const SPRITE_SIZE = [25.75, 2.25]
const SPRITE_POS_MAP: Record<string, [number, number]> = {
  rank1st: [0, 0.375], rank2nd: [1.125, 0.375], rank3rd: [2.25, 0.375],
  phone: [3.375, 0], profile: [5.25, 0], download: [7.125, 0],
  tg: [9, 0], person: [10.875, 0], goldCoin: [12.75, 0.375],
  wallet: [13.875, 0.125], insurance: [15.5, 0.125], checkin: [17.125, 0.125],
  avatar: [18.75, 0.25], ticket: [20.125, 0.375], spin: [21.25, 0.375],
  mysteryBox: [22.375, 0.375], download2: [23.5, 0],
}

export const SpriteIcon = ({ pos, className, scale: iconScale = 1 }: { pos: string; className?: string; scale?: number }) => {
  const coords = SPRITE_POS_MAP[pos]
  if (!coords) return null
  const scale = iconScale
  return (
    <div
      className={clsx('bg-no-repeat shrink-0', className)}
      style={{
        backgroundImage: `url(${SPRITE_IMAGE})`,
        backgroundSize: `${SPRITE_SIZE[0] * scale}rem ${SPRITE_SIZE[1] * scale}rem`,
        backgroundPosition: `-${coords[0] * scale}rem -${coords[1] * scale}rem`,
      }}
    />
  )
}

const VIP_SPRITE_IMAGE = '/images/vip/vip-level-sprite.webp'
const VIP_SPRITE_SIZE = [50.75, 7.5]
const VIP_SPRITE_POS_MAP: Record<string, [number, number]> = {
  v0icon: [0, 5.25], v1icon: [2.375, 5.25], v2icon: [4.75, 5.25],
  v3icon: [7.125, 5.25], v4icon: [9.5, 5.25], v5icon: [11.875, 5.25],
  v6icon: [14.25, 5.25], v7icon: [16.625, 5.25], v8icon: [19, 5.25],
  v9icon: [21.375, 5.25], v10icon: [23.75, 5.25],
  spinIcon: [6.75, 1.625],
}

export const VipSpriteIcon = ({ pos, className, scale: s = 1 }: { pos: string; className?: string; scale?: number }) => {
  const coords = VIP_SPRITE_POS_MAP[pos]
  if (!coords) return null
  return (
    <div
      className={clsx('bg-no-repeat shrink-0', className)}
      style={{
        backgroundImage: `url(${VIP_SPRITE_IMAGE})`,
        backgroundSize: `${VIP_SPRITE_SIZE[0] * s}rem ${VIP_SPRITE_SIZE[1] * s}rem`,
        backgroundPosition: `-${coords[0] * s}rem -${coords[1] * s}rem`,
      }}
    />
  )
}

const QuestionIcon = ({ className, ...rest }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg className={clsx('size-5', className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <g clipPath="url(#clip0_20110_26478)">
      <path d="M11.998 22C14.7594 22 17.2594 20.8807 19.0691 19.0711C20.8787 17.2614 21.998 14.7614 21.998 12C21.998 9.2386 20.8787 6.7386 19.0691 4.92893C17.2594 3.11929 14.7594 2 11.998 2C9.23665 2 6.73665 3.11929 4.92698 4.92893C3.11734 6.7386 1.99805 9.2386 1.99805 12C1.99805 14.7614 3.11734 17.2614 4.92698 19.0711C6.73665 20.8807 9.23665 22 11.998 22Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12 14.3125V12.3125C13.6568 12.3125 15 10.9693 15 9.3125C15 7.65565 13.6568 6.3125 12 6.3125C10.3432 6.3125 9 7.65565 9 9.3125" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 18.8125C12.6904 18.8125 13.25 18.2529 13.25 17.5625C13.25 16.8722 12.6904 16.3125 12 16.3125C11.3097 16.3125 10.75 16.8722 10.75 17.5625C10.75 18.2529 11.3097 18.8125 12 18.8125Z" fill="currentColor" />
    </g>
    <defs>
      <clipPath id="clip0_20110_26478">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const CloseIcon = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
  <div className="text-sec-acc cursor-pointer" onClick={onClick}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M16.8359 8.70685C17.2265 8.31632 17.2265 7.68316 16.8359 7.29264C16.4454 6.90212 15.8122 6.90213 15.4217 7.29266L12.0644 10.65L8.70712 7.29266C8.3166 6.90213 7.68343 6.90212 7.2929 7.29264C6.90237 7.68316 6.90237 8.31632 7.29288 8.70685L10.6502 12.0643L7.29288 15.4217C6.90237 15.8122 6.90237 16.4454 7.2929 16.8359C7.68343 17.2264 8.3166 17.2264 8.70712 16.8359L12.0644 13.4785L15.4217 16.8359C15.8122 17.2264 16.4454 17.2264 16.8359 16.8359C17.2265 16.4454 17.2265 15.8122 16.8359 15.4217L13.4786 12.0643L16.8359 8.70685Z" fill="currentColor" />
    </svg>
  </div>
)

export const ActionButton = ({ bordered, roundedFull, className, isDisabled, onPress, onClick, children }: {
  bordered?: boolean; roundedFull?: boolean; className?: string; isDisabled?: boolean
  onPress?: () => void; onClick?: () => void; children: React.ReactNode
}) => (
  <Button
    color="primary"
    variant={bordered ? 'bordered' : 'solid'}
    className={clsx('font-bold', !bordered && 'text-main dark:text-gray', roundedFull && 'rounded-full', className)}
    isDisabled={isDisabled}
    onPress={onPress || onClick}
  >{children}</Button>
)

export const AwardDisplay = ({ type, num, scale: s = 0.75 }: { type?: string; num?: number | string; scale?: number }) => {
  return (
    <div className="flex items-center">
      {type === 'k3c' ? (
        <SpriteIcon pos="ticket" className="size-3 mr-1" scale={s} />
      ) : type === 'spin' ? (
        <VipSpriteIcon pos="spinIcon" className="size-3 mr-1" scale={0.5} />
      ) : (
        <SpriteIcon pos="goldCoin" className="size-3 mr-1" scale={s} />
      )}
      <div className="text-xs text-primary font-bold din">
        {num ? (type === 'chip' ? CURRENCY_SYMBOL + num : '*' + num) : '-'}
      </div>
    </div>
  )
}

export const NotificationDot = ({ ping, wapperClassName, className }: { ping?: boolean; wapperClassName?: string; className?: string }) => {
  const dot = <div className={clsx('size-2.5 border border-white bg-danger rounded-full', className)} />
  if (!ping) return dot
  return (
    <div className={clsx('relative', wapperClassName)}>
      <div className={clsx('size-2.5 border border-white bg-danger rounded-full animate-ping absolute left-0 top-0', className)} />
      {dot}
    </div>
  )
}

export const Section = ({ title, desc, id, children, ruleRender, ruleTitle, rightNode }: {
  title: string; desc?: string; id?: string; children: React.ReactNode
  ruleRender?: React.ReactNode; ruleTitle?: string; rightNode?: React.ReactNode
}) => {
  const { t } = useTranslation()
  const [rulesOpen, setRulesOpen] = useState(false)
  return (
    <div id={id} className="brand-card-wash p-3 bg-white dark:bg-gray rounded-lg relative">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <p className="font-black text-main uppercase leading-5">{title}</p>
          <div className="text-10 text-sec mt-1 mb-3">{desc}</div>
        </div>
        {ruleRender ? (
          <div>
            <div className="flex items-center" onClick={() => setRulesOpen(true)}>
              <QuestionIcon className="text-main" />
            </div>
          </div>
        ) : null}
        {rightNode}
      </div>
      {children}

      {ruleRender && (
        <Modal
          isOpen={rulesOpen}
          onOpenChange={(v) => { if (!v) setRulesOpen(false) }}
          hideCloseButton
          radius="none"
          placement="center"
          classNames={{ backdrop: 'z-60', wrapper: 'z-60' }}
        >
          <ModalContent className="flex flex-col mx-2 p-5 rounded-2xl max-h-[80vh] capitalize">
            <div className="w-full flex items-center justify-between font-bold text-main mb-3">
              <span>{ruleTitle || title + ' ' + t('common.label.games.rules')}</span>
              <CloseIcon onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRulesOpen(false) }} />
            </div>
            <ScrollShadow className="flex-1 overflow-y-auto text-sm text-sec">
              {ruleRender}
            </ScrollShadow>
          </ModalContent>
        </Modal>
      )}
    </div>
  )
}

export const TaskRow = ({ title, desc, bordered, status, awardType, awardNum, onPress, btnText, dataAct, t }: {
  title: string; desc?: string; bordered?: boolean; status?: number; awardType?: string
  awardNum?: number; onPress?: () => void; btnText?: string; dataAct?: string; t: (key: string) => string
}) => {
  const buttonText = btnText || (status === 3 ? 'common.label.claimed' : status === 2 ? 'common.label.claim' : 'common.label.playNow')
  const isBordered = typeof bordered === 'boolean' ? bordered : !(status === 3 || status === 2)
  return (
    <div className="flex items-center h-9" data-act={dataAct}>
      <div className="flex-1">
        <div className="text-main text-xs font-bold flex items-center">
          <p className="mr-2">{t(title)}</p>
          {awardType && awardNum ? <AwardDisplay type={awardType} num={awardNum} /> : null}
        </div>
        {desc && <p className="text-10 text-sec">{desc}</p>}
      </div>
      <ActionButton
        bordered={isBordered}
        roundedFull
        isDisabled={status === 3 || status === 10}
        className="h-7 text-10! px-0 min-w-17"
        onPress={onPress}
      >{t(buttonText)}</ActionButton>
    </div>
  )
}

export type ClaimHandler = (actID: number, actKey: string, timeKey: string) => void
