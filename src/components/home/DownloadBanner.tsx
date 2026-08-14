import { useState, useEffect } from 'react'
import { Button, Image } from '@nextui-org/react'
import { useAppConfigStore } from '../../stores/configStore'

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={'size-6 text-sec ' + (className || '')} fill="none" viewBox="0 0 24 24">
    <path d="M16.8002 7.2002L7.2002 16.8002" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.2002 7.2002L16.8002 16.8002" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const triggerDownload = () => {
  window.dispatchEvent(new CustomEvent('triggerDownload'))
}

export const DownloadBanner = () => {
  const [show, setShow] = useState(false)
  const appName = useAppConfigStore((s) => s.appName) || 'Kerala Lucky Draw'
  const marqueeText = useAppConfigStore((s) => s.marqueeText)

  useEffect(() => {
    setShow(localStorage.getItem('showDownload') === 'true')
  }, [])

  if (!show) return null

  return (
    <div className="brand-strip flex items-center p-2 py-1">
      <div className="flex flex-1 shrink-1 overflow-hidden items-center">
        <Image className="rounded-lg size-10 object-contain" src="/images/logos/icon-192.png" alt="app_logo" />
        <div className="ml-2 rtl:ml-0 rtl:mr-2">
          <h4 className="text-white font-bold text-sm leading-4">{appName}</h4>
          <p className="text-white/70 text-xs leading-4 opacity-[.8] text-ellipsis truncate">
            {marqueeText}
          </p>
        </div>
      </div>
      <Button
        className="rounded-3xl text-10! font-bold shrink-0 h-7 px-3 mr-2 rtl:mr-0 rtl:ml-2 bg-linear-primary-tb shadow-btn-primary text-black rounded-full"
        onPress={triggerDownload}
      >
        DOWNLOAD
      </Button>
      <div className="shrink-0 w-4.5" onClick={() => setShow(false)}>
        <CloseIcon className="size-4.5! text-white/70!" />
      </div>
    </div>
  )
}
