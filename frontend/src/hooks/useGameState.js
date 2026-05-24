import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export function useGameState(roomId) {
  const { setGameState, setRoom } = useGameStore()

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`state:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new)
          setGameState(payload.new.game_state)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [roomId, setGameState, setRoom])
}
