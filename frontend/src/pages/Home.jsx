import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import LanguageToggle from '../components/ui/LanguageToggle'

export default function Home() {
  const { t } = useTranslation()
  const { signInWithGoogle } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-hogwarts-dark text-hogwarts-parchment p-8">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-4xl font-magic font-bold text-hogwarts-gold">
            Hogwarts Battle
          </h1>
          <p className="mt-2 text-hogwarts-parchment/70">
            Harry Potter: Hogwarts Battle – Digital Edition
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-hogwarts-gold text-hogwarts-dark font-semibold rounded-lg hover:bg-hogwarts-gold/90 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
          {t('auth.login')}
        </button>
      </div>
    </div>
  )
}
