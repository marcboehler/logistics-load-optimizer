import * as THREE from 'three'

function Pallet({ scale = 0.01, opacity = 1.0 }) {
  // Europalette Maße in mm: 1200 x 800 x 144
  const palletWidth = 1200 * scale
  const palletDepth = 800 * scale
  const palletHeight = 144 * scale

  const palletColor = '#8B7355'
  const darkWood = '#6B5344'

  // Position pallet so its corner is at origin
  const offsetX = palletWidth / 2
  const offsetZ = palletDepth / 2

  // DIAGNOSTIC: FORCE GHOST MODE FOR ALL PALLETS
  const isActuallyGhost = true // KILL SWITCH - forces ghost for everyone

  if (!isActuallyGhost) {
    // === FOCUSED RENDERING: Full quality with lighting ===
    return (
      <group position={[offsetX, palletHeight / 2, offsetZ]}>
        <mesh key="focused-pallet" castShadow receiveShadow>
          <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
          <meshStandardMaterial color={palletColor} roughness={0.8} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth)]} />
          <lineBasicMaterial color={darkWood} />
        </lineSegments>
      </group>
    )
  } else {
    // === DIAGNOSTIC GHOST: MAGENTA TO PROVE THIS PATH WORKS ===
    return (
      <group position={[offsetX, palletHeight / 2, offsetZ]}>
        <mesh key="diagnostic-ghost-pallet">
          <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
          <meshBasicMaterial
            color="#ff00ff"
            transparent={true}
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
      </group>
    )
  }
}

export default Pallet
