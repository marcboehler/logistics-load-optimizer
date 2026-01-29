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

  // Determine if this is a ghost (unfocused) pallet
  const isFocused = opacity >= 1.0

  // NUCLEAR FIX: Completely separate rendering paths
  if (isFocused) {
    // === FOCUSED RENDERING: Full quality with lighting ===
    return (
      <group position={[offsetX, palletHeight / 2, offsetZ]}>
        <mesh key="focused-pallet" castShadow receiveShadow>
          <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
          <meshStandardMaterial color={palletColor} roughness={0.8} />
        </mesh>
        {/* High-quality edges for focused pallets */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth)]} />
          <lineBasicMaterial color={darkWood} />
        </lineSegments>
      </group>
    )
  } else {
    // === GHOST RENDERING: Flat unlit, no edges, minimal ===
    return (
      <group position={[offsetX, palletHeight / 2, offsetZ]}>
        <mesh key="ghost-pallet">
          <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
          <meshBasicMaterial
            color="#808080"
            transparent={true}
            opacity={0.05}
            depthWrite={false}
          />
        </mesh>
        {/* NO edges for ghost pallets - keeps it clean */}
      </group>
    )
  }
}

export default Pallet
