import { useState } from 'react'
import Scene3D from './components/Scene3D'
import InputPanel from './components/InputPanel'
import Header from './components/Header'
import { LanguageProvider } from './i18n/LanguageContext'
import { fillPalletWithProducts } from './utils/palletStacking'

function AppContent() {
  const [packages, setPackages] = useState([])
  const [overflowPackages, setOverflowPackages] = useState([])
  const [pallets, setPallets] = useState([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalHeight, setTotalHeight] = useState(0)
  const [volumeUtilization, setVolumeUtilization] = useState(0)

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

  const handleFillPallet = (quantity) => {
    const result = fillPalletWithProducts(quantity, maxHeight, maxWeight, containerType)
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

      <div className="flex flex-1 overflow-hidden">
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
