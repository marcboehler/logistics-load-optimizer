import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function InputPanel({
  packages,
  overflowPackages = [],
  pallets = [],
  onFillPallet,
  onClearPallet,
  totalWeight,
  totalHeight,
  volumeUtilization,
  maxHeight,
  setMaxHeight,
  maxWeight,
  setMaxWeight,
  containerType,
  setContainerType,
  totalPallets = 0,
  maxPallets = 1,
  containerUtilization = 0,
  selectedPallet,
  setSelectedPallet
}) {
  const { t } = useLanguage()
  const [quantity, setQuantity] = useState(500)

  const handleFillPallet = () => {
    onFillPallet(quantity)
  }

  const handlePrevPallet = () => {
    if (selectedPallet === null) {
      setSelectedPallet(totalPallets - 1)
    } else if (selectedPallet > 0) {
      setSelectedPallet(selectedPallet - 1)
    } else {
      setSelectedPallet(null) // Go back to "All"
    }
  }

  const handleNextPallet = () => {
    if (selectedPallet === null) {
      setSelectedPallet(0)
    } else if (selectedPallet < totalPallets - 1) {
      setSelectedPallet(selectedPallet + 1)
    } else {
      setSelectedPallet(null) // Go back to "All"
    }
  }

  // Calculate utilization percentages
  const weightUtilization = maxWeight > 0 ? (totalWeight / maxWeight) * 100 : 0
  const heightUtilization = maxHeight > 0 ? (totalHeight / (maxHeight * 1000)) * 100 : 0
  const isMultiPallet = containerType !== 'none' && totalPallets > 0

  return (
    <div className="text-white flex flex-col h-full">
      {/* Container Selection */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('containerType')}</h2>
        <select
          value={containerType}
          onChange={(e) => setContainerType(e.target.value)}
          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="none">{t('noContainer')}</option>
          <option value="20ft">{t('container20ft')}</option>
          <option value="40ft">{t('container40ft')}</option>
        </select>
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
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
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

      {/* Container Stats - only show when container is selected */}
      {isMultiPallet && (
        <div className="mb-4 p-3 bg-blue-900/40 rounded-lg border border-blue-700/50">
          <h2 className="text-sm font-semibold text-blue-300 mb-2">{t('container')}</h2>
          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div>
              <p className="text-lg font-bold text-blue-400">{totalPallets} / {maxPallets}</p>
              <p className="text-xs text-gray-400">{t('totalPallets')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-cyan-400">{containerUtilization.toFixed(0)}%</p>
              <p className="text-xs text-gray-400">{t('containerUtilization')}</p>
            </div>
          </div>

          {/* Pallet Selector */}
          {totalPallets > 1 && (
            <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
              <button
                onClick={handlePrevPallet}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                &lt; {t('prev')}
              </button>
              <span className="text-sm font-medium text-gray-300">
                {selectedPallet === null
                  ? t('allPallets')
                  : `${t('pallet')} ${selectedPallet + 1}`}
              </span>
              <button
                onClick={handleNextPallet}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                {t('next')} &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Badges */}
      <div className="mb-4 space-y-2">
        {/* Pallet Badge */}
        <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-sm font-semibold text-green-400">
                {isMultiPallet ? t('totalShipment') : t('pallet')}
              </span>
            </div>
            <span className="text-sm text-green-300">
              {totalWeight.toFixed(1)} {t('kg')} | {packages.length} {t('totalPackages')}
            </span>
          </div>
        </div>

        {/* Overflow Badge - only show when there are overflow packages */}
        {overflowPackages.length > 0 && (
          <div className="p-3 bg-red-900/30 rounded-lg border border-red-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-sm font-semibold text-red-400">{t('overflow')}</span>
              </div>
              <span className="text-sm text-red-300">
                {overflowPackages.length} {t('totalPackages')} (Red)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Stats */}
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
              background: 'linear-gradient(to right, rgb(224, 255, 240), rgb(144, 238, 144), rgb(60, 179, 113), rgb(34, 139, 34), rgb(0, 100, 0))'
            }}
          />
          <span className="text-xs text-gray-400">{t('heavy')}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 {t('kg')}</span>
          <span>20 {t('kg')}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF0000' }} />
          <span className="text-xs text-gray-400">{t('overflow')}</span>
        </div>
      </div>

      {/* Package List - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-300 mb-2 flex-shrink-0">
          {t('packageList')} ({packages.length}{overflowPackages.length > 0 ? ` + ${overflowPackages.length} ${t('overflow')}` : ''})
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-700/30 rounded-lg p-2">
          {packages.length === 0 && overflowPackages.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">
              {t('noPackages')}
            </p>
          ) : (
            <div className="space-y-1">
              {/* Placed packages */}
              {packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className="p-2 bg-gray-700 rounded text-xs flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: pkg.color }}
                  />
                  <span className="text-gray-500 flex-shrink-0 w-6">
                    {index + 1}.
                  </span>
                  <span className="text-gray-300 truncate flex-1" title={pkg.name}>
                    {pkg.name}
                  </span>
                  <span className="text-gray-500 flex-shrink-0 text-right w-14">
                    {pkg.weight} {t('kg')}
                  </span>
                  <span className="text-blue-400 flex-shrink-0 font-mono text-right w-14">
                    {pkg.cartonId}
                  </span>
                </div>
              ))}
              {/* Overflow packages (not placed) */}
              {overflowPackages.length > 0 && (
                <>
                  <div className="border-t border-red-500/30 my-2 pt-2">
                    <span className="text-xs text-red-400 font-semibold">{t('overflow')}:</span>
                  </div>
                  {overflowPackages.map((pkg, index) => (
                    <div
                      key={`overflow-${pkg.id}`}
                      className="p-2 bg-red-900/30 border border-red-500/30 rounded text-xs flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded flex-shrink-0"
                        style={{ backgroundColor: pkg.color }}
                      />
                      <span className="text-red-400 flex-shrink-0 w-6">
                        {packages.length + index + 1}.
                      </span>
                      <span className="text-red-300 truncate flex-1" title={pkg.name}>
                        {pkg.name}
                      </span>
                      <span className="text-red-400 flex-shrink-0 text-right w-14">
                        {pkg.weight} {t('kg')}
                      </span>
                      <span className="text-red-400 flex-shrink-0 font-mono text-right w-14">
                        {pkg.cartonId}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InputPanel
