import { debounce, checkAuth } from './helpers'
import { useAuthStore } from '../stores/authStore'
import { getUserWallet } from '../services/userApi'

export const fetchAndSyncBalance = debounce(() => {
  if (checkAuth(false, false)) {
    getUserWallet().then((data) => {
      useAuthStore.setState({
        balance: data.balance,
        bonusBalance: data.bonusBalance,
        isRecharge: data.isRecharge,
      })
    })
  }
}, 100)
