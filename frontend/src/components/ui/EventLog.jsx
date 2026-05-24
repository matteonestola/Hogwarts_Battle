import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'

const EVENT_ICONS = {
  play_card: '🃏', buy_card: '🔮', assign_attack: '⚔️',
  end_turn: '🔄', villain: '💀', dark_arts: '🌑',
  hero_stunned: '⚡', villain_defeated: '✨', game_start: '🏰', default: '•',
}

export default function EventLog() {
  const { eventLog } = useGameStore()
  const { i18n } = useTranslation()
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [eventLog])

  return (
    <div className="flex flex-col bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg overflow-hidden flex-1">
      <div className="text-xs font-semibold text-hogwarts-gold/60 px-2 py-1 border-b border-hogwarts-gold/10">
        📜 Log
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
        {eventLog.map((e) => {
          const text = i18n.language === 'en'
            ? e.payload?.text_en
            : e.payload?.text_it
          return (
            <div key={e.id} className="text-hogwarts-parchment/70 leading-relaxed">
              <span className="mr-1">{EVENT_ICONS[e.event_type] || EVENT_ICONS.default}</span>
              <span>{text || e.event_type}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
