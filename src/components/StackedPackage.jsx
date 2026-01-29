import * as THREE from 'three'

// Helper to desaturate a color for ghost mode
function desaturateColor(color) {
  // Convert to a pale grey with slight tint of original color
  // This makes background items less visually distracting
  return '#a0a0a0' // Neutral grey for all ghost items
}

function StackedPackage({ pkg, scale, palletOffsetX, palletOffsetZ, opacity = 1.0 }) {
  // Position from stacking algorithm (in mm, needs to be converted)
  const posX = (pkg.position.x * scale) + palletOffsetX
  const posY = pkg.position.y * scale
  const posZ = (pkg.position.z * scale) + palletOffsetZ

  // Dimensions from stacking algorithm
  const boxWidth = pkg.dimensions.length * scale   // X-Achse
  const boxHeight = pkg.dimensions.height * scale  // Y-Achse
  const boxDepth = pkg.dimensions.width * scale    // Z-Achse

  // Ghost mode: use unlit flat material for unfocused items
  const isGhost = opacity < 1.0
  const ghostOpacity = 0.08 // Slightly visible flat shape

  return (
    <group position={[posX, posY, posZ]}>
      {/* Paket-Körper - key forces re-render when switching materials */}
      <mesh key={isGhost ? 'ghost' : 'solid'} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        {isGhost ? (
          // Unlit flat material for background items (no shading noise)
          <meshBasicMaterial
            color={desaturateColor(pkg.color)}
            transparent={true}
            opacity={ghostOpacity}
            depthWrite={false}
          />
        ) : (
          // Full lit material for focused items
          <meshStandardMaterial
            color={pkg.color}
            roughness={0.7}
            metalness={0.1}
            transparent={true}
            opacity={opacity}
          />
        )}
      </mesh>

      {/* Kanten für bessere Sichtbarkeit */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
        <lineBasicMaterial
          color={isGhost ? '#808080' : '#000000'}
          transparent={true}
          opacity={isGhost ? ghostOpacity : 0.4}
          depthWrite={false}
        />
      </lineSegments>

      {/* Optional: Gewichtsanzeige als kleine Markierung oben (only when focused) */}
      {pkg.weight >= 10 && !isGhost && (
        <mesh position={[0, boxHeight / 2 + 0.05, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  )
}

export default StackedPackage
