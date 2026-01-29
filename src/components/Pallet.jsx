import * as THREE from 'three'

function Pallet({ scale = 0.01, opacity = 1.0 }) {
  // Europalette Maße in mm: 1200 x 800 x 144
  const palletWidth = 1200 * scale   // X-Achse (length)
  const palletDepth = 800 * scale    // Z-Achse (width)
  const palletHeight = 144 * scale   // Y-Achse

  const palletColor = '#8B7355'  // Holzfarbe
  const darkWood = '#6B5344'     // Dunklere Holzfarbe für Kontrast
  const ghostColor = '#a0a0a0'  // Neutral grey for ghost mode

  // Position pallet so its corner is at origin (0, 0, 0)
  // Box geometry is centered, so offset by half dimensions
  const offsetX = palletWidth / 2
  const offsetZ = palletDepth / 2

  // Ghost mode: use unlit flat material for unfocused items
  const isGhost = opacity < 1.0
  const ghostOpacity = 0.08 // Slightly visible flat shape

  return (
    <group position={[offsetX, palletHeight / 2, offsetZ]}>
      {/* Haupt-Palette - conditional material based on focus state */}
      <mesh castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
        {isGhost ? (
          // Unlit flat material for background pallets (no shading noise)
          <meshBasicMaterial
            color={ghostColor}
            transparent={true}
            opacity={ghostOpacity}
            depthWrite={false}
          />
        ) : (
          // Full lit material for focused pallets
          <meshStandardMaterial
            color={palletColor}
            roughness={0.8}
            transparent={true}
            opacity={opacity}
          />
        )}
      </mesh>

      {/* Kanten-Markierung für bessere Sichtbarkeit */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth)]} />
        <lineBasicMaterial
          color={isGhost ? '#808080' : darkWood}
          transparent={true}
          opacity={isGhost ? ghostOpacity : 1.0}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}

export default Pallet
