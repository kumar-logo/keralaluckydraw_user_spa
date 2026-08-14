import { createContext, useContext } from 'react'

export interface PositionConfig {
  colors: string[]
  gradients: string[][]
  labels: string[]
}

export const PositionConfigContext = createContext<PositionConfig | null>(null)

export const usePositionConfig = (): PositionConfig => {
  const ctx = useContext(PositionConfigContext)
  return {
    colors: ctx?.colors ?? [],
    gradients: ctx?.gradients ?? [],
    labels: ctx?.labels ?? [],
  }
}

export const resolvePositionColor = (
  config: PositionConfig,
  index: number,
): string => (index >= 0 ? config.colors[index] || '' : '')

export const resolvePositionLabel = (
  config: PositionConfig,
  index: number,
  fallback: string,
): string => {
  const label = index >= 0 ? config.labels[index] : ''
  return label ? label : fallback
}
