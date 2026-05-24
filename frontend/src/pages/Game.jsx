import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useGameState } from '../hooks/useGameState'
import { useChat } from '../hooks/useChat'
import { useCardStore } from '../store/cardStore'
import { api } from '../lib/api'
import { toast } from '../hooks/useToast'
import LocationCard from '../components/board/LocationCard'
import VillainZone from '../components/board/VillainZone'
import HogwartsMarket from '../components/board/HogwartsMarket'
import DarkArtsDeck from '../components/board/DarkArtsDeck'
import HeroPanel from '../components/hero/HeroPanel'
import ChatPanel from '../components/ui/ChatPanel'
import EventLog from '../components/ui/EventLog'
import PhaseIndicator from '../components/ui/PhaseIndicator'
import LanguageToggle from '../components/ui/LanguageToggle'
import VictoryModal from '../components/modals/VictoryModal'
import StunnedModal from '../components/modals/StunnedModal'

export default function Game() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { room, roomId, gameState, setRoom, setGameState, setChatMessages, setEventLog } = useGameStore()
  const { loadCards } = useCardStore()

  const roomCode = window.location.pathname.split('/game/')[1]

  useGameState(roomId)
  useChat(roomId)

  useEffect(() => {
    if (!roomCode) return
    api.getRoom(roomCode).then((r) => {
      setRoom(r)
      setGameState(r.game_state)
      if (r.game_state?.adventure) {
        loadCards(r.game_state.adventure)
      }
    })
    api.getChat(roomCode).then(setChatMessages)
  }, [roomCode])

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hogwarts-dark">
        <div className="text-hogwarts-gold text-xl animate-pulse">🏰 {t('app.loading')}</div>
      </div>
    )
  }

  const isMyTurn = gameState.active_player_id === user?.id
  const activeHero = gameState.heroes[
    Object.keys(gameState.heroes).find(
      (h) => gameState.heroes[h].player_id === gameState.active_player_id
    )
  ]

  const sendAction = async (type, payload = {}) => {
    try {
      await api.sendAction(roomCode, type, payload)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-hogwarts-dark text-hogwarts-parchment flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hogwarts-gold/20">
        <div className="flex items-center gap-3">
          <span className="font-magic text-hogwarts-gold text-lg">🏰 Hogwarts Battle</span>
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-hogwarts-parchment/60">{t('game.turn', { n: gameState.turn })}</span>
          <span className="font-mono bg-hogwarts-gold/10 border border-hogwarts-gold/30 px-2 py-0.5 rounded">
            {room?.code}
          </span>
        </div>
      </div>

      {/* Main board — desktop: 3 columns; mobile: stacked */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 p-3 overflow-auto">
        {/* Left: Location + Villains */}
        <div className="md:col-span-3 space-y-2 flex flex-row md:flex-col gap-2 overflow-x-auto">
          <div className="min-w-[160px] md:min-w-0 flex-shrink-0 md:flex-shrink">
            <LocationCard locations={gameState.locations} />
          </div>
          <div className="min-w-[200px] md:min-w-0 flex-shrink-0 md:flex-shrink">
            <VillainZone villains={gameState.villains} onAttack={(id) => sendAction('ASSIGN_ATTACK', { villain_id: id })} />
          </div>
        </div>

        {/* Center: Market + Phase + Heroes */}
        <div className="md:col-span-6 flex flex-col gap-2">
          <PhaseIndicator phase={gameState.phase} activePlayer={gameState.active_player_id} heroes={gameState.heroes} />
          <HogwartsMarket
            market={gameState.hogwarts_market}
            onBuy={(cardId) => sendAction('BUY_CARD', { card_id: cardId })}
            disabled={!isMyTurn || gameState.phase !== 'actions'}
          />
          <DarkArtsDeck darkArts={gameState.dark_arts_deck} />
          <div className="space-y-1">
            {Object.entries(gameState.heroes).map(([heroId, hero]) => (
              <HeroPanel
                key={heroId}
                heroId={heroId}
                hero={hero}
                isActive={gameState.active_player_id === hero.player_id}
                isMyHero={hero.player_id === user?.id}
                onPlayCard={(cardId) => sendAction('PLAY_CARD', { card_id: cardId, hero_id: heroId })}
              />
            ))}
          </div>
          {isMyTurn && gameState.phase === 'actions' && (
            <button
              onClick={() => sendAction('END_TURN')}
              className="w-full py-2 bg-hogwarts-red text-white font-bold rounded-lg hover:bg-hogwarts-red/90"
            >
              {t('game.endTurn')}
            </button>
          )}
          {isMyTurn && (gameState.phase === 'dark_arts' || gameState.phase === 'villain') && (
            <button
              onClick={() => sendAction('END_PHASE')}
              className="w-full py-2 bg-purple-900 text-white font-bold rounded-lg hover:bg-purple-800"
            >
              Risolvi fase →
            </button>
          )}
        </div>

        {/* Right: Chat + Log — hidden on mobile */}
        <div className="md:col-span-3 flex flex-col gap-2 hidden md:flex">
          <ChatPanel roomCode={roomCode} />
          <EventLog />
        </div>
      </div>

      {/* Mobile: show/hide chat */}
      <div className="md:hidden border-t border-hogwarts-gold/20 p-2">
        <details>
          <summary className="text-sm text-hogwarts-gold cursor-pointer">💬 Chat & Log</summary>
          <div className="mt-2 space-y-2 max-h-60 overflow-auto">
            <ChatPanel roomCode={roomCode} />
            <EventLog />
          </div>
        </details>
      </div>

      {gameState.winner && <VictoryModal winner={gameState.winner} />}
    </div>
  )
}
