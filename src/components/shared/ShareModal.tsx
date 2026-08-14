import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent } from '@nextui-org/react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useAppConfigStore } from '../../stores/configStore'
import { resolveAssetUrl } from '../../utils/helpers'
import { copyToClipboard } from '../../utils/clipboard'
import { getSharePosterList } from '../../services/configApi'
import { CloseIcon } from './CloseIcon'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  url: string
  code?: string
  shareText?: string
}

enum ShareChannel {
  CopyLink = 'CopyLink',
  Whatsapp = 'Whatsapp',
  Facebook = 'Facebook',
  Telegram = 'Telegram',
}

const ICON_OFFSET: Record<string, number> = {
  DownLoad: 0,
  CopyLink: -3.125,
  Whatsapp: -6.25,
  Facebook: -9.375,
  Telegram: -12.5,
  SMS: -15.625,
  Email: -18.75,
  Ins: -21.875,
  x: -25,
}

const DEFAULT_AVATAR = '/images/common/default-avatar.webp'

const ChannelIcon = ({ type, size = 48 }: { type: string; size?: number }) => {
  const scale = size / 48
  return (
    <div
      style={{
        backgroundImage: 'url(/images/referral/icon-sprite-v2.webp)',
        backgroundSize: `${28 * scale}rem ${3 * scale}rem`,
        backgroundPosition: `left ${ICON_OFFSET[type] * scale}rem top 0rem`,
        height: `${size / 16}rem`,
        width: `${size / 16}rem`,
      }}
    />
  )
}

const QrCanvas = ({ value }: { value: string }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current && value) {
      QRCode.toCanvas(ref.current, value, { margin: 1, width: 42, errorCorrectionLevel: 'L' }).catch(() => {})
    }
  }, [value])
  return <canvas ref={ref} className="size-full" />
}

interface ChannelDef {
  type: ShareChannel
  i18nKey: string
  link?: string
}

const CHANNELS: ChannelDef[] = [
  { type: ShareChannel.CopyLink, i18nKey: 'referral.label.copyLink' },
  { type: ShareChannel.Whatsapp, i18nKey: 'referral.label.whatsapp', link: 'whatsapp://send?text=' },
  { type: ShareChannel.Facebook, i18nKey: 'referral.label.facebook' },
  { type: ShareChannel.Telegram, i18nKey: 'referral.label.telegram', link: 'tg://msg?text=' },
]

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

