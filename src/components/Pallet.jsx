import { useMemo } from 'react'

function Pallet({ scale = 0.01 }) {
  // Europalette Maße in mm: 1200 x 800 x 144
  const palletWidth = 1200 * scale   // X-Achse
  const palletDepth = 800 * scale    // Z-Achse
  const palletHeight = 144 * scale   // Y-Achse

  const palletColor = '#8B7355'  // Holzfarbe
  const darkWood = '#6B5344'     // Dunklere Holzfarbe für Kontrast

  return (
    <group position={[0, palletHeight / 2, 0]}>
      {/* Haupt-Palette als vereinfachter Würfel */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
        <meshStandardMaterial color={palletColor} roughness={0.8} />
      </mesh>

      {/* Kanten-Markierung für bessere Sichtbarkeit */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth)]} />
        <lineBasicMaterial color={darkWood} />
      </lineSegments>

      {/* Maßangaben-Text (optional, als Label) */}
      <mesh position={[0, palletHeight / 2 + 0.1, 0]}>
        {/* Oberfläche der Palette - leicht erhöht für visuelle Trennung */}
      </mesh>
    </group>
  )
}

// THREE muss importiert werden für EdgesGeometry
import * as THREE from 'three'

export default Pallet
