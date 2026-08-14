import { useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Tabs, Tab, Skeleton, Modal, ModalContent, useDisclosure, RadioGroup, Radio, type RadioProps } from '@nextui-org/react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { createDiceOrder } from '../../services/diceApi'
import type { DiceGameInfoDto, DiceOdds } from '../../services/diceApi'
import { formatCurrency } from '../../utils/format'
import { toast } from '../../utils/toast'
import { checkInsufficientBalance } from '../../utils/balanceCheck'
import { fetchAndSyncBalance } from '../../utils/fetchBalance'
import { checkAuth } from '../../utils/helpers'
import { CountInput } from '../shared/CountInput'
import { DiceSingle } from './DiceVisuals'
import {
  buildSumOptions, buildSumPointOptions,
  buildSingleOptions, buildPairOptions, buildTripleOptions,
  renderBetIcon,
} from './diceBetOptions'
import type { DiceBetOption } from './diceConstants'

const AmountRadioItem = ({ children, ...props }: RadioProps) => (
  <Radio
    {...props}
    classNames={{
      base: 'flex-1 h-10 p-0 m-0 items-center justify-center rounded-sm max-w-full text-main font-bold bg-light-gray dark:bg-gray data-[selected=true]:bg-primary!',
      control: 'hidden',
      wrapper: 'hidden',
      labelWrapper: 'ml-0',
      label: 'text-sm text-sec group-data-[selected=true]:text-black',
    }}
  >
    {children}
  </Radio>
)

const MultRadioItem = ({ children, ...props }: RadioProps) => (
  <Radio
    {...props}
    classNames={{
      base: 'bg-selected border border-selected flex-1 h-8 p-0 m-0 items-center justify-center rounded-sm max-w-full font-bold data-[selected=true]:border-primary',
      control: 'hidden',
      wrapper: 'hidden',
      labelWrapper: 'ml-0',
      label: 'text-xs text-sec group-data-[selected=true]:text-primary',
    }}
  >
    {children}
  </Radio>
)

const PlusMinusBtn = ({ disabled, name = 'plus', onClick }: { disabled?: boolean; name?: string; onClick?: () => void }) => {
  const icons: Record<string, ReactNode> = {
    plus: (
      <svg xmlns="http://www.w3.org/2000/svg" width=".75rem" height=".75rem" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="5" width="10" height="2" rx="1" fill="var(--bg-icon-gray)" />
        <rect x="5" y="11" width="10" height="2" rx="1" transform="rotate(-90 5 11)" fill="var(--bg-icon-gray)" />
      </svg>
    ),
    minus: (
      <svg xmlns="http://www.w3.org/2000/svg" width=".75rem" height=".75rem" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="5" width="10" height="2" rx="1" fill="var(--bg-icon-gray)" />
      </svg>
    ),
  }
  return (
    <Button
      className={`px-0 min-w-0 gap-0 w-7 bg-selected! rounded-sm items-center justify-center ${disabled ? 'opacity-30' : ''}`}
      isDisabled={disabled}
      onPress={() => !disabled && onClick?.()}
    >
      {icons[name]}
    </Button>
  )
}

