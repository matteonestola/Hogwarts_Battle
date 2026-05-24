import { useTranslation } from 'react-i18next'
import CardImageUpload from '../ui/CardImageUpload'
import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import { useCardStore } from '../../store/cardStore'

export default function CardDetail({ cardData, cardId, onClose, onAction, showBuy }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { room } = useGameStore()
  const { user } = useAuthStore()
  const isHost = room?.host_id === user?.id

  const name = cardData?.[`name_${lang}`] || cardData?.name_it || cardId
  const abilityText = cardData?.[`ability_text_${lang}`] || cardData?.ability_text_it || ''

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-hogwarts-dark border border-hogwarts-gold/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-magic text-hogwarts-gold text-xl">{name}</h3>
          <button onClick={onClose} className="text-hogwarts-parchment/40 hover:text-hogwarts-parchment">✕</button>
        </div>

        {cardData?.cost != null && (
          <div className="text-sm">
            <span className="text-hogwarts-parchment/60">Costo: </span>
            <span className="text-hogwarts-gold font-bold">🔮 {cardData.cost}</span>
          </div>
        )}

        {abilityText && (
          <p className="text-hogwarts-parchment/80 text-sm border-t border-hogwarts-gold/20 pt-3">
            {abilityText}
          </p>
        )}

        {cardData?.effects?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {cardData.effects.map((ef, i) => (
              <span key={i} className="text-xs bg-hogwarts-gold/10 border border-hogwarts-gold/30 px-2 py-0.5 rounded">
                {ef.type} +{ef.value}
              </span>
            ))}
          </div>
        )}

        {isHost && (
          <CardImageUpload
            cardId={cardId}
            onUploaded={(url) => {
              useCardStore.getState().cards[cardId] = {
                ...useCardStore.getState().cards[cardId],
                image_url: url,
              }
            }}
          />
        )}

        {onAction && (
          <button
            onClick={() => { onAction(); onClose() }}
            className="w-full py-2 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg"
          >
            {showBuy ? t('game.buyCard') : t('game.playCard')}
          </button>
        )}
      </div>
    </div>
  )
}
