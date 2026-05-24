import { useTranslation } from 'react-i18next'

function VillainCard({ villain, onAttack }) {
  const { i18n } = useTranslation()
  const nameKey = i18n.language === 'it' ? 'name_it' : 'name_en'

  return (
    <div className="bg-hogwarts-red/20 border border-hogwarts-red/40 rounded-lg p-2 space-y-1">
      <div className="font-semibold text-sm text-hogwarts-parchment">{villain[nameKey]}</div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span>❤️</span>
          <span className="font-mono">{villain.health_current}/{villain.health_max}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚔️</span>
          <span className="font-mono">{villain.attack_tokens}</span>
        </div>
      </div>
      <div className="w-full bg-hogwarts-dark/50 rounded-full h-1.5">
        <div
          className="bg-hogwarts-red h-1.5 rounded-full transition-all"
          style={{ width: `${(villain.health_current / villain.health_max) * 100}%` }}
        />
      </div>
      {onAttack && (
        <button
          onClick={() => onAttack(villain.id)}
          className="w-full text-xs py-1 bg-hogwarts-red/40 hover:bg-hogwarts-red/60 rounded transition-colors"
        >
          ⚔️ Attacca
        </button>
      )}
    </div>
  )
}

export default function VillainZone({ villains, onAttack }) {
  const { t } = useTranslation()

  return (
    <div className="bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg p-3 space-y-2">
      <div className="text-xs font-semibold text-hogwarts-gold/60">💀 {t('game.villains')}</div>
      {villains?.active?.length ? (
        <div className="space-y-2">
          {villains.active.map((v) => (
            <VillainCard key={v.id} villain={v} onAttack={onAttack} />
          ))}
        </div>
      ) : (
        <div className="text-hogwarts-parchment/40 text-sm">Nessun malvagio</div>
      )}
    </div>
  )
}
