import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { NextUIProvider } from '@nextui-org/react'
import './i18n'
import { useUIStore } from './stores/uiStore'
import { useAppConfigStore } from './stores/configStore'
import { debounce } from './utils/helpers'
import { RootLayout } from './components/layout/RootLayout'
import { TabLayout } from './components/layout/TabLayout'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { RequireAuth } from './components/RequireAuth'

const HomePage = lazy(() => import('./pages/HomePage'))
const SportsPage = lazy(() => import('./pages/SportsPage'))
const LuckySpinPage = lazy(() => import('./pages/LuckySpinPage'))
const EarnMoneyPage = lazy(() => import('./pages/EarnMoneyPage'))
const MePage = lazy(() => import('./pages/MePage'))

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'))
const BannedPage = lazy(() => import('./pages/BannedPage'))

const RacePage = lazy(() => import('./pages/RacePage'))
const DicePage = lazy(() => import('./pages/DicePage'))
const ColorPage = lazy(() => import('./pages/ColorPage'))
const ThreeDigitPage = lazy(() => import('./pages/ThreeDigitPage'))
const FourFiveDigitPage = lazy(() => import('./pages/FourFiveDigitPage'))
const KeralaPage = lazy(() => import('./pages/KeralaPage'))
const MysteryBoxPage = lazy(() => import('./pages/MysteryBoxPage'))
const DubaiPage = lazy(() => import('./pages/DubaiPage'))

const RechargePage = lazy(() => import('./pages/RechargePage'))
const RechargeReturnPage = lazy(() => import('./pages/RechargeReturnPage'))
const WithdrawPage = lazy(() => import('./pages/WithdrawPage'))
const AddBankCardPage = lazy(() => import('./pages/AddBankCardPage'))
const WithdrawSuccessPage = lazy(() => import('./pages/WithdrawSuccessPage'))
const TransferPage = lazy(() => import('./pages/TransferPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const BonusPage = lazy(() => import('./pages/BonusPage'))
const RebatePage = lazy(() => import('./pages/RebatePage'))

const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const VipPage = lazy(() => import('./pages/VipPage'))
const AgentPage = lazy(() => import('./pages/AgentPage'))
const AgentSubordinatesPage = lazy(() => import('./pages/AgentSubordinatesPage'))
const MyBetsPage = lazy(() => import('./pages/MyBetsPage'))
const MyBetDetailPage = lazy(() => import('./pages/MyBetDetailPage'))
const RecordPage = lazy(() => import('./pages/RecordPage'))

const ResultPage = lazy(() => import('./pages/ResultPage'))
const ResultDetailPage = lazy(() => import('./pages/ResultDetailPage'))

const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))

const SearchGamesPage = lazy(() => import('./pages/SearchGamesPage'))
const GameListPage = lazy(() => import('./pages/GameListPage'))
const ProviderListPage = lazy(() => import('./pages/ProviderListPage'))
const CashRainPage = lazy(() => import('./pages/CashRainPage'))
const StoreAppPage = lazy(() => import('./pages/StoreAppPage'))
const PartnerPage = lazy(() => import('./pages/PartnerPage'))
const RedirectPage = lazy(() => import('./pages/RedirectPage'))

