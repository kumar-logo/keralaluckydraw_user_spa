export enum SlatMatchMode {
  Group = 'group',
  Ladder = 'ladder',
}

export interface SlatTierView {
  label: string
  positions: number[]
  winAmount: number
  tierRank: number
}

export interface SlatProductView {
  id: number
  digitCount: number
  price: number
  matchMode: SlatMatchMode
  title: string
  status: number
  tiers: SlatTierView[]
}

export const SLAT_PRODUCT_ACTIVE = 1

export const isSlatProductActive = (product: SlatProductView): boolean =>
  product.status === SLAT_PRODUCT_ACTIVE

export const slatTopTier = (product: SlatProductView): SlatTierView | undefined =>
  product.tiers.length
    ? [...product.tiers].sort((a, b) => b.tierRank - a.tierRank)[0]
    : undefined

export const slatPanelLevel = (product: SlatProductView): number =>
  product.matchMode === SlatMatchMode.Group
    ? (product.tiers[0]?.positions.length ?? product.digitCount)
    : (slatTopTier(product)?.positions.length ?? product.digitCount)

export const slatTierLabels = (product: SlatProductView): string[] =>
  product.tiers.map((tier) => tier.label)

export const slatFindTier = (
  product: SlatProductView,
  label: string
): SlatTierView | undefined =>
  product.tiers.find((tier) => tier.label === label)

export const slatWinPrize = (
  product: SlatProductView,
  label: string
): number => {
  if (product.matchMode === SlatMatchMode.Group) {
    return slatFindTier(product, label)?.winAmount ?? 0
  }
  return slatTopTier(product)?.winAmount ?? 0
}

export const slatMatchString = (product: SlatProductView): string => {
  const top = slatTopTier(product)
  return top ? top.label : ''
}

export const slatPanelGroups = (
  product: SlatProductView
): (string | string[])[] | undefined => {
  if (product.matchMode !== SlatMatchMode.Group) {
    const top = slatTopTier(product)
    if (!top) return undefined
    return [top.label.split('')]
  }
  const level = slatPanelLevel(product)
  const labels = slatTierLabels(product)
  return level === 1 ? labels : labels.map((label) => label.split(''))
}
