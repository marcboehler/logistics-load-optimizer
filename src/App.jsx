import { useState } from 'react'
import Scene3D from './components/Scene3D'
import InputPanel from './components/InputPanel'
import Header from './components/Header'
import { LanguageProvider } from './i18n/LanguageContext'
import { fillPalletWithProducts } from './utils/palletStacking'

function AppContent() {
  const [packages, setPackages] = useState([])
  const [overflowPackages, setOverflowPackages] = useState([])
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalHeight, setTotalHeight] = useState(0)
  const [volumeUtilization, setVolumeUtilization] = useState(0)

  // Dynamic limits with defaults
  const [maxHeight, setMaxHeight] = useState(2.30) // meters
  const [maxWeight, setMaxWeight] = useState(700)  // kg

  // Container type: 'none', '20ft', '40ft'
  const [containerType, setContainerType] = useState('none')

  const handleFillPallet = (quantity) => {
    const result = fillPalletWithProducts(quantity, maxHeight, maxWeight)
    setPackages(result.packages)
    setOverflowPackages(result.overflowPackages || [])
    setTotalWeight(result.totalWeight)
    setTotalHeight(result.maxHeight)
    setVolumeUtilization(result.volumeUtilization)
  }

  const handleClearPallet = () => {
    setPackages([])
    setOverflowPackages([])
    setTotalWeight(0)
    setTotalHeight(0)
    setVolumeUtilization(0)
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900">
      {/* Header mit Language Switcher */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Linke Seite: Eingabemaske */}
        <div className="w-80 bg-gray-800 p-4 overflow-hidden border-r border-gray-700 flex flex-col">
          <InputPanel
            packages={packages}
            overflowPackages={overflowPackages}
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
          />
        </div>

        {/* Rechte Seite: 3D-Visualisierung */}
        <div className="flex-1">
          <Scene3D
            packages={packages}
            maxHeightLimit={maxHeight}
            containerType={containerType}
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
