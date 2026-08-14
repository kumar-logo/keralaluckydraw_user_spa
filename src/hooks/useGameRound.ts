import { useEffect } from 'react'
import {
  useGameSseStore,
  type RoundState,
  type DrawResultState,
} from '../stores/gameSseStore'

interface UseGameRoundResult {
  round: RoundState | undefined
  result: DrawResultState | undefined
  serverOffset: number
  connected: boolean
}

export function useGameRound(gameId?: number | null): UseGameRoundResult {
  const connect = useGameSseStore((s) => s.connect)
  const subscribe = useGameSseStore((s) => s.subscribe)
  const unsubscribe = useGameSseStore((s) => s.unsubscribe)
  const round = useGameSseStore((s) =>
    gameId ? s.rounds[gameId] : undefined,
  )
  const result = useGameSseStore((s) =>
    gameId ? s.results[gameId] : undefined,
  )
  const serverOffset = useGameSseStore((s) => s.serverOffset)
  const connected = useGameSseStore((s) => s.connected)

  useEffect(() => {
    if (!gameId) return
    connect()
    subscribe(gameId)
    return () => unsubscribe(gameId)
  }, [gameId, connect, subscribe, unsubscribe])

  return { round, result, serverOffset, connected }
}
