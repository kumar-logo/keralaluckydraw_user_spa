import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image, Modal, ModalContent } from '@nextui-org/react'
import { motion, useAnimationControls } from 'framer-motion'
import clsx from 'clsx'
import { getMysteryBoxGameList, drawMysteryBox, MysteryBox, MysteryBoxGroup, MysteryBoxItem, MysteryBoxDrawResult } from '../services/mysteryBoxApi'
import { useUIStore } from '../stores/uiStore'
import { formatCurrency } from '../utils/format'
import { withLoading, checkAuth, resolveAssetUrl } from '../utils/helpers'
import { toast } from '../utils/toast'
import { checkInsufficientBalance } from '../utils/balanceCheck'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { useGoBack } from '../hooks/useGoBack'
import { useAudio } from '../hooks/useAudio'
import { TopBar } from '../components/shared/TopBar'
import { Banner } from '../components/shared/Banner'
import { Spin } from '../components/shared/Spin'
import { GameImage } from '../components/shared/GameImage'

const groupBoxesByPrice = (list: MysteryBox[]): MysteryBoxGroup[] =>
  list.reduce<MysteryBoxGroup[]>((groups, box) => {
    let existingGroup = groups.find((group) => group.price === box.price)
    if (!existingGroup) {
      existingGroup = { ...box, topPrize: box.items?.[0]?.prize || 0, totalFreeCount: 0, items: [] }
      groups.push(existingGroup)
    }
    existingGroup.totalFreeCount += box.freeCount
    existingGroup.items.push(box)
    return groups
  }, [])

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={clsx('size-3', className)} viewBox="0 0 12 12" fill="none">
    <path d="M2.77778 5L5.88889 8.11111L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloseIcon = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
  <svg className={clsx('size-5 cursor-pointer', className)} viewBox="0 0 20 20" fill="currentColor" onClick={onClick}>
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
)

