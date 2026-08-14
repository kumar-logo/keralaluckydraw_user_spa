import { create } from 'zustand'


const initFromUrl = (dispatch: (key: string) => void, key: string) => {
  try {
    const params = new URLSearchParams(window.location.search)
    const value = params.get(key)
    if (value) dispatch(value)
  } catch (err) {
    console.debug('resultSubBar initFromUrl failed', err)
  }
}

interface ResultSubBarStore {
  subBarKey: string
  loading: boolean
  setSubBarKey: (key: string) => void
  initBar: () => void
  setLoading: (loading: boolean) => void
}

export const useResultSubBarStore = create<ResultSubBarStore>((set) => ({
  subBarKey: 'scratch',
  loading: false,
  setSubBarKey: (key) => {
    set({ subBarKey: key })
  },
  initBar: () => {
    initFromUrl(useResultSubBarStore.getState().setSubBarKey, 'subBarKey')
  },
  setLoading: (loading) => {
    set({ loading })
  },
}))
