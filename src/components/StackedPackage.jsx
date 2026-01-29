import * as THREE from 'three'

function StackedPackage({ pkg, scale, palletOffsetX, palletOffsetZ, opacity = 1.0 }) {
  // Position from stacking algorithm (in mm, needs to be converted)
  const posX = (pkg.position.x * scale) + palletOffsetX
  const posY = pkg.position.y * scale
  const posZ = (pkg.position.z * scale) + palletOffsetZ

  // Dimensions from stacking algorithm
  const boxWidth = pkg.dimensions.length * scale   // X-Achse
  const boxHeight = pkg.dimensions.height * scale  // Y-Achse
  const boxDepth = pkg.dimensions.width * scale    // Z-Achse

  return (
    <group position={[posX, posY, posZ]}>
      {/* Paket-Körper */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshStandardMaterial
          color={pkg.color}
          roughness={0.7}
          metalness={0.1}
          transparent={true}
          opacity={opacity}
        />
      </mesh>

      {/* Kanten für bessere Sichtbarkeit */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
        <lineBasicMaterial color="#000000" transparent={true} opacity={0.4 * opacity} />
      </lineSegments>

      {/* Optional: Gewichtsanzeige als kleine Markierung oben */}
      {pkg.weight >= 10 && (
        <mesh position={[0, boxHeight / 2 + 0.05, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent={true} opacity={opacity} />
        </mesh>
      )}
    </group>
  )
}

export default StackedPackage
