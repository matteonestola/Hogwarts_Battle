import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export function useChat(roomId) {
  const { addChatMessage, addEventLog } = useGameStore()

  useEffect(() => {
    if (!roomId) return

    const chatChannel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => addChatMessage(payload.new)
      )
      .subscribe()

    const logChannel = supabase
      .channel(`log:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_log', filter: `room_id=eq.${roomId}` },
        (payload) => addEventLog(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(logChannel)
    }
  }, [roomId, addChatMessage, addEventLog])
}
