import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

export default function ChatPanel({ roomCode }) {
  const { t } = useTranslation()
  const { chatMessages } = useGameStore()
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const send = async () => {
    if (!text.trim()) return
    try {
      await api.sendChat(roomCode, text.trim())
      setText('')
    } catch {}
  }

  return (
    <div className="flex flex-col bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg overflow-hidden h-48">
      <div className="text-xs font-semibold text-hogwarts-gold/60 px-2 py-1 border-b border-hogwarts-gold/10">
        💬 Chat
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {chatMessages.map((m) => (
          <div key={m.id} className={m.user_id === user?.id ? 'text-right' : ''}>
            <span className="text-hogwarts-parchment/50 mr-1">{m.display_name}:</span>
            <span className="text-hogwarts-parchment">{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex border-t border-hogwarts-gold/10">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t('chat.placeholder')}
          className="flex-1 bg-transparent px-2 py-1 text-xs outline-none text-hogwarts-parchment placeholder-hogwarts-parchment/30"
        />
        <button
          onClick={send}
          className="px-2 text-hogwarts-gold hover:text-hogwarts-gold/70 text-xs"
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  )
}
