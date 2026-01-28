import { useLanguage } from '../i18n/LanguageContext'

function Header() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-400">
        {t('appTitle')}
      </h1>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{t('language')}:</span>
        <div className="flex bg-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setLanguage('de')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              language === 'de'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            DE
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
