import { useState, useEffect, useRef } from 'react'
import Scene3D from './components/Scene3D'
import InputPanel from './components/InputPanel'
import Header from './components/Header'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import { fillPalletWithProducts } from './utils/palletStacking'

// Loading overlay component
function LoadingOverlay({ isVisible }) {
  const { t } = useLanguage()

  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold text-white">{t('calculating') || 'BERECHNE BELADEPLAN...'}</p>
        <p className="text-sm text-gray-400 mt-2">{t('pleaseWait') || 'Bitte warten...'}</p>
      </div>
    </div>
  )
}

function AppContent() {
  const [packages, setPackages] = useState([])
  const [overflowPackages, setOverflowPackages] = useState([])
  const [pallets, setPallets] = useState([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalHeight, setTotalHeight] = useState(0)
  const [volumeUtilization, setVolumeUtilization] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)

  // Multi-pallet state
  const [totalPallets, setTotalPallets] = useState(0)
  const [maxPallets, setMaxPallets] = useState(1)
  const [containerUtilization, setContainerUtilization] = useState(0)
  const [selectedPallet, setSelectedPallet] = useState(null) // null = show all

  // Dynamic limits with defaults
  const [maxHeight, setMaxHeight] = useState(2.30) // meters
  const [maxWeight, setMaxWeight] = useState(700)  // kg

  // Container type: 'none', '20ft', '40ft'
  const [containerType, setContainerType] = useState('none')

  // Quantity state (lifted from InputPanel for reactive recalculation)
  const [quantity, setQuantity] = useState(500)

  // Track if initial load has happened (to avoid recalculating on mount)
  const hasLoadedRef = useRef(false)

  // REACTIVE: Recalculate when containerType changes (if packages exist)
  useEffect(() => {
    // Skip on initial mount
    if (!hasLoadedRef.current) {
      return
    }

    // Only recalculate if we have packages loaded
    if (packages.length > 0 || overflowPackages.length > 0) {
      // Trigger recalculation with current quantity
      handleFillPallet(quantity)
    }
  }, [containerType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFillPallet = (qty) => {
    // Mark that we've loaded at least once
    hasLoadedRef.current = true
    // Show loading overlay immediately
    setIsCalculating(true)

    // Use setTimeout to allow UI to render loading state before heavy calculation
    setTimeout(() => {
      try {
        const result = fillPalletWithProducts(qty, maxHeight, maxWeight, containerType)
        setPackages(result.packages)
        setOverflowPackages(result.overflowPackages || [])
        setPallets(result.pallets || [])
        setTotalWeight(result.totalWeight)
        setTotalHeight(result.maxHeight)
        setVolumeUtilization(result.volumeUtilization)
        setTotalPallets(result.totalPallets || 1)
        setMaxPallets(result.maxPallets || 1)
        setContainerUtilization(result.containerUtilization || 100)
        setSelectedPallet(null) // Reset to show all pallets
      } catch (error) {
        console.error('Error calculating pallet:', error)
      } finally {
        setIsCalculating(false)
      }
    }, 50) // Small delay to allow UI to update
  }

  const handleClearPallet = () => {
    setPackages([])
    setOverflowPackages([])
    setPallets([])
    setTotalWeight(0)
    setTotalHeight(0)
    setVolumeUtilization(0)
    setTotalPallets(0)
    setMaxPallets(1)
    setContainerUtilization(0)
    setSelectedPallet(null)
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900">
      {/* Header mit Language Switcher */}
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Loading Overlay */}
        <LoadingOverlay isVisible={isCalculating} />

        {/* Linke Seite: Eingabemaske */}
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700 flex flex-col">
          <InputPanel
            packages={packages}
            overflowPackages={overflowPackages}
            pallets={pallets}
            onFillPallet={handleFillPallet}
            onClearPallet={handleClearPallet}
            totalWeight={totalWeight}
            totalHeight={totalHeight}
            volumeUtilization={volumeUtilization}
            maxHeight={maxHeight}
            setMaxHeight={setMaxHeight}
            maxWeight={maxWeight}
            setMaxWeight={setMaxWeight}
            containerType={containerType}
            setContainerType={setContainerType}
            totalPallets={totalPallets}
            maxPallets={maxPallets}
            containerUtilization={containerUtilization}
            selectedPallet={selectedPallet}
            setSelectedPallet={setSelectedPallet}
            isCalculating={isCalculating}
            quantity={quantity}
            setQuantity={setQuantity}
          />
        </div>

        {/* Rechte Seite: 3D-Visualisierung */}
        <div className="flex-1">
          <Scene3D
            packages={packages}
            overflowPackages={overflowPackages}
            pallets={pallets}
            maxHeightLimit={maxHeight}
            containerType={containerType}
            selectedPallet={selectedPallet}
          />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