const PrizeItemDisplay = ({ detailItem: prizeItem, showModal, afterClose }: { detailItem?: MysteryBoxItem; showModal?: boolean; afterClose?: () => void }) => {
  const { t } = useTranslation()
  const [showDetail, setShowDetail] = useState(false)

  if (!prizeItem) return null

  return (
    <>
      <div
        className="size-full flex flex-col items-center"
        onClick={() => { if (showModal && prizeItem) setShowDetail(true) }}
      >
        <div className="h-22 w-full relative">
          <GameImage
            src={prizeItem.icon}
            alt={prizeItem.name}
            imgId={prizeItem.imgID}
            variant="original128"
            removeWrapper
            className="h-full"
          />
          <div
            className="w-17.5 h-10 absolute -right-1 bottom-0 bg-cover bg-no-repeat z-10 text-8 flex items-center justify-center text-[#FAD33F]"
            style={{ backgroundImage: 'url(/images/mystery-box/bonus-bg.png)' }}
          >
            {formatCurrency(prizeItem.prize ?? 0)}
          </div>
        </div>
        <div
          className="w-22 h-11 bg-cover bg-no-repeat flex items-center justify-center flex-wrap text-center text-xs leading-3 text-black"
          style={{ backgroundImage: 'url(/images/mystery-box/prize-name-bg.png)' }}
        >
          {prizeItem.name || '??'}
        </div>
      </div>

      <Modal isOpen={showDetail} onOpenChange={() => setShowDetail(false)} hideCloseButton classNames={{ base: 'rounded-sm' }} placement="center">
        <ModalContent className="mx-4">
          <div
            className="h-10 bg-linear-to-b text-lg text-main relative font-bold text-center leading-10 from-[#9E2526] to-[#7A1F2E]"
            style={{ boxShadow: '0px 2px 0px 0px rgba(45,0,0,0.11)' }}
          >
            {t('common.label.Details')}
            <CloseIcon className="absolute top-2 right-2 text-main" onClick={() => { setShowDetail(false); afterClose?.() }} />
          </div>
          <div className="flex flex-col items-center pt-4 pb-3">
            <div
              className="bg-[url(/images/mystery-box/prize-img-bg-small.png)] size-28 rounded-sm"
              children={
                <Image alt={prizeItem.name} src={resolveAssetUrl(prizeItem.icon)} classNames={{ wrapper: 'size-full rounded-sm', img: 'size-full' }} />
              }
            />
            <p className="text-xs mt-2 mb-3">{prizeItem.name || '??'}</p>
            <p className="text-base text-bg-sec">
              <span className="text-main">{t('common.label.price')} : </span>
              {prizeItem.prize ? formatCurrency(prizeItem.prize, 0) : '??'}
            </p>
            <Button
              className="mt-4 h-11 w-32 bg-linear-to-b from-[#9E2526] to-[#7A1F2E] rounded-sm text-main font-bold"
              onPress={() => { setShowDetail(false); afterClose?.() }}
            >
              {t('mysteryBox.label.tryUrLuck') || t('common.label.close')}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

const sumNumericRates = (items?: MysteryBoxItem[]): number =>
  (items || []).reduce((sum, item) => {
    const rate = Number(item?.rate)
    return Number.isFinite(rate) && rate > 0 ? sum + rate : sum
  }, 0)

const formatItemProbability = (rate: number | undefined, rateSum: number): string => {
  const numericRate = Number(rate)
  if (!Number.isFinite(numericRate) || numericRate <= 0 || rateSum <= 0) return '??'
  return (Math.round((numericRate / rateSum) * 1000) / 10) + '%'
}

const PrizeGridItem = ({ big, detailItem: prizeItem, last, rateSum }: { big?: boolean; detailItem?: MysteryBoxItem; last?: boolean; rateSum: number }) => {
  const { t } = useTranslation()
  const [showDetail, setShowDetail] = useState(false)

  return (
    <>
      <div
        className={
          'mt-4 border border-acc dark:border-gray rounded-sm flex flex-col items-center relative ' +
          (big ? 'h-56 col-span-2 row-span-2' : 'h-[6.25rem]')
        }
        onClick={() => { if (prizeItem) setShowDetail(true) }}
      >
        <div className="w-full absolute -top-4 flex justify-center">
          <div
            className={
              'bg-no-repeat bg-[url(/images/mystery-box/prize-bg.png)] font-bold flex justify-center items-center text-[#FFE873] ' +
              (big ? 'h-8 w-20 text-xs' : 'h-6 w-16 text-9')
            }
            style={{ backgroundSize: '100% 100%' }}
          >
            {formatCurrency(prizeItem?.prize ?? 0, 0)}
          </div>
        </div>
        <div
          className={
            'flex-1 w-full pt-1 px-1 ' +
            (big ? 'bg-[url(/images/mystery-box/prize-img-bg-big.png)]' : 'bg-[url(/images/mystery-box/prize-img-bg-small.png)]')
          }
          style={{ backgroundSize: '100% 100%' }}
        >
          <GameImage
            alt={prizeItem?.name}
            src={prizeItem?.icon}
            imgId={prizeItem?.imgID}
            variant={big ? 'original256' : 'original128'}
            removeWrapper
            className="size-full rounded-sm"
          />
        </div>
        <div className="leading-7 text-11 text-black">
          {last ? t('mysteryBox.label.guaranteed') : formatItemProbability(prizeItem?.rate, rateSum)}
        </div>
      </div>

      <Modal isOpen={showDetail} onOpenChange={() => setShowDetail(false)} hideCloseButton classNames={{ base: 'rounded-sm' }} placement="center">
        <ModalContent className="mx-4">
          <div
            className="h-10 bg-linear-to-b text-lg text-main relative font-bold text-center leading-10 from-[#9E2526] to-[#7A1F2E]"
            style={{ boxShadow: '0px 2px 0px 0px rgba(45,0,0,0.11)' }}
          >
            {t('common.label.Details')}
            <CloseIcon className="absolute top-2 right-2 text-main" onClick={() => setShowDetail(false)} />
          </div>
          <div className="flex flex-col items-center pt-4 pb-3">
            <div className="bg-[url(/images/mystery-box/prize-img-bg-small.png)] size-28 rounded-sm">
              <Image alt={prizeItem?.name} src={resolveAssetUrl(prizeItem?.icon)} classNames={{ wrapper: 'size-full rounded-sm', img: 'size-full' }} />
            </div>
            <p className="text-xs mt-2 mb-3">{prizeItem?.name || '??'}</p>
            <p className="text-base text-bg-sec">
              <span className="text-main">{t('common.label.price')} : </span>
              {prizeItem?.prize ? formatCurrency(prizeItem.prize, 0) : '??'}
            </p>
            <Button
              className="mt-4 h-11 w-32 bg-linear-to-b from-[#9E2526] to-[#7A1F2E] rounded-sm text-main font-bold"
              onPress={() => setShowDetail(false)}
            >
              {t('common.label.close')}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

const ScrollRoulette = ({ targetIndex, prizes, afterStop }: { targetIndex: number; prizes: MysteryBoxItem[]; afterStop: () => void }) => {
  const controls = useAnimationControls()
  const scale = useUIStore((s) => s.scale)
  const itemW = 106 * scale
  const viewW = itemW * 3
  const loopW = itemW * 9
  const [ready, setReady] = useState(false)
  const [stopping, setStopping] = useState(false)
  const scrollAudio = useAudio('/audio/scroll.mp3')
  const carouselIndices = Array.from({ length: 9 }, (_, i) => i)

  useEffect(() => {
    requestAnimationFrame(async () => {
      setTimeout(() => { scrollAudio.play() }, 1500)
      await controls.start({ x: [0, -loopW], transition: { duration: 2, ease: (f: number) => f ** 5 } })
      setTimeout(() => setReady(true), 1500)
      await controls.start({ x: [0, -loopW], transition: { duration: 1, ease: 'linear', repeat: Infinity } })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (targetIndex < 0 || !ready) return
    requestAnimationFrame(async () => {
      setStopping(true)
      await controls.start({
        x: [0, -itemW * (targetIndex ? targetIndex - 1 : 8) - itemW * 9],
        transition: { duration: 2, ease: 'easeOut' },
      })
      afterStop()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIndex, ready])

  return (
    <div className="h-28" style={{ width: viewW, overflow: 'hidden', position: 'relative' }}>
      <motion.div
        animate={controls}
        initial={{ x: 0 }}
        style={{ display: 'flex', width: loopW * 3, position: 'absolute' }}
        onUpdate={({ x }: { x: number | string }) => {
          if (!stopping && Number(x) <= -loopW) controls.set({ x: 0 })
        }}
      >
        {carouselIndices.concat(carouselIndices).concat(carouselIndices).map((prizeIndex, slotIndex) => (
          <div key={slotIndex} className="h-full pr-1.5 flex" style={{ width: itemW }}>
            <div
              className="flex-1 bg-[url(/images/mystery-box/prize-img-bg-small.png)]"
              style={{ backgroundSize: '100%, 100%' }}
            >
              <Image
                alt={prizes[prizeIndex]?.name}
                src={resolveAssetUrl(prizes[prizeIndex]?.icon)}
                classNames={{ wrapper: 'size-full rounded-sm', img: 'size-full' }}
              />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

interface WinPrizeGroup {
  sum: number
  itemId?: number
  item?: MysteryBoxItem
}

const useWinPrizesModal = (afterCollect: () => void) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose, onOpenChange } = useModalState()
  const winAudio = useAudio('/audio/win.mp3')
  const [totalPrize, setTotalPrize] = useState(0)
  const [scale, setScale] = useState(0)
  const [items, setItems] = useState<WinPrizeGroup[]>([])

  const show = (prizes: MysteryBoxItem[], results: MysteryBoxDrawResult[]) => {
    setScale(0)
    const grouped: WinPrizeGroup[] = []
    let total = 0
    results.forEach((r) => {
      const item = prizes.find((p) => String(p.itemID) === String(r.winItem))
      total += Number(r.winAmount ?? item?.prize ?? 0)
      const existing = grouped.find((g) => g.itemId === item?.itemID)
      if (existing) existing.sum += 1
      else grouped.push({ sum: 1, itemId: item?.itemID, item })
    })
    setTotalPrize(total)
    setItems(grouped)
    setTimeout(() => setScale(1), 200)
    onOpen()
  }

  useEffect(() => {
    if (isOpen) winAudio.play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const render = (
    <Modal
      placement="center"
      backdrop="opaque"
      classNames={{ base: 'm-0 bg-transparent shadow-none', wrapper: 'fixed z-60', backdrop: 'z-55' }}
      radius="none"
      hideCloseButton
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
    >
      <ModalContent className="flex flex-col items-center">
        <div
          style={{ transform: `scale(${scale})`, backgroundSize: '100% 100%' }}
          className="flex flex-wrap content-center justify-center items-center size-80! bg-[url(/images/mystery-box/win-prizes-bg.png)] bg-no-repeat"
        >
          {items.map((g) => (
            <div key={g.itemId} className={items.length > 4 ? 'size-1/3 p-0.5' : 'size-1/3 mr-1 mb-1'}>
              <div className="size-full relative rounded-sm p-3 bg-[url(/images/mystery-box/prize-img-bg-small.png)] bg-cover bg-no-repeat">
                <span className="absolute left-0 top-0 bg-linear-to-br from-[rgb(236,94,54)] to-[rgb(238,120,59)] h-5 leading-5 text-center text-main text-xs w-9 rounded-br-lg">
                  x{g.sum}
                </span>
                <Image src={resolveAssetUrl(g.item?.icon)} alt={g.item?.name} classNames={{ wrapper: 'size-full rounded-none', img: 'size-full' }} />
              </div>
            </div>
          ))}
        </div>
        <Button
          className="brand-cta h-10 mt-0 w-36 rounded-sm"
          onPress={() => { onClose(); fetchAndSyncBalance(); afterCollect() }}
        >
          {t('common.label.collect')} <span className="text-[#FFFE24]">{formatCurrency(totalPrize, 0)}</span>
        </Button>
      </ModalContent>
    </Modal>
  )

  return { render, show }
}

function useModalState() {
  const [isOpen, setIsOpen] = useState(false)
  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onOpenChange: (open: boolean) => { if (!open) setIsOpen(false) },
  }
}

const DrawButton = ({ currentBox, count, getList, afterCollect }: { currentBox?: MysteryBox; count: number; getList: () => void; afterCollect: () => void }) => {
  const { t } = useTranslation()
  const [drawing, setDrawing] = useState(false)
  const [targetIdx, setTargetIdx] = useState(-1)
  const { isOpen, onOpen, onClose, onOpenChange } = useModalState()
  const [results, setResults] = useState<MysteryBoxDrawResult[]>([])
  const { show: showWin, render: winRender } = useWinPrizesModal(afterCollect)

  return (
    <>
      <Button
        isLoading={drawing}
        onPress={() => {
          if (!currentBox?.items?.length) return
          if (currentBox.freeCount < count && checkInsufficientBalance((count - currentBox.freeCount) * currentBox.price, 'mystery_box')) return
          if (!checkAuth()) return
          onOpen()
          withLoading(setDrawing,
            drawMysteryBox(currentBox.gameID, count)
              .then((g) => {
                const idx = currentBox.items.findIndex((j) => String(j.itemID) === String(g[0]?.winItem))
                setTargetIdx(idx >= 0 ? idx : 0)
                setResults(g)
                getList()
              })
              .catch((g: { data?: { msg?: string } }) => {
                setTargetIdx(-1)
                toast.warning(g?.data?.msg ?? '')
                onClose()
              }),
          )
        }}
        className="h-11 w-full bg-linear-to-b rounded-sm from-[#FDAB1C] to-[#F77A00] text-lg flex items-center justify-center text-main gap-0"
        style={{ boxShadow: 'rgba(94,47,0,0.6) 0px 2px 0px 0px' }}
      >
        {t('common.label.open')}
        {(currentBox?.freeCount ?? 0) > 0 && (
          <span className="text-sm ml-1">(Free Count: {currentBox?.freeCount})</span>
        )}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton
        isDismissable={false}
        classNames={{ base: 'rounded-sm' }}
        placement="center"
      >
        <ModalContent className="mx-4 bg-transparent bg-[url(/images/mystery-box/crown-box-bg.png)] h-41.5 w-84 bg-contain bg-no-repeat pt-11.5 px-3 max-w-sw">
          <div className="h-full w-78 overflow-hidden">
            {currentBox?.items && isOpen && (
              <ScrollRoulette
                targetIndex={targetIdx}
                prizes={currentBox.items}
                afterStop={() => {
                  onClose()
                  showWin(currentBox.items, results)
                }}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
      {winRender}
    </>
  )
}

const BottomPanel = ({ currentBox, version, getList, afterCollect }: { currentBox?: MysteryBox; version: number; getList: () => void; afterCollect: () => void }) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose, onOpenChange } = useModalState()
  const [count, setCount] = useState(1)

  const [totalPrice, discountPrice] = useMemo(() => {
    if (!currentBox) return [0, null]
    const extra = count < currentBox.freeCount ? 0 : count - currentBox.freeCount
    return [currentBox.price * count, currentBox.freeCount > 0 ? currentBox.price * extra : null]
  }, [count, currentBox])

  const rateSum = useMemo(() => sumNumericRates(currentBox?.items), [currentBox])

  const openPanel = () => { setCount(1); onOpen() }

  useEffect(() => {
    if (version) openPanel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  return (
    <>
      <div
        className="px-4 pt-2.5 bg-linear-to-b from-[#FAAA9B] to-[#FFE4DF]"
        onClick={openPanel}
        style={{ paddingBottom: 'calc(var(--nav-bar-height) + 1rem)' }}
      >

        <div
          className="h-35 rounded-sm border border-[#FCF9F2] bg-[#F6C39B] mb-2.5 flex p-1"
          style={{ boxShadow: 'rgba(255, 255, 255, 0.6) 0px -2px 4px 0px inset' }}
        >
          {[1, 0, 2].map((idx) => (
            <div key={idx} className="flex-1">
              <PrizeItemDisplay detailItem={currentBox?.items?.[idx]} />
            </div>
          ))}
        </div>

        <div className="flex" onClick={(e) => e.stopPropagation()}>
          <Button
            onPress={openPanel}
            className="mx-1.5 h-11 flex-1 bg-linear-to-b rounded-sm from-[#FDAB1C] to-[#F77A00] text-lg flex items-center justify-center text-white"
            style={{ boxShadow: 'rgba(94,47,0,0.6) 0px 2px 0px 0px' }}
          >
            {t('mysteryBox.label.openBox')}
          </Button>
        </div>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton classNames={{ base: 'rounded-sm' }} placement="bottom">
        <ModalContent className="bg-transparent items-center relative overflow-visible max-w-sw">

          <div className="w-full absolute -top-5 flex justify-center">
            <div
              onClick={onClose}
              className="h-5 w-20 bg-linear-to-b rounded-t flex justify-center items-center from-[#9E2526] to-[#7A1F2E]"
              style={{ boxShadow: '0px 2px 0px 0px rgba(45,0,0,0.11)' }}
            >
              <div className="-rotate-90 size-3">
                <ChevronIcon className="size-3! text-white!" />
              </div>
            </div>
          </div>

          <div className="bg-white w-full flex flex-col rounded-sm max-h-[95dvh]">

            <div className="grid grid-cols-4 gap-2 p-4 flex-1 overflow-y-auto">
              <PrizeGridItem detailItem={currentBox?.items?.[1]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[0]} rateSum={rateSum} big />
              <PrizeGridItem detailItem={currentBox?.items?.[2]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[3]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[4]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[5]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[6]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[7]} rateSum={rateSum} />
              <PrizeGridItem detailItem={currentBox?.items?.[8]} rateSum={rateSum} last />
            </div>

            <div className="p-4 border-t border-light-gray">
              <div className="flex justify-between items-center text-main/60 dark:text-gray/60">
                <span className="text-sm">{t('common.label.amount')}</span>
                <span className="text-sm">
                  {formatCurrency((currentBox?.price || 0) * count, 0)}={' '}
                  <span className="text-black relative">
                    <span className={discountPrice !== null ? 'line-through decoration-[1.25px]' : ''}>
                      {formatCurrency(totalPrice, 0)}
                    </span>
                    {discountPrice !== null && (
                      <span className="absolute -top-4 right-0">{formatCurrency(discountPrice, 0)}</span>
                    )}
                  </span>
                </span>
              </div>

              <div className="mt-4 mb-6 grid grid-cols-5 gap-1">
                {[
                  { label: 'Reset', value: 0 },
                  { label: '+1', value: 1 },
                  { label: '+5', value: 5 },
                  { label: '+10', value: 10 },
                  { label: 'Max', value: 99 },
                ].map((btn) => (
                  <Button
                    key={btn.label}
                    className="border border-main text-sec dark:border-gray/60 dark:text-gray rounded-sm h-9"
                    onPress={() => {
                      if (btn.value > 0 && btn.value < 99) {
                        const next = count + btn.value
                        if (next > 99) {
                          toast.show({ icon: 'warning', message: t('common.tip.warn.maxAmount', { num: 99 * (currentBox?.price || 0) }) })
                          return
                        }
                        setCount(next)
                      } else {
                        setCount(btn.value || 1)
                      }
                    }}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>

              <DrawButton currentBox={currentBox} count={count} getList={getList} afterCollect={afterCollect} />
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

const BoxDisplay = ({ currentGroup, setCurrentGroup }: { currentGroup: number; setCurrentGroup: (g: number) => void }) => {
  const [listGroupByPrice, setListGroupByPrice] = useState<MysteryBoxGroup[]>([])

  useEffect(() => {
    getMysteryBoxGameList().then((data) => {
      setListGroupByPrice(groupBoxesByPrice(data || []))
    }).catch(() => {})
  }, [])

  const group = useMemo(() => listGroupByPrice[currentGroup], [currentGroup, listGroupByPrice])

  const navigate = (dir: number) => {
    if (!listGroupByPrice.length) return
    const next = currentGroup + dir
    if (next < 0) setCurrentGroup(listGroupByPrice.length - 1)
    else if (next >= listGroupByPrice.length) setCurrentGroup(0)
    else setCurrentGroup(next)
  }

  return (
    <div
      className="size-full bg-no-repeat flex items-center pb-10 px-2.5 relative"
      style={{
        backgroundImage: 'url(/images/mystery-box/box-base.png)',
        backgroundPositionY: 'calc(100% + 1.25rem)',
        backgroundSize: '100% auto',
      }}
    >

      <GameImage
        alt="left"
        removeWrapper
        className="h-[3.75rem] rtl:rotate-180"
        src="/images/mystery-box/left-shadow.png"
        onClick={() => navigate(-1)}
      />

      <div className="flex-1 flex justify-center">
        <motion.div
          animate={{ scale: [.975, 1.025] }}
          transition={{ duration: 1, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
        >
          <GameImage
            alt={(group?.price || '') + ''}
            src={group?.icon}
            imgId={group?.iconImgID}
            variant="original512"
            removeWrapper
            className="size-53"
          />
        </motion.div>
      </div>

      <GameImage
        alt="left"
        removeWrapper
        className="h-[3.75rem] rotate-180 rtl:rotate-0"
        src="/images/mystery-box/left-shadow.png"
        onClick={() => navigate(1)}
      />

      <div className="absolute bottom-2 left-1/2 w-24 -ml-12 text-center text-[#FFFEDF] text-base font-bold">
        {group?.totalFreeCount > 0 ? 'Free x ' + group.totalFreeCount : formatCurrency(group?.price, 0)}
      </div>
    </div>
  )
}

const CarouselHeader = ({ currentGroup, getList, afterCollect, listGroupByPrice, itemIndex, setItemIndex }: {
  currentGroup: number
  getList: () => void
  afterCollect: () => void
  listGroupByPrice: MysteryBoxGroup[]
  itemIndex: number
  setItemIndex: (i: number) => void
}) => {
  const [version] = useState(0)
  const group = useMemo(() => listGroupByPrice[currentGroup], [currentGroup, listGroupByPrice])

  const navigateItem = (dir: number) => {
    if (!group) return
    const next = itemIndex + dir
    if (next < 0) setItemIndex(group.items.length - 1)
    else if (next >= group.items.length) setItemIndex(0)
    else setItemIndex(next)
  }

  return (
    <>

      <div className="flex items-center h-11 bg-linear-to-r from-[#FC9E8F] via-[#EB543B] to-[#FC9E8F] rounded-t-[0.625rem] relative">
        <div className="flex-1 flex justify-end" onClick={() => navigateItem(-1)}>
          <ChevronIcon className="size-6.5! text-white!" />
        </div>
        <div className="w-52 text-center text-white text-xl text-nowrap">
          {group?.items?.[itemIndex]?.gameName}
        </div>
        <div className="rotate-180 flex-1 flex justify-end" onClick={() => navigateItem(1)}>
          <ChevronIcon className="size-6.5! text-white!" />
        </div>
      </div>

      <BottomPanel
        version={version}
        currentBox={group?.items?.[itemIndex]}
        getList={getList}
        afterCollect={afterCollect}
      />
    </>
  )
}

export const MysteryBoxPage = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [listGroupByPrice, setListGroupByPrice] = useState<MysteryBoxGroup[]>([])
  const [currentGroup, setCurrentGroup] = useState(0)
  const [itemIndex, setItemIndex] = useState(0)
  const goBack = useGoBack()

  const getList = () => {
    withLoading(setLoading,
      getMysteryBoxGameList().then((data) => {
        setListGroupByPrice(groupBoxesByPrice(data || []))
      }),
    )
  }

  useEffect(() => { getList() }, [])

  const setGroup = (g: number = 0) => {
    const params = new URLSearchParams()
    params.set('price', listGroupByPrice[g]?.price + '')
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    if (!listGroupByPrice.length) return
    const price = searchParams.get('price')
    if (!price) {
      setGroup()
      return
    }
    const idx = listGroupByPrice.findIndex((g) => g.price === parseInt(price))
    setCurrentGroup(idx >= 0 ? idx : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listGroupByPrice, searchParams])

  const { isOpen: leaveOpen, onOpen: showLeave, onClose: closeLeave, onOpenChange: leaveChange } = useModalState()

  return (
    <div className="flex flex-col size-full">
      <TopBar
        title={t('mysteryBox.label.title')}
        onBack={() => {
          if (listGroupByPrice.some((g) => g.totalFreeCount > 0)) showLeave()
          else goBack()
        }}
      />
      <Banner />

      <Spin
        loading={loading}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-no-repeat flex-col bg-white"
        style={{
          backgroundImage: 'url(/images/mystery-box/bg.png)',
          backgroundSize: '100% auto',
        }}
      >

        <div className="flex-1 min-h-80">
          <BoxDisplay currentGroup={currentGroup} setCurrentGroup={setGroup} />
        </div>

        <CarouselHeader
          currentGroup={currentGroup}
          getList={getList}
          afterCollect={() => {}}
          listGroupByPrice={listGroupByPrice}
          itemIndex={itemIndex}
          setItemIndex={setItemIndex}
        />
      </Spin>

      <Modal isOpen={leaveOpen} onOpenChange={leaveChange} hideCloseButton placement="center">
        <ModalContent className="mx-auto w-70 h-100.5 bg-transparent relative">
          <Image
            src="/images/mystery-box/lose-bonus-bg.webp"
            alt="lose-bonus"
            classNames={{ wrapper: 'size-full absolute left-0 top-0', img: 'size-full' }}
            radius="none"
          />
          <div className="bottom-0 left-0 absolute z-20 w-full flex flex-col justify-center">
            <p
              className="text-center px-3.5 text-base text-main dark:text-gray leading-5 mb-4"
              dangerouslySetInnerHTML={{
                __html: t('mysteryBox.desc.stillHasFree', {
                  num: listGroupByPrice.find((g) => g.totalFreeCount > 0)?.totalFreeCount || 0,
                }),
              }}
            />
            <Button
              className="h-10 rounded-full bg-linear-to-b from-[#FEAB66] to-[#E54433] w-58 mx-auto text-sm text-main"
              style={{ boxShadow: '0px 4px 12px 0px rgba(235, 55, 0, 0.50)' }}
              onPress={() => {
                const freeGroup = listGroupByPrice.find((j) => j.totalFreeCount > 0)
                setCurrentGroup(listGroupByPrice.findIndex((j) => j.price === freeGroup?.price))
                closeLeave()
              }}
            >
              {t('mysteryBox.label.ContinuePlay')}
            </Button>
            <div
              className="w-full px-4 my-2 mb-3 flex items-center justify-end"
              onClick={() => { closeLeave(); requestAnimationFrame(goBack) }}
            >
              <p
                className="text-sec-acc text-xs text-left mr-1"
                dangerouslySetInnerHTML={{ __html: t('mysteryBox.desc.stillLeave') }}
              />
              <div className="rotate-180">
                <ChevronIcon className="size-3! text-sec-acc!" />
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default MysteryBoxPage
