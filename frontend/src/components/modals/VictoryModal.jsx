import { useTranslation } from 'react-i18next'

export default function VictoryModal({ winner }) {
  const { t } = useTranslation()
  const isVictory = winner === 'heroes'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-hogwarts-dark border border-hogwarts-gold/40 rounded-2xl p-10 text-center space-y-4 max-w-sm mx-4">
        <div className="text-6xl">{isVictory ? '🏆' : '💀'}</div>
        <h2 className="text-3xl font-magic text-hogwarts-gold">
          {isVictory ? t('game.victory') : t('game.defeat')}
        </h2>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg"
        >
          Torna alla lobby
        </button>
      </div>
    </div>
  )
}
