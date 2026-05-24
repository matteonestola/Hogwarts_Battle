import { useTranslation } from 'react-i18next'
import HealthTracker from './HealthTracker'
import HandCards from './HandCards'

const HERO_COLORS = {
  harry: 'border-red-700/50',
  ron: 'border-yellow-700/50',
  hermione: 'border-pink-700/50',
  neville: 'border-green-700/50',
}

export default function HeroPanel({ heroId, hero, isActive, isMyHero, onPlayCard }) {
  const { t } = useTranslation()

  return (
    <div className={`bg-hogwarts-dark/50 border rounded-lg p-2 ${HERO_COLORS[heroId] || 'border-hogwarts-gold/20'} ${isActive ? 'ring-1 ring-hogwarts-gold/50' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold capitalize ${isActive ? 'text-hogwarts-gold' : 'text-hogwarts-parchment/70'}`}>
            {isActive ? '⚡ ' : ''}{t(`heroes.${heroId}`)}
          </span>
          {hero.stunned && (
            <span className="text-xs bg-red-900/50 border border-red-700/50 text-red-300 px-1 rounded">
              {t('game.stunned')}
            </span>
          )}
        </div>
        <HealthTracker current={hero.health} max={heroId === 'harry' ? 10 : heroId === 'ron' ? 10 : heroId === 'hermione' ? 10 : 10} />
      </div>

      {isActive && (
        <div className="space-y-1">
          <div className="flex gap-3 text-xs text-hogwarts-parchment/60">
            <span>⚔️ {t('game.attackTokens')}: <strong className="text-hogwarts-parchment">{hero.attack_tokens}</strong></span>
            <span>🔮 {t('game.influence')}: <strong className="text-hogwarts-parchment">{hero.influence_tokens}</strong></span>
            <span>🃏 {hero.hand?.length || 0} carte</span>
          </div>
          {isMyHero && isActive && (
            <HandCards cards={hero.hand || []} onPlay={onPlayCard} />
          )}
        </div>
      )}
    </div>
  )
}
