import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { api } from '../lib/api'
import LanguageToggle from '../components/ui/LanguageToggle'

const HEROES = ['harry', 'ron', 'hermione', 'neville']

export default function Lobby() {
  const { t } = useTranslation()
  const { user, signOut } = useAuthStore()
  const { room, setRoom } = useGameStore()

  const [unlockedAdventures, setUnlockedAdventures] = useState([1])

  useEffect(() => {
    api.getUnlockedAdventures().then(setUnlockedAdventures).catch(() => {})
  }, [])

  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [code, setCode] = useState('')
  const [adventure, setAdventure] = useState(1)
  const [language, setLanguage] = useState('it')
  const [selectedHero, setSelectedHero] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.createRoom(adventure, language)
      setRoom(r)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.joinRoom(code.toUpperCase())
      setRoom(r)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignHero = async () => {
    if (!selectedHero) return
    setLoading(true)
    try {
      await api.assignHeroes(room.code, { player_id: user.id, heroes: [selectedHero] })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    setLoading(true)
    try {
      await api.startGame(room.code)
      window.location.href = `/game/${room.code}`
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (room) {
    return (
      <div className="min-h-screen bg-hogwarts-dark text-hogwarts-parchment p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-magic text-hogwarts-gold">🏰 Hogwarts Battle</h1>
            <LanguageToggle />
          </div>

          <div className="bg-hogwarts-dark/50 border border-hogwarts-gold/30 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-hogwarts-parchment/60">{t('lobby.title')}</div>
                <div className="text-3xl font-mono font-bold text-hogwarts-gold tracking-widest">
                  {room.code}
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(room.code)}
                className="px-3 py-1 text-sm border border-hogwarts-gold/50 rounded hover:bg-hogwarts-gold/10"
              >
                {t('lobby.copyCode')}
              </button>
            </div>

            <div>
              <div className="text-sm text-hogwarts-parchment/60 mb-2">{t('lobby.heroSelect')}</div>
              <div className="grid grid-cols-4 gap-2">
                {HEROES.map((h) => (
                  <button
                    key={h}
                    onClick={() => setSelectedHero(h)}
                    className={`p-3 rounded-lg border text-sm capitalize transition-colors ${
                      selectedHero === h
                        ? 'border-hogwarts-gold bg-hogwarts-gold/20 text-hogwarts-gold'
                        : 'border-hogwarts-parchment/20 hover:border-hogwarts-gold/50'
                    }`}
                  >
                    {t(`heroes.${h}`)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAssignHero}
                disabled={!selectedHero || loading}
                className="mt-2 w-full py-2 bg-hogwarts-red text-white rounded-lg disabled:opacity-50"
              >
                {t('lobby.heroSelect')}
              </button>
            </div>

            {room.host_id === user.id && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full py-3 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg hover:bg-hogwarts-gold/90 disabled:opacity-50"
              >
                {t('lobby.start')}
              </button>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hogwarts-dark text-hogwarts-parchment p-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-magic text-hogwarts-gold">🏰 Hogwarts Battle</h1>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button onClick={signOut} className="text-sm text-hogwarts-parchment/60 hover:text-hogwarts-parchment">
              {t('auth.logout')}
            </button>
          </div>
        </div>

        <p className="text-hogwarts-parchment/70">
          {t('auth.welcome', { name: user?.user_metadata?.full_name || user?.email })}
        </p>

        {!mode && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('create')}
              className="py-4 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-xl hover:bg-hogwarts-gold/90"
            >
              {t('lobby.create')}
            </button>
            <button
              onClick={() => setMode('join')}
              className="py-4 border border-hogwarts-gold text-hogwarts-gold font-bold rounded-xl hover:bg-hogwarts-gold/10"
            >
              {t('lobby.join')}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-hogwarts-parchment/60">{t('lobby.adventure')}</label>
              <select
                value={adventure}
                onChange={(e) => setAdventure(Number(e.target.value))}
                className="w-full mt-1 bg-hogwarts-dark/50 border border-hogwarts-gold/30 rounded-lg p-2 text-hogwarts-parchment"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n} disabled={!unlockedAdventures.includes(n)}>
                    Adventure {n} {!unlockedAdventures.includes(n) ? '🔒' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-hogwarts-parchment/60">{t('lobby.language')}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-1 bg-hogwarts-dark/50 border border-hogwarts-gold/30 rounded-lg p-2 text-hogwarts-parchment"
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg disabled:opacity-50"
            >
              {t('lobby.create')}
            </button>
            <button onClick={() => setMode(null)} className="w-full text-sm text-hogwarts-parchment/60">
              ← indietro
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-hogwarts-parchment/60">{t('lobby.joinCode')}</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="w-full mt-1 bg-hogwarts-dark/50 border border-hogwarts-gold/30 rounded-lg p-2 text-hogwarts-parchment text-center text-2xl tracking-widest font-mono uppercase"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={code.length !== 6 || loading}
              className="w-full py-3 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg disabled:opacity-50"
            >
              {t('lobby.join')}
            </button>
            <button onClick={() => setMode(null)} className="w-full text-sm text-hogwarts-parchment/60">
              ← indietro
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  )
}
