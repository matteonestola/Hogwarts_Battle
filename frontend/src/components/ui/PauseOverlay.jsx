import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

export default function PauseOverlay({ roomCode }) {
  const { t } = useTranslation()
  const { paused, pausedPlayer, room } = useGameStore()
  const { user } = useAuthStore()
  if (!paused) return null
  const isHost = room?.host_id === user?.id

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
      <div className="bg-hogwarts-dark border border-hogwarts-gold/40 rounded-xl p-8 text-center space-y-4 max-w-sm mx-4">
        <div className="text-4xl animate-pulse">⏸️</div>
        <h3 className="text-xl font-magic text-hogwarts-gold">Partita in pausa</h3>
        <p className="text-hogwarts-parchment/70 text-sm">
          Un giocatore si è disconnesso. In attesa di riconnessione... (3 min)
        </p>
        {isHost && (
          <button
            onClick={async () => {
              try {
                await api.transferHero(roomCode, { from_player_id: pausedPlayer, to_player_id: user.id })
              } catch {}
            }}
            className="px-4 py-2 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg text-sm"
          >
            Prendi controllo eroe
          </button>
        )}
      </div>
    </div>
  )
}
