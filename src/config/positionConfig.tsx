import { ReactNode } from 'react'
import { PositionConfigContext } from './positionContext'

export const PositionConfigProvider = ({
  colors,
  gradients,
  labels,
  children,
}: {
  colors?: string[]
  gradients?: string[][]
  labels?: string[]
  children: ReactNode
}) => (
  <PositionConfigContext.Provider
    value={{
      colors: colors ?? [],
      gradients: gradients ?? [],
      labels: labels ?? [],
    }}
  >
    {children}
  </PositionConfigContext.Provider>
)
