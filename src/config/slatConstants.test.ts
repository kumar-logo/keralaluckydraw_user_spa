import { describe, it, expect } from 'vitest'
import {
  SlatMatchMode,
  SLAT_PRODUCT_ACTIVE,
  isSlatProductActive,
  slatTopTier,
  slatPanelLevel,
  slatTierLabels,
  slatFindTier,
  slatWinPrize,
  slatMatchString,
  slatPanelGroups,
  type SlatProductView,
  type SlatTierView,
} from './slatConstants'

const tier = (
  label: string,
  positions: number[],
  winAmount: number,
  tierRank: number,
): SlatTierView => ({ label, positions, winAmount, tierRank })

const ladderProduct = (): SlatProductView => ({
  id: 1,
  digitCount: 3,
  price: 10,
  matchMode: SlatMatchMode.Ladder,
  title: 'Super Ladder',
  status: SLAT_PRODUCT_ACTIVE,
  // intentionally unsorted: the top tier (highest rank) is NOT last in the array
  tiers: [
    tier('A', [0], 100, 1),
    tier('ABC', [0, 1, 2], 9000, 3),
    tier('AB', [0, 1], 800, 2),
  ],
})

const groupProduct = (): SlatProductView => ({
  id: 2,
  digitCount: 3,
  price: 10,
  matchMode: SlatMatchMode.Group,
  title: 'Group Box',
  status: SLAT_PRODUCT_ACTIVE,
  tiers: [
    tier('Single', [0], 90, 1),
    tier('Double', [0, 1], 500, 2),
    tier('Triple', [0, 1, 2], 4500, 3),
  ],
})

describe('slatConstants — product activation', () => {
  it('treats status === SLAT_PRODUCT_ACTIVE as active', () => {
    expect(isSlatProductActive(ladderProduct())).toBe(true)
  })

  it('treats any other status as inactive', () => {
    expect(isSlatProductActive({ ...ladderProduct(), status: 0 })).toBe(false)
    expect(isSlatProductActive({ ...ladderProduct(), status: 2 })).toBe(false)
  })
})

describe('slatTopTier — selects the highest tierRank regardless of array order', () => {
  it('returns the tier with the greatest tierRank (the top of the ladder)', () => {
    const top = slatTopTier(ladderProduct())
    expect(top?.label).toBe('ABC')
    expect(top?.tierRank).toBe(3)
    expect(top?.winAmount).toBe(9000)
  })

  it('does not mutate the original tiers array while sorting', () => {
    const product = ladderProduct()
    const before = product.tiers.map((t) => t.label)
    slatTopTier(product)
    expect(product.tiers.map((t) => t.label)).toEqual(before)
  })

  it('returns undefined when there are no tiers', () => {
    expect(slatTopTier({ ...ladderProduct(), tiers: [] })).toBeUndefined()
  })
})

describe('slatFindTier — exact label lookup', () => {
  it('finds the matching tier by label', () => {
    const found = slatFindTier(groupProduct(), 'Double')
    expect(found?.winAmount).toBe(500)
    expect(found?.positions).toEqual([0, 1])
  })

  it('returns undefined for an unknown label', () => {
    expect(slatFindTier(groupProduct(), 'Quad')).toBeUndefined()
  })
})

describe('slatWinPrize — displayed prize per match mode', () => {
  it('LADDER: displays the TOP tier prize no matter which label is passed', () => {
    const p = ladderProduct()
    const topAmount = slatTopTier(p)!.winAmount
    expect(slatWinPrize(p, 'A')).toBe(topAmount)
    expect(slatWinPrize(p, 'AB')).toBe(topAmount)
    expect(slatWinPrize(p, 'ABC')).toBe(topAmount)
    expect(slatWinPrize(p, 'does-not-exist')).toBe(topAmount)
    expect(topAmount).toBe(9000)
  })

  it('GROUP: displays the EXACT tier prize for the passed label', () => {
    const p = groupProduct()
    expect(slatWinPrize(p, 'Single')).toBe(90)
    expect(slatWinPrize(p, 'Double')).toBe(500)
    expect(slatWinPrize(p, 'Triple')).toBe(4500)
  })

  it('GROUP: unknown label yields 0 (no phantom prize)', () => {
    expect(slatWinPrize(groupProduct(), 'Nope')).toBe(0)
  })

  it('LADDER with no tiers yields 0', () => {
    expect(slatWinPrize({ ...ladderProduct(), tiers: [] }, 'ABC')).toBe(0)
  })
})

describe('slatPanelLevel — number of positions to display', () => {
  it('GROUP: uses the first tier position count', () => {
    expect(slatPanelLevel(groupProduct())).toBe(1)
  })

  it('GROUP: falls back to digitCount only when the first tier is missing', () => {
    const p = groupProduct()
    p.tiers = []
    expect(slatPanelLevel(p)).toBe(p.digitCount)
  })

  it('GROUP: an empty positions array yields level 0 (?? only guards null/undefined)', () => {
    const p = groupProduct()
    p.tiers[0] = tier('Single', [], 90, 1)
    expect(slatPanelLevel(p)).toBe(0)
  })

  it('LADDER: uses the TOP tier position count', () => {
    expect(slatPanelLevel(ladderProduct())).toBe(3)
  })
})

describe('slatTierLabels', () => {
  it('returns labels in array order', () => {
    expect(slatTierLabels(groupProduct())).toEqual(['Single', 'Double', 'Triple'])
  })
})

describe('slatMatchString', () => {
  it('returns the top tier label', () => {
    expect(slatMatchString(ladderProduct())).toBe('ABC')
  })

  it('returns empty string when there are no tiers', () => {
    expect(slatMatchString({ ...ladderProduct(), tiers: [] })).toBe('')
  })
})

describe('slatPanelGroups — panel rendering shape', () => {
  it('LADDER: splits the top label into single-char groups', () => {
    expect(slatPanelGroups(ladderProduct())).toEqual([['A', 'B', 'C']])
  })

  it('LADDER: returns undefined when there is no top tier', () => {
    expect(slatPanelGroups({ ...ladderProduct(), tiers: [] })).toBeUndefined()
  })

  it('GROUP with multi-position level (>1): splits each label into chars', () => {
    // first tier has 2 positions -> panel level 2 -> labels are char-split
    const p: SlatProductView = {
      ...groupProduct(),
      tiers: [
        tier('12', [0, 1], 500, 2),
        tier('34', [0, 1], 500, 2),
      ],
    }
    expect(slatPanelGroups(p)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('GROUP with level 1: returns labels as-is (one digit pick)', () => {
    // groupProduct first tier has 1 position -> level 1 -> labels untouched
    expect(slatPanelGroups(groupProduct())).toEqual(['Single', 'Double', 'Triple'])
  })
})
