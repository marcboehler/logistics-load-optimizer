import { useState } from 'react'

function InputPanel({ onAddPackage, packages }) {
  const [formData, setFormData] = useState({
    length: 400,
    width: 400,
    height: 400,
    weight: 10
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onAddPackage(formData)
    setFormData({
      length: 400,
      width: 400,
      height: 400,
      weight: 10
    })
  }

  return (
    <div className="text-white">
      <h1 className="text-xl font-bold mb-6 text-blue-400">
        Logistics Load Optimizer
      </h1>

      {/* Paletten-Info */}
      <div className="mb-6 p-3 bg-gray-700 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Europalette</h2>
        <div className="text-xs text-gray-400 space-y-1">
          <p>Länge: 1200 mm</p>
          <p>Breite: 800 mm</p>
          <p>Höhe: 144 mm</p>
        </div>
      </div>

      {/* Eingabeformular */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Neues Paket hinzufügen</h2>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Länge (mm)
          </label>
          <input
            type="number"
            name="length"
            value={formData.length}
            onChange={handleChange}
            min="1"
            max="1200"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Breite (mm)
          </label>
          <input
            type="number"
            name="width"
            value={formData.width}
            onChange={handleChange}
            min="1"
            max="800"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Höhe (mm)
          </label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            min="1"
            max="2000"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Gewicht (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            min="0.1"
            step="0.1"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Paket hinzufügen
        </button>
      </form>

      {/* Paketliste */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">
          Pakete auf Palette ({packages.length})
        </h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="p-2 bg-gray-700 rounded text-xs flex items-center gap-2"
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: pkg.color }}
              />
              <span className="text-gray-300">
                {pkg.length}x{pkg.width}x{pkg.height} mm, {pkg.weight} kg
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Anleitung */}
      <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Steuerung</h2>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Linke Maustaste: Drehen</li>
          <li>• Rechte Maustaste: Verschieben</li>
          <li>• Mausrad: Zoomen</li>
        </ul>
      </div>
    </div>
  )
}

export default InputPanel
