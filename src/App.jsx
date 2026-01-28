import { useState } from 'react'
import Scene3D from './components/Scene3D'
import InputPanel from './components/InputPanel'

function App() {
  const [packages, setPackages] = useState([
    { id: 1, length: 400, width: 400, height: 400, weight: 10, color: '#3b82f6' }
  ])

  const addPackage = (newPackage) => {
    setPackages([...packages, {
      ...newPackage,
      id: Date.now(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }])
  }

  return (
    <div className="flex h-screen w-screen bg-gray-900">
      {/* Linke Seite: Eingabemaske */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
        <InputPanel onAddPackage={addPackage} packages={packages} />
      </div>

      {/* Rechte Seite: 3D-Visualisierung */}
      <div className="flex-1">
        <Scene3D packages={packages} />
      </div>
    </div>
  )
}

export default App
