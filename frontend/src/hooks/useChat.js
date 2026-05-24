import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export function useChat(roomCode) {
  const { addChatMessage, addEventLog } = useGameStore()

  useEffect(() => {
    if (!roomCode) return

    const chatChannel = supabase
      .channel(`room:${roomCode}:chat`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_code=eq.${roomCode}` },
        (payload) => addChatMessage(payload.new)
      )
      .subscribe()

    const logChannel = supabase
      .channel(`room:${roomCode}:log`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_log', filter: `room_code=eq.${roomCode}` },
        (payload) => addEventLog(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(logChannel)
    }
  }, [roomCode, addChatMessage, addEventLog])
}
