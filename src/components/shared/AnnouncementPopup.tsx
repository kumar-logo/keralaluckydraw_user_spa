import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Modal, ModalContent, Checkbox } from '@nextui-org/react'
import { useTranslation } from 'react-i18next'
import { GameImage } from './GameImage'
import { formatDate } from '../../utils/date'
import { getHomePopList, type HomeBanner } from '../../services/hallApi'

type PopupItem = HomeBanner

let globalFetched = false

const handlePopupUrl = (url: string) => {
  if (!url) return
  if (url.startsWith('http')) window.open(url, '_blank')
  else if (url.startsWith('route:')) {
    window.dispatchEvent(new CustomEvent('gotourl', { detail: { url: url.substring(6), type: 'push' } }))
  } else if (url.startsWith('action:')) {
    const params = new URLSearchParams(url.substring(7))
    const type = params.get('type')
    if (type === 'recharge') window.dispatchEvent(new CustomEvent('openRechargeDraw'))
  } else {
    window.dispatchEvent(new CustomEvent('gotourl', { detail: { url, type: 'push' } }))
  }
}

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-8" viewBox="0 0 32 32" fill="none" {...props}>
    <path
      d="M28.8537 9.28934C30.5285 12.4973 30.9432 16.2157 30.0163 19.7138C29.0894 23.212 26.8879 26.2371 23.8444 28.1949C20.8008 30.1527 17.1351 30.9016 13.5675 30.2945C9.9999 29.6874 6.78826 27.7682 4.56355 24.9139C2.33883 22.0596 1.26186 18.4766 1.5442 14.8687C1.82654 11.2609 3.44779 7.88899 6.08944 5.41554C8.7311 2.94208 12.2022 1.54583 15.8208 1.50111C19.4394 1.45638 22.944 2.76641 25.6459 5.17383"
      stroke="white" strokeWidth={3} strokeLinecap="round"
    />
    <rect x={12.292} y={21.8926} width={3} height={13.3333} rx={1.5} transform="rotate(-135 12.292 21.8926)" fill="white" />
    <rect x={21.4844} y={19.7712} width={3} height={13.3333} rx={1.5} transform="rotate(135 21.4844 19.7712)" fill="white" />
  </svg>
)

const PopupImage = ({ item, onClose, goActive }: { item: PopupItem; onClose: () => void; goActive: (url: string) => void }) => (
  <div
    className="w-full rounded-lg px-0.5 flex justify-center"
    onClick={() => {
      onClose()
      requestAnimationFrame(() => goActive(item.skipUrl ?? ''))
    }}
  >
    <GameImage
      classNames={{ img: 'w-full rounded-lg', wrapper: 'rounded-lg object-cover bg-transparent!' }}
      src={item.img}
      alt="tip-image"
      imgId={item.imgId}
      variant="popup"
    />
  </div>
)

export const AnnouncementPopup = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [dontShow, setDontShow] = useState(false)
  const [current, setCurrent] = useState<PopupItem | undefined>(undefined)
  const allPopups = useRef<PopupItem[]>([])
  const queue = useRef<PopupItem[]>([])
  const dataFetched = useRef(false)
  const saveDontShow = () => {
    if (dontShow) {
      localStorage.setItem('popupDontShowToday', JSON.stringify({
        date: formatDate(Date.now(), 'yyyy-MM-dd'),
        list: allPopups.current,
      }))
    }
  }

  const openNextPopup = (save = true) => {
    if (location.pathname.startsWith('/index/home')) {
      if (queue.current.length > 0) {
        setCurrent(queue.current.shift())
        setIsOpen(true)
      }
    } else {
      if (save) saveDontShow()
      setTimeout(() => { openNextPopup(false) }, 1000)
    }
  }

  const fetchPopups = () => {
    if (globalFetched) return
    globalFetched = true
    getHomePopList().then((res) => {
      const list = (res ?? []) as unknown as PopupItem[]
      dataFetched.current = true
      allPopups.current = [...list]
      let filtered: PopupItem[] = list
      try {
        const stored = localStorage.getItem('popupDontShowToday')
        if (stored) {
          const parsed = JSON.parse(stored) as { date?: string; list?: PopupItem[] }
          if (formatDate(Date.now(), 'yyyy-MM-dd') === parsed.date) {
            filtered = filtered.filter((w) => !(parsed.list ?? []).some((d) => JSON.stringify(d) === JSON.stringify(w)))
          }
        }
      } catch (err) {
        console.warn('Failed to parse popupDontShowToday', err)
      }
      if (!filtered?.length) {
        window.dispatchEvent(new CustomEvent('popupAllColsed'))
        return
      }
      allPopups.current = filtered
      queue.current = [...filtered]
      openNextPopup()
    })
  }

  useEffect(() => {
    if (isOpen && !pathname.startsWith('/index/home')) {
      setIsOpen(false)
      openNextPopup()
    }
  }, [pathname])

  useEffect(() => {
    if (localStorage.getItem('dontshowpop')) {
      localStorage.removeItem('dontshowpop')
      return
    }
    fetchPopups()
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    if (queue.current.length > 0) {
      setTimeout(() => {
        openNextPopup()
      }, 200)
    } else {
      window.dispatchEvent(new CustomEvent('popupAllColsed'))
      saveDontShow()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      hideCloseButton
      classNames={{
        base: 'm-0 bg-transparent shadow-none rounded-none',
        wrapper: 'z-210',
        backdrop: 'z-210 bg-black/80',
      }}
      radius="none"
      placement="center"
    >
      <ModalContent className="flex flex-col items-center">
        {current && <PopupImage goActive={handlePopupUrl} item={current} onClose={handleClose} />}
        <Checkbox
          isSelected={dontShow}
          onValueChange={setDontShow}
          size="sm"
          className="mt-1"
          classNames={{
            wrapper: 'w-3! h-3! me-0! rounded-sm! before:rounded-sm! after:rounded-sm! before:border-white/60!',
            icon: 'text-black w-2! h-2! font-black stroke-2',
            label: '[font-size:0.75rem]! text-white/60!',
          }}
        >
          <span className="ml-1">{t('common.tip.info.dontShowTotay')}</span>
        </Checkbox>
        <div className="w-full flex justify-center mt-5 mr-2" onClick={handleClose}>
          <CloseIcon />
        </div>
      </ModalContent>
    </Modal>
  )
}