export const ShareModal = ({ open, onClose, url, code, shareText }: ShareModalProps) => {
  const { t } = useTranslation()
  const screenWidth = useUIStore((s) => s.screenWidth)
  const userInfo = useAuthStore((s) => s.userInfo)
  const appName = useAppConfigStore((s) => s.appName) || 'App'

  const nickName = userInfo?.nickName || ''
  const avatar = resolveAssetUrl(userInfo?.avatar) || DEFAULT_AVATAR
  const inviteCode = code || userInfo?.inviteCode || ''
  const message = shareText ? `${shareText}\n${url}` : url

  const carouselRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [customPosters, setCustomPosters] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    getSharePosterList()
      .then((res: any) => {
        const list = (Array.isArray(res) ? res : res?.data) || []
        setCustomPosters(
          list
            .map((p: { imageUrl?: string }) => resolveAssetUrl(p.imageUrl) || p.imageUrl || '')
            .filter(Boolean),
        )
      })
      .catch(() => {})
  }, [open])

  const cardCount = customPosters.length
  const posterStyle = (i: number): CSSProperties => ({
    backgroundImage: `url(${customPosters[i]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  })

  const onScroll = () => {
    const el = carouselRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const node = child as HTMLElement
      const childCenter = node.offsetLeft + node.offsetWidth / 2
      const dist = Math.abs(childCenter - center)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActive(best)
  }

  const dispatch = (channel: ChannelDef) => {
    if (channel.type === ShareChannel.CopyLink) {
      copyToClipboard(url)
      return
    }
    copyToClipboard(url)
    if (channel.link) {
      window.open(channel.link + encodeURIComponent(message), '_blank')
      return
    }
    if (channel.type === ShareChannel.Facebook) {
      const parts = message.split('http')
      window.open(`https://www.facebook.com/sharer/sharer.php?u=http${parts[1] || ''}`, '_blank')
    }
  }

  const downloadPoster = async (index: number) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 400
    const H = 600
    canvas.width = W
    canvas.height = H
    try {
      const poster = await loadImage(customPosters[index])
      ctx.drawImage(poster, 0, 0, W, H)
    } catch {
      return
    }

    const qr = QRCode.create(url, { errorCorrectionLevel: 'L' })
    const size = qr.modules.size
    const data = qr.modules.data
    const scale = 2
    const border = 1
    const fx = W / 2 - size - 8
    const fy = H / 2 - size - 8
    for (let row = -1; row < size + border; row++) {
      for (let col = -1; col < size + border; col++) {
        const on = row >= 0 && col >= 0 && row < size && col < size && data[row * size + col]
        ctx.fillStyle = on ? '#000' : '#fff'
        ctx.fillRect((fx + col + border) * scale, (fy + row + border) * scale, scale, scale)
      }
    }

    ctx.font = "700 20px 'Inter', sans-serif"
    ctx.fillStyle = '#fff'
    ctx.fillText(nickName, 76, 542)
    ctx.fillStyle = '#D9D9D9'
    ctx.fillText(t('referral.label.inviteCode'), 16, 584)
    ctx.font = "900 24px 'Inter', sans-serif"
    ctx.fillStyle = '#176be3'
    ctx.fillText(inviteCode, 135, 584)

    const cx = 40
    const cy = 532
    const r = 24
    try {
      const av = await loadImage(avatar).catch(() => loadImage(DEFAULT_AVATAR))
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(av, cx - r, cy - r, r * 2, r * 2)
      ctx.restore()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.stroke()
    } catch {
      /* avatar optional */
    }

    try {
      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${appName}_Share_${Date.now()}.png`
        link.click()
        URL.revokeObjectURL(link.href)
      })
    } catch {
      /* cross-origin avatar tainted the canvas — skip download */
    }
  }

  return (
    <Modal
      isOpen={open}
      backdrop="blur"
      placement="bottom"
      hideCloseButton
      classNames={{ base: 'z-65', wrapper: 'z-65', backdrop: 'z-65' }}
      onOpenChange={(v) => { if (!v) onClose() }}
      style={{ padding: 0 }}
    >
      <ModalContent
        className="m-0 rounded-b-none rounded-t-lg bg-[#791211] max-h-[80vh] overflow-y-hidden"
        style={{ maxWidth: screenWidth }}
      >
        <div className="flex items-center justify-between mb-3 px-3 pt-3">
          <p className="font-bold capitalize text-white">{t('common.label.inviteToEarn')}</p>
          <CloseIcon className="size-6 text-white" onClick={onClose} />
        </div>

        <div className="overflow-y-auto">
          <div className="relative flex flex-col p-3 pt-0">
            <div ref={carouselRef} onScroll={onScroll} className="overflow-x-auto flex px-19 py-2 snap-x">
              {Array.from({ length: cardCount }).map((_, i) => (
                <motion.div
                  key={i}
                  className="snap-center shrink-0"
                  animate={{ scale: active === i ? 1 : 0.8, marginInline: active === i ? 4 : -4 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                >
                  <div className="w-50 h-75 rounded-lg flex items-end" style={posterStyle(i)}>
                    <div className="w-full p-2 flex">
                      <div className="flex-col flex-1 overflow-hidden">
                        <div className="flex items-center">
                          <div
                            className="size-6 shrink-0 rounded-full border border-white bg-cover"
                            style={{ backgroundImage: `url(${avatar})` }}
                          />
                          <p className="text-white text-xs font-bold ml-2 overflow-hidden overflow-ellipsis">{nickName}</p>
                        </div>
                        <div className="flex items-center text-white text-10 mt-1">
                          {t('referral.label.inviteCode')}
                          <p className="text-primary text-xs font-black ml-1">{inviteCode}</p>
                        </div>
                      </div>
                      <div className="size-10.5 ml-3">
                        <QrCanvas value={url} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#791211] to-[#4E0100] px-3 h-8 rounded text-xs text-white mb-2 flex items-center">
              {t('referral.tip.share.share1')}
            </div>

            <div className="flex items-start justify-between">
              <div
                className="flex flex-col items-center flex-1 min-w-0 px-0.5 cursor-pointer active:scale-95 transition-transform"
                onClick={() => downloadPoster(active)}
              >
                <ChannelIcon type="DownLoad" size={48} />
                <p className="w-full text-10 text-white text-center mt-1 leading-tight">{t('common.label.download')}</p>
              </div>
              {CHANNELS.map((channel) => (
                <div
                  key={channel.type}
                  className="flex flex-col items-center flex-1 min-w-0 px-0.5 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => dispatch(channel)}
                >
                  <ChannelIcon type={channel.type} size={48} />
                  <p className="w-full text-10 text-white text-center mt-1 leading-tight">{t(channel.i18nKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
