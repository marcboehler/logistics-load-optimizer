import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function InputPanel({
  packages,
  onFillPallet,
  onClearPallet,
  totalWeight,
  totalHeight,
  volumeUtilization,
  maxHeight,
  setMaxHeight,
  maxWeight,
  setMaxWeight
}) {
  const { t } = useLanguage()
  const [quantity, setQuantity] = useState(10)

  const handleFillPallet = () => {
    onFillPallet(quantity)
  }

  // Calculate utilization percentages
  const weightUtilization = maxWeight > 0 ? (totalWeight / maxWeight) * 100 : 0
  const heightUtilization = maxHeight > 0 ? (totalHeight / (maxHeight * 1000)) * 100 : 0

  return (
    <div className="text-white">
      {/* Paletten-Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('palletInfo')}</h2>
        <div className="text-xs text-gray-400 space-y-1">
          <p>{t('length')}: 1200 {t('mm')}</p>
          <p>{t('width')}: 800 {t('mm')}</p>
          <p>{t('height')}: 144 {t('mm')}</p>
        </div>
      </div>

      {/* Limits Section */}
      <div className="mb-4 p-4 bg-gray-700/80 rounded-lg border border-gray-600">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">{t('limits')}</h2>

        {/* Height Limit Slider */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">{t('maxHeight')}</label>
            <span className="text-sm font-medium text-blue-400">{maxHeight.toFixed(2)} {t('meter')}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.3"
            step="0.05"
            value={maxHeight}
            onChange={(e) => setMaxHeight(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5m</span>
            <span>2.3m</span>
          </div>
        </div>

        {/* Weight Limit Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">{t('maxWeight')}</label>
            <span className="text-sm font-medium text-green-400">{maxWeight} {t('kg')}</span>
          </div>
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={maxWeight}
            onChange={(e) => setMaxWeight(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100kg</span>
            <span>1500kg</span>
          </div>
        </div>
      </div>

      {/* Fill Pallet Section */}
      <div className="mb-4 p-4 bg-gray-700/80 rounded-lg border border-gray-600">
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
      <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-800/50">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-xl font-bold text-blue-400">{packages.length}</p>
            <p className="text-xs text-gray-400">{t('totalPackages')}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-400">{totalWeight.toFixed(1)}</p>
            <p className="text-xs text-gray-400">{t('kg')}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-400">{(totalHeight / 1000).toFixed(2)}</p>
            <p className="text-xs text-gray-400">{t('meter')}</p>
          </div>
        </div>

        {/* Utilization Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{t('volumeUtilization')}</span>
              <span className="font-semibold text-purple-400">{volumeUtilization.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(volumeUtilization, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{t('weightUtilization')}</span>
              <span>{weightUtilization.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${Math.min(weightUtilization, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{t('heightUtilization')}</span>
              <span>{heightUtilization.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(heightUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('legend')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{t('light')}</span>
          <div
            className="flex-1 h-4 rounded"
            style={{
              background: 'linear-gradient(to right, rgb(255, 255, 224), rgb(255, 200, 100), rgb(255, 140, 50), rgb(200, 50, 0), rgb(139, 0, 0))'
            }}
          />
          <span className="text-xs text-gray-400">{t('heavy')}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 {t('kg')}</span>
          <span>20 {t('kg')}</span>
        </div>
      </div>

      {/* Paketliste */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">
          {t('packagesOnPallet')} ({packages.length})
        </h2>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
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
