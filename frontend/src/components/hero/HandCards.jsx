import { useTranslation } from 'react-i18next'
import Card from '../cards/Card'

export default function HandCards({ cards, onPlay }) {
  const { t } = useTranslation()

  if (!cards.length) return (
    <div className="text-xs text-hogwarts-parchment/30 py-1">{t('game.hand')}: vuota</div>
  )

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {cards.map((cardId) => (
        <div key={cardId} className="flex-shrink-0 w-10">
          <Card
            cardId={cardId}
            onClick={() => onPlay(cardId)}
            showBuy={false}
          />
        </div>
      ))}
    </div>
  )
}
