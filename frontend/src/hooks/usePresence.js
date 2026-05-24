import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'

export function usePresence(roomId) {
  const { gameState, setPaused } = useGameStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!roomId || !user) return

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presentIds = Object.keys(state)
        if (!gameState) return
        const activeId = gameState.active_player_id
        const activePresent = presentIds.includes(activeId)
        if (!activePresent && gameState.phase !== 'lobby') {
          setPaused(true, activeId)
        } else {
          setPaused(false, null)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    return () => supabase.removeChannel(channel)
  }, [roomId, user, gameState?.active_player_id])
}
