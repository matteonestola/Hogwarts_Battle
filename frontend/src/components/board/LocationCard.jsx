import { useTranslation } from 'react-i18next'

export default function LocationCard({ locations }) {
  const { t, i18n } = useTranslation()
  if (!locations) return null

  const active = locations.stack?.[locations.active_index]
  const nameKey = i18n.language === 'it' ? 'name_it' : 'name_en'
  const tokens = locations.control_tokens?.[active?.id] ?? 0

  return (
    <div className="bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg p-3 space-y-2">
      <div className="text-xs font-semibold text-hogwarts-gold/60">📍 {t('game.location')}</div>
      {active ? (
        <>
          <div className="font-magic text-hogwarts-gold">{active[nameKey] || active.id}</div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-hogwarts-parchment/60">{t('game.controlTokens')}:</span>
            <div className="flex gap-1">
              {Array.from({ length: active.control_max || 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border ${
                    i < tokens ? 'bg-hogwarts-red border-hogwarts-red' : 'border-hogwarts-parchment/30'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-hogwarts-parchment/50">
            {locations.stack.length - locations.active_index - 1} location rimaste
          </div>
        </>
      ) : (
        <div className="text-hogwarts-parchment/40 text-sm">Nessun luogo attivo</div>
      )}
    </div>
  )
}