const PreSaleCheck = ({ checked, onCheck, label }: { checked: boolean; onCheck: (v: boolean) => void; label: ReactNode }) => (
  <div className="flex" onClick={() => onCheck(!checked)}>
    <div className={`common-pay-ratio w-4 h-4 rounded-2xl mr-3 flex items-center justify-center ${checked ? 'checked' : ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2" viewBox="0 0 10 8" fill="none">
        <rect x="1.91431" y="2.65332" width="4.94301" height="2" rx="1" transform="rotate(45 1.914 2.653)" fill="white" />
        <rect x="2.58301" y="6.14893" width="7.98862" height="2" rx="1" transform="rotate(-45 2.583 6.149)" fill="white" />
      </svg>
    </div>
    {label}
  </div>
)

function usePreSaleRules(onCloseCallback?: () => void) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const { t } = useTranslation()
  const handleClose = () => { onClose(); onCloseCallback?.() }
  return {
    render: (
      <Modal
        placement="center" backdrop="opaque"
        classNames={{ base: 'm-0 rounded-lg p-5 bg-white dark:bg-gray w-90 h-[70%]' }}
        radius="none" isOpen={isOpen} onOpenChange={onOpenChange} onClose={handleClose} hideCloseButton
      >
        <ModalContent>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center pb-3">
              <span className="text-base font-bold text-main">{t('pay.label.saleRules.title')}</span>
              <div className="pre-sale-close text-sec-acc" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.8359 8.70685C17.2265 8.31632 17.2265 7.68316 16.8359 7.29264C16.4454 6.90212 15.8122 6.90213 15.4217 7.29266L12.0644 10.65L8.70712 7.29266C8.3166 6.90213 7.68343 6.90212 7.2929 7.29264C6.90237 7.68316 6.90237 8.31632 7.29288 8.70685L10.6502 12.0643L7.29288 15.4217C6.90237 15.8122 6.90237 16.4454 7.2929 16.8359C7.68343 17.2264 8.3166 17.2264 8.70712 16.8359L12.0644 13.4785L15.4217 16.8359C15.8122 17.2264 16.4454 17.2264 16.8359 16.8359C17.2265 16.4454 17.2265 15.8122 16.8359 15.4217L13.4786 12.0643L16.8359 8.70685Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto text-sm text-sec *:mb-5">
              <p>{t('pay.label.saleRules.p1')}</p>
              <p>{t('pay.label.saleRules.p2')}</p>
              <p>{t('pay.label.saleRules.p3')}</p>
              <p>{t('pay.label.saleRules.p4')}</p>
              <p>{t('pay.label.saleRules.p5')}</p>
              <p>{t('pay.label.saleRules.p6')}</p>
            </div>
          </div>
        </ModalContent>
      </Modal>
    ),
    show: onOpen,
    hide: handleClose,
  }
}

const AMOUNT_OPTIONS = [
  { label: formatCurrency(10, 0), value: '10' },
  { label: formatCurrency(100, 0), value: '100' },
  { label: formatCurrency(500, 0), value: '500' },
  { label: formatCurrency(1000, 0), value: '1000' },
]

const MULT_OPTIONS = [
  { label: 'x1', value: '1' },
  { label: 'x3', value: '3' },
  { label: 'x9', value: '9' },
  { label: 'x27', value: '27' },
  { label: 'x81', value: '81' },
  { label: 'x243', value: '243' },
  { label: 'x729', value: '729' },
]

function useBetModal(onPaid: (code: string) => void, isBonus: boolean) {
  const [payRender, setPayRender] = useState<ReactNode>(null)
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('10')
  const [mult, setMult] = useState('1')
  const [agreed, setAgreed] = useState(true)
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const resetAgreed = () => setAgreed(true)
  const { show: showRules, hide: hideRules, render: rulesRender } = usePreSaleRules(resetAgreed)
  const total = useMemo(() => (+amount || 0) * (+mult || 0), [amount, mult])
  const roundNoRef = useRef<string | undefined>(undefined)
  const diceIDRef = useRef<number | undefined>(undefined)

  const show = (item: DiceBetOption, info: DiceGameInfoDto) => {
    setPayRender(item.payRender)
    setCode(item.code)
    setAmount('10')
    setMult('1')
    onOpen()
    roundNoRef.current = info.roundNo
    diceIDRef.current = info.diceID
  }

  const hide = () => { hideRules(); onClose() }

  const submit = () => {
    const roundNo = roundNoRef.current
    const diceID = diceIDRef.current
    if (!roundNo || !diceID || code === '' || amount === '' || mult === '') {
      toast.show({ icon: 'warning', message: t('pay.tip.require') })
      return
    }
    if (total < 10) {
      toast.show({ icon: 'warning', message: t('pay.tip.least', { money: 10 }) })
      return
    }
    if (!agreed) { showRules(); return }
    if (!checkAuth()) return
    if (checkInsufficientBalance(total, `k3_${diceID}_${code}${isBonus ? '_bonus' : ''}`, isBonus)) return

    createDiceOrder({
      diceID,
      roundNo,
      amount: total,
      betItem: code,
      multiples: 1,
    }).then(() => {
      toast.success(t('pay.tip.paysuccess'))
      fetchAndSyncBalance()
      onPaid(code)
      hide()
    })
  }

  const renderModal = (
    <Modal
      placement="bottom" backdrop="opaque"
      classNames={{ base: 'dice m-0 rounded-t-lg' }}
      radius="none" isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton
    >
      <ModalContent>
        <div className="flex justify-between pt-5 px-5 pb-3 items-center">
          <span className="font-bold text-sm">{t('common.label.bet')}</span>
          <div onClick={hide} className="size-6 text-sec-acc">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M16.8359 8.7071C17.2265 8.31657 17.2265 7.6834 16.8359 7.29288C16.4454 6.90237 15.8122 6.90237 15.4217 7.2929L12.0644 10.6503L8.70712 7.2929C8.3166 6.90237 7.68343 6.90237 7.2929 7.29288C6.90237 7.6834 6.90237 8.31657 7.29288 8.7071L10.6502 12.0645L7.29288 15.4219C6.90237 15.8125 6.90237 16.4456 7.2929 16.8361C7.68343 17.2267 8.3166 17.2267 8.70712 16.8361L12.0644 13.4787L15.4217 16.8361C15.8122 17.2267 16.4454 17.2267 16.8359 16.8361C17.2265 16.4456 17.2265 15.8125 16.8359 15.4219L13.4786 12.0645L16.8359 8.7071Z" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="flex justify-center items-center p-3">{payRender}</div>
        <div className="px-5 mt-3 mb-5">
          <RadioGroup
            orientation="horizontal"
            classNames={{ base: 'w-full', wrapper: 'justify-between w-full *:not-last:mr-2 gap-0' }}
            value={amount} onValueChange={setAmount}
          >
            {AMOUNT_OPTIONS.map(o => <AmountRadioItem key={o.value} value={o.value}>{o.label}</AmountRadioItem>)}
          </RadioGroup>

          <div className="bg-light-gray dark:bg-charcoal mt-3 p-3 flex flex-col rounded">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-sec font-bold">{t('pay.label.quantity')}</span>
              <div className="h-10 flex items-center">
                <PlusMinusBtn name="minus" onClick={() => setMult(v => +v - 1 + '')} disabled={+mult <= 1} />
                <CountInput className="w-29 mx-1" value={mult} onChange={setMult} />
                <PlusMinusBtn name="plus" onClick={() => setMult(v => +v + 1 + '')} disabled={+mult >= 99999} />
              </div>
            </div>
            <RadioGroup
              orientation="horizontal"
              classNames={{ base: 'w-full', wrapper: 'justify-between w-full *:not-last:mr-1 gap-0' }}
              value={mult} onValueChange={setMult}
            >
              {MULT_OPTIONS.map(o => <MultRadioItem key={o.value} value={o.value}>{o.label}</MultRadioItem>)}
            </RadioGroup>
          </div>

          <div className="mt-4">
            <PreSaleCheck
              checked={agreed}
              onCheck={setAgreed}
              label={
                <div className="flex items-center text-xs text-sec">
                  <div>{t('pay.label.agree')}</div>
                  <div
                    className="text-primary font-bold underline ml-2"
                    onClick={(e) => { showRules(); e.stopPropagation() }}
                  >
                    {t('pay.label.preSaleRule')}
                  </div>
                </div>
              }
            />
          </div>

          <Button
            className={`px-0 min-w-0 gap-0 h-12 rounded-full bg-linear-primary-tb shadow-btn-primary flex items-center justify-center text-sm font-bold text-black w-full mt-4 ${total ? '' : 'opacity-30'}`}
            isDisabled={!total}
            onPress={submit}
          >
            {`${t('pay.label.total')} ${formatCurrency(total, 0)}`}
          </Button>
          {rulesRender}
        </div>
      </ModalContent>
    </Modal>
  )

  return { renderModal, show, hide }
}

function useDiceRulesModal() {
  const [type, setType] = useState('same2')
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const { t } = useTranslation()
  const show = (tp: string) => { setType(tp); onOpen() }

  return {
    render: (
      <Modal
        placement="center" backdrop="opaque"
        classNames={{ base: 'm-0 w-auto bg-transparent shadow-none' }}
        radius="none" isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton
      >
        <ModalContent>
          <div className="flex flex-col gap-y-8 items-center">
            <div className="p-6 gap-y-3 flex flex-col bg-gray rounded-2xl items-center">
              {type === 'same2' && (
                <>
                  <div className="flex gap-x-2"><DiceSingle num={4} size={52} /><DiceSingle num={4} size={52} /></div>
                  <p className="dice-question-text text-sec text-sm">{t('k3.betting.same2-modal')}</p>
                </>
              )}
              {type === 'same3' && (
                <>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex items-center justify-center"><DiceSingle size={48} num={6} /></div>
                    <div className="flex gap-x-1"><DiceSingle size={48} num={6} /><DiceSingle size={48} num={6} /></div>
                  </div>
                  <p className="dice-question-text text-sec text-sm">{t('k3.betting.same3-modal')}</p>
                </>
              )}
              {type === 'any3' && (
                <>
                  <div className="flex flex-col gap-y-1">
                    <div className="flex items-center justify-center"><DiceSingle size={48} num={0} /></div>
                    <div className="flex gap-x-1"><DiceSingle size={48} num={0} /><DiceSingle size={48} num={0} /></div>
                  </div>
                  <p className="dice-question-text text-sec text-sm">{t('k3.betting.any3-modal')}</p>
                </>
              )}
              {type === 'different' && (
                <>
                  <div className="flex gap-x-2"><DiceSingle num={1} size={48} /><DiceSingle num={2} size={48} /><DiceSingle num={4} size={48} /></div>
                  <p className="dice-question-text text-sec text-sm">{t('k3.betting.different-modal')}</p>
                </>
              )}
            </div>
            <div className="game-close-icon" onClick={onClose} />
          </div>
        </ModalContent>
      </Modal>
    ),
    show,
    hide: onClose,
  }
}

export const DiceBettingPanel = ({ canBetting, onPaidSuccess, gameInfo, isBonus }: {
  canBetting: boolean
  onPaidSuccess: () => void
  gameInfo?: DiceGameInfoDto
  isBonus: boolean
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('total')
  const { render: diceRulesRender, show: showDiceRules } = useDiceRulesModal()
  const [recentBets, setRecentBets] = useState<string[]>([])
  const odds = useMemo<DiceOdds | undefined>(() => gameInfo?.odds, [gameInfo])
  const { renderModal: betModal, show: showBet, hide: hideBet } = useBetModal((code) => {
    setRecentBets(prev => [...prev, code])
    onPaidSuccess?.()
  }, isBonus)

  const renderBtn = useMemo(() => (item: DiceBetOption, highlight?: boolean) => (
    <Button
      key={item.code}
      className={clsx(
        'p-0! min-w-0 gap-0 flex flex-col h-auto h-max-auto py-2 rounded-lg',
        item.code.startsWith('sum') ? 'gap-y-1' : 'gap-y-2',
        !canBetting && 'grayscale',
        !highlight && 'bg-light-gray dark:bg-selected py-2!'
      )}
      isDisabled={!canBetting}
      onPress={() => openBet(item)}
    >
      {item.render}
      <Skeleton isLoaded={!!odds} className="w-full">
        <p className="text-xs text-sec">{item.rate}X</p>
      </Skeleton>
    </Button>
  ), [canBetting, odds])

  useEffect(() => {
    if (!canBetting) {
      toast.show({ icon: 'warning', message: t('common.tip.warn.betUnable', { time: gameInfo?.stopSec || 10 }) })
      hideBet()
    }
  }, [canBetting])

  useEffect(() => {
    if (gameInfo?.tickets) setRecentBets(gameInfo.tickets.map((k) => k.item))
    else setRecentBets([])
  }, [gameInfo])

  const openBet = (item: DiceBetOption) => { if (gameInfo) showBet({ ...item }, gameInfo) }

  const renderNl = useCallback(renderBetIcon, [])

  const renderHeader = useMemo(() => {
    const tips: Record<string, ReactNode> = {
      '2same': (
        <div className="text-sm flex">
          <span className="text-main mr-3 font-bold">Double</span>
          <div className="flex-1">{t('k3.betting.same2-tip', { odds: odds?.double_one || '' })}</div>
        </div>
      ),
      '3same': (
        <div className="text-sm flex">
          <span className="text-main mr-3 font-bold">Triple</span>
          <div className="flex-1">{t('k3.betting.same3-tip', { odds: odds?.leopard_one || '' })}</div>
        </div>
      ),
      different: (
        <div className="text-sm flex">
          <span className="text-main mr-3 font-bold">Single</span>
          <div className="flex-1">{t('k3.betting.different-tip', { odds: odds?.single_one || '' })}</div>
        </div>
      ),
      total: <></>,
    }
    const modalMap: Record<string, string> = { '2same': 'same2', '3same': 'same3', different: 'different' }
    return (key: string) => (
      <div className="flex items-center px-3 text-sm">
        {tips[key]}{' '}
        {key !== 'total' && (
          <Button
            onPress={() => showDiceRules(modalMap[key])}
            className="px-0 min-w-0 gap-0 w-5 h-5 ml-1.5 rounded-full bg-selected text-sm font-bold text-main"
          >
            ?
          </Button>
        )}
      </div>
    )
  }, [odds, t])

  const betOptions = useMemo(() => ({
    sum: buildSumOptions(odds),
    sumPoint: buildSumPointOptions(odds),
    single: buildSingleOptions(odds),
    pair: buildPairOptions(odds),
    triple: buildTripleOptions(odds),
  }), [odds])

  return (
    <div className="flex flex-col bg-[#AABBD3] dark:bg-light-gray relative">
      {!canBetting && <div className="absolute left-0 size-full bg-black/20 z-50" />}

      <Tabs
        aria-label="Options" color="primary"
        classNames={{
          base: 'w-fill flex flex-col justify-end sticky top-0 z-20 p-2 bg-[#AABBD3] dark:bg-light-gray',
          tabList: 'gap-x-1 w-full flex relative rounded-none p-0 border-divider items-end bg-transparent',
          tab: 'p-2 bg-gradient-to-b from-[#D8E0EA] to-[#EAF3FD] dark:bg-selected h-auto rounded-t rounded-b-none border-t border-white/30 data-[selected=true]:bg-primary! data-[selected=true]:from-transparent data-[selected=true]:to-transparent data-[selected=true]:border-primary!',
          cursor: 'hidden',
          tabContent: 'text-sm text-black/80 group-data-[selected=true]:text-black group-data-[selected=true]:font-bold',
          panel: 'flex flex-col px-2 py-0',
        }}
        selectedKey={activeTab}
        onSelectionChange={(k) => setActiveTab(k as string)}
      >

        <Tab key="total" title={t('common.label.total')}>
          <div className="pb-2 bg-white dark:bg-gray rounded-sm">
            <div className="rounded mx-2 flex justify-between py-2 px-4 mt-2 bg-selected mb-0.5 border border-black/20">
              {betOptions.sum.map(k => renderBtn(k, true))}
            </div>
            <div className="rounded mx-2 grid gap-y-2 py-2 grid-cols-6 mt-0.5 px-2 border flex-wrap border-black/20 bg-selected">
              {betOptions.sumPoint.map(k => renderBtn(k, true))}
              <div className="flex-1" />
              <div className="flex-1" />
            </div>
          </div>
        </Tab>

        <Tab key="3same" title={t('common.label.games.triple')}>
          <div className="py-2 bg-white dark:bg-gray rounded-sm">
            {renderHeader('3same')}
            <div className="grid mx-2 gap-2 grid-cols-3 mt-2 rounded-sm">
              {betOptions.triple.slice(1).map(k => renderBtn(k))}
            </div>
            <div className="m-2 flex items-center text-sm">
              {t('k3.betting.any3-tip', { odds: betOptions.triple[0].rate })}
              <Button
                onPress={() => showDiceRules('any3')}
                className="px-0 min-w-0 gap-0 w-5 h-5 ml-2.5 rounded-full bg-sec text-sm font-bold text-main"
              >
                ?
              </Button>
            </div>
            <div className="px-2 rounded-sm flex flex-col">
              {[betOptions.triple[0]].map(k => (
                <Button
                  key={k.code}
                  className={`flex items-center justify-center gap-x-2 h-auto h-max-auto py-3 bg-light-gray dark:bg-selected rounded-lg dice-select-item ${canBetting ? '' : 'grayscale'}`}
                  isDisabled={!canBetting}
                  onPress={() => openBet(k)}
                >
                  {k.renderRow}
                  <Skeleton isLoaded={!!odds} className="flex items-center">
                    <p className="text-xs text-sec">{k.rate}X</p>
                  </Skeleton>
                </Button>
              ))}
            </div>
          </div>
        </Tab>

        <Tab key="2same" title={t('common.label.games.double')}>
          <div className="py-2 bg-white dark:bg-gray rounded-sm">
            {renderHeader('2same')}
            <div className="grid px-2 gap-2 grid-cols-3 mt-2 rounded-sm">
              {betOptions.pair.map(k => renderBtn(k))}
            </div>
          </div>
        </Tab>

        <Tab key="different" title={t('common.label.games.single')}>
          <div className="py-2 bg-white dark:bg-gray rounded-sm">
            {renderHeader('different')}
            <div className="grid px-2 gap-2 grid-cols-3 mt-2 rounded-sm">
              {betOptions.single.map(k => renderBtn(k))}
            </div>
          </div>
        </Tab>
      </Tabs>

      <div className="p-2 pt-0 dark:pt-2 dark:bg-[#464E59] mt-2">
        <div className="rounded-lg relative">
          <div className="flex justify-between items-center mb-1">
            <div className="dice-select-parting-line" />
            <p className="din text-sm font-bold text-sec">MY BETS</p>
            <div className="dice-select-parting-line" />
          </div>
          <div
            className="flex overflow-x-auto w-full h-10 bg-[#4E6079] border border-black/20 rounded-sm items-center pl-3 pr-2"
            style={{ boxShadow: '0px 4px 16px 0px rgba(0, 0, 0, 0.20) inset' }}
          >
            {recentBets.map((code, i) => (
              <motion.div
                key={i}
                animate={{ scale: [0.9, 1.1, 1] }}
                transition={{ duration: 1 }}
                className="z-20 mr-1"
              >
                {renderNl(code)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {diceRulesRender}
      {betModal}
    </div>
  )
}
