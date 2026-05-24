import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language

  const toggle = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <div className="flex rounded-lg border border-hogwarts-gold/30 overflow-hidden text-sm">
      {['it', 'en'].map((lang) => (
        <button
          key={lang}
          onClick={() => toggle(lang)}
          className={`px-2 py-1 uppercase font-semibold transition-colors ${
            current === lang
              ? 'bg-hogwarts-gold text-hogwarts-dark'
              : 'text-hogwarts-parchment/60 hover:text-hogwarts-parchment'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
