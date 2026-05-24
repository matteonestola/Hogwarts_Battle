import { useTranslation } from 'react-i18next'

export default function StunnedModal({ heroId, onClose }) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hogwarts-dark border border-red-700/40 rounded-xl p-8 text-center space-y-3 max-w-xs mx-4">
        <div className="text-5xl">⚡</div>
        <h3 className="text-xl font-magic text-red-400">
          {t(`heroes.${heroId}`)} {t('game.stunned')}
        </h3>
        <p className="text-sm text-hogwarts-parchment/60">
          L'eroe è stordito e deve scartare la mano, poi pescarne una nuova di 5 carte.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg text-sm"
        >
          OK
        </button>
      </div>
    </div>
  )
}
