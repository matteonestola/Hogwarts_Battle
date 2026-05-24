import { useTranslation } from 'react-i18next'

export default function DarkArtsDeck({ darkArts }) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 bg-hogwarts-dark/50 border border-purple-900/40 rounded-lg px-3 py-2">
      <div className="text-xs font-semibold text-purple-400/70">🌑 {t('game.darkArts')}</div>
      <div className="flex gap-2 text-xs text-hogwarts-parchment/60">
        <span>Mazzo: <strong className="text-hogwarts-parchment">{darkArts?.deck_count ?? 0}</strong></span>
        <span>Scarto: <strong className="text-hogwarts-parchment">{darkArts?.discard?.length ?? 0}</strong></span>
      </div>
    </div>
  )
}
