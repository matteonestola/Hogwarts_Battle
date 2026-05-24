import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export function useGameState(roomCode) {
  const { setGameState, setRoom } = useGameStore()

  useEffect(() => {
    if (!roomCode) return

    const channel = supabase
      .channel(`room:${roomCode}:state`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          setRoom(payload.new)
          setGameState(payload.new.game_state)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [roomCode, setGameState, setRoom])
}