const LandSafeDearPage = lazy(() => import('./pages/land/SafeDearPage'))
const Land4DPage = lazy(() => import('./pages/land/Land4DPage'))
const LandChecken1Page = lazy(() => import('./pages/land/Checken1Page'))
const LandChecken2Page = lazy(() => import('./pages/land/Checken2Page'))
const LandChecken3Page = lazy(() => import('./pages/land/Checken3Page'))
const LandGamePage = lazy(() => import('./pages/land/LandGamePage'))

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const Loading = () => (
  <div className="size-full flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function App() {
  const updateWindowSize = useUIStore((x) => x.updateWindowSize)
  const setStandalone = useUIStore((x) => x.setStandalone)
  const fetchConfig = useAppConfigStore((x) => x.fetchConfig)

  useEffect(() => { fetchConfig() }, [])

  useEffect(() => {
    const debouncedResize = debounce(() => { updateWindowSize() })
    requestAnimationFrame(() => { debouncedResize() })

    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)')
    const handleStandaloneChange = () => { setStandalone(standaloneQuery.matches || (navigator as any).standalone) }
    standaloneQuery?.addEventListener('change', handleStandaloneChange)

    window.addEventListener('resize', debouncedResize)
    window.addEventListener('updateNexusesRect', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      window.removeEventListener('updateNexusesRect', debouncedResize)
      standaloneQuery?.removeEventListener('change', handleStandaloneChange)
    }
  }, [])

  return (
    <NextUIProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<Navigate to="/index" replace />} />

              <Route path="/index" element={<TabLayout />}>
                <Route index element={<Navigate to="/index/home" replace />} />
                <Route path="home" element={<HomePage />} />
                <Route path="sports" element={<SportsPage />} />
                <Route path="lucky-spin" element={<LuckySpinPage />} />
                <Route path="earn-money" element={<EarnMoneyPage />} />
                <Route path="result" element={<ResultPage />} />
                <Route path="my-bets" element={<RequireAuth><MyBetsPage /></RequireAuth>} />
                <Route path="me" element={<MePage />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/set-password" element={<SetPasswordPage />} />
              <Route path="/banned" element={<RequireAuth><BannedPage /></RequireAuth>} />

              <Route path="/demo" element={<Navigate to="/index/home" replace />} />

              <Route path="/games/race/:id" element={<RacePage />} />
              <Route path="/games/race/demo" element={<RacePage />} />
              <Route path="/games/k3" element={<DicePage />} />
              <Route path="/games/wingo" element={<ColorPage />} />
              <Route path="/games/digit" element={<ThreeDigitPage />} />
              <Route path="/games/5d" element={<FourFiveDigitPage />} />
              <Route path="/games/kerala" element={<KeralaPage />} />
              <Route path="/games/mystery-box" element={<MysteryBoxPage />} />
              <Route path="/games/dubai" element={<DubaiPage />} />

              <Route path="/recharge" element={<RequireAuth><RechargePage /></RequireAuth>} />
              <Route path="/recharge/return" element={<RequireAuth><RechargeReturnPage /></RequireAuth>} />
              <Route path="/withdraw" element={<RequireAuth><WithdrawPage /></RequireAuth>} />
              <Route path="/withdraw/add-bank-card" element={<RequireAuth><AddBankCardPage /></RequireAuth>} />
              <Route path="/withdraw/success" element={<RequireAuth><WithdrawSuccessPage /></RequireAuth>} />
              <Route path="/transfer" element={<RequireAuth><TransferPage /></RequireAuth>} />
              <Route path="/transactions" element={<RequireAuth><TransactionsPage /></RequireAuth>} />
              <Route path="/bonus" element={<RequireAuth><BonusPage /></RequireAuth>} />
              <Route path="/rebate" element={<RequireAuth><RebatePage /></RequireAuth>} />

              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/vip" element={<RequireAuth><VipPage /></RequireAuth>} />
              <Route path="/agent" element={<RequireAuth><AgentPage /></RequireAuth>} />
              <Route path="/agent/subordinates" element={<RequireAuth><AgentSubordinatesPage /></RequireAuth>} />
              <Route path="/my-bets" element={<RequireAuth><MyBetsPage /></RequireAuth>} />
              <Route path="/my-bets/detail" element={<RequireAuth><MyBetDetailPage /></RequireAuth>} />
              <Route path="/record/:slug" element={<RequireAuth><RecordPage /></RequireAuth>} />

              <Route path="/result" element={<ResultPage />} />
              <Route path="/result/lottery/detail" element={<ResultDetailPage />} />
              <Route path="/result/digit/detail" element={<ResultDetailPage />} />
              <Route path="/result/5d/detail" element={<ResultDetailPage />} />

              <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

              <Route path="/search-games" element={<SearchGamesPage />} />
              <Route path="/gamelist/:type" element={<GameListPage />} />
              <Route path="/providerlist" element={<ProviderListPage />} />
              <Route path="/cash-rain" element={<CashRainPage />} />
              <Route path="/store/apps/details" element={<StoreAppPage />} />
              <Route path="/partner-page/:type" element={<PartnerPage />} />
              <Route path="/redirect" element={<RedirectPage />} />

              <Route path="/land" element={<Outlet />}>
                <Route index element={<Navigate to="/index/home" replace />} />
                <Route path="safedear" element={<LandSafeDearPage />} />
                <Route path="4d" element={<Land4DPage />} />
                <Route path="checken1" element={<LandChecken1Page />} />
                <Route path="checken2" element={<LandChecken2Page />} />
                <Route path="checken3" element={<LandChecken3Page />} />
                <Route path="game" element={<LandGamePage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </NextUIProvider>
  )
}

export default App
