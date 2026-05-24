import { useTranslation } from 'react-i18next'
import Card from '../cards/Card'

export default function HogwartsMarket({ market, onBuy, disabled }) {
  const { t } = useTranslation()

  return (
    <div className="bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-hogwarts-gold/60">🃏 {t('game.market')}</div>
        <span className="text-xs text-hogwarts-parchment/40">Mazzo: {market?.deck_count ?? 0}</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {(market?.available || []).map((cardId) => (
          <Card
            key={cardId}
            cardId={cardId}
            onClick={() => !disabled && onBuy(cardId)}
            disabled={disabled}
            showBuy
          />
        ))}
        {Array.from({ length: Math.max(0, 6 - (market?.available?.length || 0)) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-[2/3] bg-hogwarts-dark/30 border border-dashed border-hogwarts-parchment/10 rounded" />
        ))}
      </div>
    </div>
  )
}
