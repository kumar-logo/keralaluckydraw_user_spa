import { Outlet } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'

export const TabLayout = () => (
  <div className="flex flex-col h-full w-full overflow-hidden">
    <div className="flex-1 flex flex-col overflow-hidden">
      <Outlet />
    </div>
    <BottomTabBar />
  </div>
)
