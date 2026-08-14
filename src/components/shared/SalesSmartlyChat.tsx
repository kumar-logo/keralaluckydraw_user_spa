import { useEffect } from 'react'
import { useAppConfigStore } from '../../stores/configStore'
import { initSalesSmartly } from './salesSmartly'

export const SalesSmartlyChat = () => {
  const enabled = useAppConfigStore((s) => s.support.chatEnabled)
  const license = useAppConfigStore((s) => s.support.chatLicense)

  useEffect(() => {
    if (!enabled || !license) return
    initSalesSmartly(license, () => {})
  }, [enabled, license])

  return null
}
