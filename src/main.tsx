import React from 'react'
import ReactDOM from 'react-dom/client'
import '@lottiefiles/lottie-player'
import App from './App'
import { installCopyShield } from './utils/copyShield'
import './index.css'
import './styles/k3-dice.css'
import './styles/chat.css'

installCopyShield()

window.addEventListener('unhandledrejection', (e) => {
  e.preventDefault()
})

const inviteParams = new URLSearchParams(window.location.search)
const referralCode = inviteParams.get('invite') || inviteParams.get('inviteCode') || inviteParams.get('code') || inviteParams.get('referral')
if (referralCode) localStorage.setItem('inviteCode', referralCode)
else localStorage.removeItem('inviteCode')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
