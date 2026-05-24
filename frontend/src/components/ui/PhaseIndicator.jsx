import { useTranslation } from 'react-i18next'

const PHASES = ['dark_arts', 'villain', 'actions', 'end']
const PHASE_COLORS = {
  dark_arts: 'text-purple-400',
  villain: 'text-red-400',
  actions: 'text-green-400',
  end: 'text-hogwarts-gold',
}

export default function PhaseIndicator({ phase, activePlayer, heroes }) {
  const { t } = useTranslation()

  const activeHeroEntry = Object.entries(heroes || {}).find(
    ([, h]) => h.player_id === activePlayer
  )
  const activeHeroId = activeHeroEntry?.[0]

  return (
    <div className="bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {PHASES.map((p) => (
          <span
            key={p}
            className={`text-xs px-2 py-0.5 rounded-full ${
              phase === p
                ? `${PHASE_COLORS[p]} bg-current/10 border border-current font-semibold`
                : 'text-hogwarts-parchment/30'
            }`}
          >
            {t(`game.phase.${p}`)}
          </span>
        ))}
      </div>
      {activeHeroId && (
        <span className="text-sm text-hogwarts-gold capitalize">
          ⚡ {t(`heroes.${activeHeroId}`)}
        </span>
      )}
    </div>
  )
}
