import { useEffect, useState } from 'react'
import { Modal, ModalContent, Button } from '@nextui-org/react'
import { useAppConfigStore } from '../../stores/configStore'
import { compareVersions } from '../../utils/semver'

const SESSION_KEY_PREFIX = 'updateDialogDismissed:'

const resolveStoreTarget = (storeUrl: string, androidPackageName: string): string => {
  const url = storeUrl.trim()
  if (url.length > 0) return url
  const pkg = androidPackageName.trim()
  if (pkg.length > 0) return `https://play.google.com/store/apps/details?id=${pkg}`
  return ''
}

export const UpdateDialog = () => {
  const loaded = useAppConfigStore((s) => s.loaded)
  const appVersion = useAppConfigStore((s) => s.appVersion)
  const [isOpen, setIsOpen] = useState(false)

  const installed = __APP_VERSION__
  const latest = appVersion.version
  const min = appVersion.minSupportedVersion

  const belowLatest = latest.length > 0 && compareVersions(installed, latest) < 0
  const belowMin = min.length > 0 && compareVersions(installed, min) < 0
  const storeTarget = resolveStoreTarget(appVersion.storeUrl, appVersion.androidPackageName)

  const forced = (belowMin || (appVersion.forceUpdate && belowLatest)) && storeTarget.length > 0
  const optional = !forced && belowLatest

  useEffect(() => {
    if (!loaded) return
    if (forced) {
      setIsOpen(true)
      return
    }
    if (optional) {
      const dismissed = sessionStorage.getItem(SESSION_KEY_PREFIX + latest)
      setIsOpen(!dismissed)
      return
    }
    setIsOpen(false)
  }, [loaded, forced, optional, latest])

  const handleUpdate = () => {
    if (storeTarget.length > 0) window.open(storeTarget, '_blank')
  }

  const handleLater = () => {
    sessionStorage.setItem(SESSION_KEY_PREFIX + latest, '1')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <Modal
      backdrop="blur"
      placement="center"
      isDismissable={false}
      hideCloseButton
      isOpen={isOpen}
      style={{ width: '18rem', borderRadius: '0.875rem', overflow: 'hidden' }}
    >
      <ModalContent className="bg-light-gray">
        <div
          className="p-4 flex flex-col text-center"
          style={{ borderBottom: '1px solid var(--bg-color-gray)' }}
        >
          <span className="font-medium text-base text-main">
            {forced ? 'Update required' : 'Update available'}
          </span>
          <span className="text-xs mt-2 text-sec">
            {appVersion.updateMessage.length > 0
              ? appVersion.updateMessage
              : `A new version (${latest}) is available. Please update for the best experience.`}
          </span>
        </div>
        <div className="flex">
          {!forced && (
            <Button
              className="flex-1 rounded-none bg-transparent"
              style={{ borderRight: '1px solid var(--bg-color-gray)' }}
              onPress={handleLater}
            >
              Later
            </Button>
          )}
          <Button
            className="flex-1 rounded-none bg-transparent text-primary"
            onPress={handleUpdate}
          >
            Update
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
