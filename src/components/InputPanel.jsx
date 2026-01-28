import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function InputPanel({ packages, onFillPallet, onClearPallet, totalWeight }) {
  const { t } = useLanguage()
  const [quantity, setQuantity] = useState(10)

  const handleFillPallet = () => {
    onFillPallet(quantity)
  }

  return (
    <div className="text-white">
      {/* Paletten-Info */}
      <div className="mb-6 p-3 bg-gray-700 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('palletInfo')}</h2>
        <div className="text-xs text-gray-400 space-y-1">
          <p>{t('length')}: 1200 {t('mm')}</p>
          <p>{t('width')}: 800 {t('mm')}</p>
          <p>{t('height')}: 144 {t('mm')}</p>
        </div>
      </div>

      {/* Fill Pallet Section */}
      <div className="mb-6 p-4 bg-gray-700/80 rounded-lg border border-gray-600">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">{t('fillPallet')}</h2>

        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">
            {t('quantity')}
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            min="1"
            max="50"
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFillPallet}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            {t('fillPallet')}
          </button>
          <button
            onClick={onClearPallet}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
          >
            {t('clearPallet')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 p-3 bg-blue-900/30 rounded-lg border border-blue-800/50">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{packages.length}</p>
            <p className="text-xs text-gray-400">{t('totalPackages')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{totalWeight.toFixed(1)}</p>
            <p className="text-xs text-gray-400">{t('totalWeight')} ({t('kg')})</p>
          </div>
        </div>
      </div>

      {/* Paketliste */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">
          {t('packagesOnPallet')} ({packages.length})
        </h2>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-2 bg-gray-700 rounded text-xs flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded flex-shrink-0"
                style={{ backgroundColor: pkg.color }}
              />
              <span className="text-gray-300 truncate flex-1" title={pkg.name}>
                {pkg.name}
              </span>
              <span className="text-gray-500 flex-shrink-0">
                {pkg.weight}{t('kg')}
              </span>
            </div>
          ))}
          {packages.length === 0 && (
            <p className="text-xs text-gray-500 italic py-2">
              {t('quantity')}: 0
            </p>
          )}
        </div>
      </div>

      {/* Anleitung */}
      <div className="p-3 bg-gray-700/50 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('controls')}</h2>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• {t('leftMouse')}</li>
          <li>• {t('rightMouse')}</li>
          <li>• {t('scroll')}</li>
        </ul>
      </div>
    </div>
  )
}

export default InputPanel
