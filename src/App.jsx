import { useState } from 'react'
import Scene3D from './components/Scene3D'
import InputPanel from './components/InputPanel'
import Header from './components/Header'
import { LanguageProvider } from './i18n/LanguageContext'
import { fillPalletWithProducts, calculateTotalWeight } from './utils/palletStacking'

function AppContent() {
  const [packages, setPackages] = useState([])

  const handleFillPallet = (quantity) => {
    const placedPackages = fillPalletWithProducts(quantity)
    setPackages(placedPackages)
  }

  const handleClearPallet = () => {
    setPackages([])
  }

  const totalWeight = calculateTotalWeight(packages)

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900">
      {/* Header mit Language Switcher */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Linke Seite: Eingabemaske */}
        <div className="w-80 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
          <InputPanel
            packages={packages}
            onFillPallet={handleFillPallet}
            onClearPallet={handleClearPallet}
            totalWeight={totalWeight}
          />
        </div>

        {/* Rechte Seite: 3D-Visualisierung */}
        <div className="flex-1">
          <Scene3D packages={packages} />
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
