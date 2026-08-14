import { create } from 'zustand'


interface MysteryBoxPrizeItem {
  prize?: number
  [key: string]: unknown
}

interface MysteryBoxItem {
  coinType: number
  cover: string
  coverImgID: string
  freeCount: number
  gameID: number
  gameName: string
  icon: string
  iconImgID: string
  items: MysteryBoxPrizeItem[]
  price?: number
  [key: string]: unknown
}

interface GroupedItem extends MysteryBoxItem {
  topPrize: number
  totalFreeCount: number
}

interface MysteryBoxStore {
  list: MysteryBoxItem[]
  updateTime: number
  listGroupByPrice: GroupedItem[]
  setList: (list: MysteryBoxItem[]) => void
}

const groupByPrice = (items: MysteryBoxItem[]): GroupedItem[] =>
  items.reduce<GroupedItem[]>((acc, item) => {
    let group = acc.find((g) => g.price === item.price)
    if (!group) {
      group = {
        ...item,
        topPrize: item.items[0]?.prize || 0,
        totalFreeCount: 0,
        items: [],
      } as GroupedItem
      acc.push(group)
    }
    group.totalFreeCount += item.freeCount
    group.items.push(item)
    return acc
  }, [])

export const useMysteryBoxStore = create<MysteryBoxStore>((set) => ({
  list: [],
  updateTime: 0,
  listGroupByPrice: [],
  setList: (list) => {
    set({
      list,
      listGroupByPrice: groupByPrice(list),
    })
  },
}))
