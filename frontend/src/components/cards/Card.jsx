import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CardDetail from './CardDetail'

const TYPE_COLORS = {
  hogwarts: 'border-hogwarts-gold/60 bg-hogwarts-gold/10',
  dark_arts: 'border-purple-700/60 bg-purple-900/20',
  villain: 'border-red-700/60 bg-red-900/20',
  location: 'border-blue-700/60 bg-blue-900/20',
  hero: 'border-green-700/60 bg-green-900/20',
}

export default function Card({ cardId, cardData, onClick, disabled, showBuy }) {
  const { i18n } = useTranslation()
  const [showDetail, setShowDetail] = useState(false)
  const lang = i18n.language

  const name = cardData
    ? (cardData[`name_${lang}`] || cardData.name_it || cardId)
    : cardId

  const colorClass = TYPE_COLORS[cardData?.type] || TYPE_COLORS.hogwarts

  return (
    <>
      <div
        className={`relative aspect-[2/3] rounded border ${colorClass} cursor-pointer transition-transform hover:scale-105 hover:z-10 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } flex flex-col items-center justify-center p-1`}
        onClick={() => {
          if (!disabled) {
            setShowDetail(true)
          }
        }}
      >
        {cardData?.image_url ? (
          <img src={cardData.image_url} alt={name} className="w-full h-full object-cover rounded" />
        ) : (
          <div className="text-center">
            <div className="text-xs font-semibold text-hogwarts-parchment leading-tight line-clamp-2">{name}</div>
            {cardData?.cost != null && (
              <div className="mt-1 text-xs text-hogwarts-gold">🔮{cardData.cost}</div>
            )}
          </div>
        )}
      </div>

      {showDetail && (
        <CardDetail
          cardData={cardData}
          cardId={cardId}
          onClose={() => setShowDetail(false)}
          onAction={onClick}
          showBuy={showBuy}
        />
      )}
    </>
  )
}
