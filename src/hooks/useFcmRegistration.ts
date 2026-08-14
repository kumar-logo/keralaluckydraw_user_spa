import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useAppConfigStore } from '../stores/configStore'
import { registerDevicePush } from '../services/fcm'

export const useFcmRegistration = (): void => {
  const token = useAuthStore((s) => s.token)
  const loaded = useAppConfigStore((s) => s.loaded)
  const firebase = useAppConfigStore((s) => s.firebase)

  useEffect(() => {
    if (!loaded) return
    void registerDevicePush(firebase, token)
  }, [token, loaded, firebase])
}
