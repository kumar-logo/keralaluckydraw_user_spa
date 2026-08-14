import { useState, useEffect } from 'react'
import { OrderRecord } from './orderDetailTypes'

export const useStoredOrder = (): OrderRecord | undefined => {
  const [order, setOrder] = useState<OrderRecord>()
  useEffect(() => {
    const raw = localStorage.getItem('OrderDetails') || '{}'
    try {
      setOrder(JSON.parse(raw))
    } catch (error) {
      console.error('bets json parse error', error)
    }
  }, [])
  return order
}
