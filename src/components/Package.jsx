import * as THREE from 'three'

function Package({
  length = 400,
  width = 400,
  height = 400,
  color = '#3b82f6',
  scale = 0.01,
  position = [0, 0, 0]
}) {
  // Umrechnung mm zu Three.js Einheiten
  const boxWidth = length * scale   // X-Achse (Länge)
  const boxHeight = height * scale  // Y-Achse (Höhe)
  const boxDepth = width * scale    // Z-Achse (Breite)

  return (
    <group position={position}>
      {/* Paket als Würfel */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Kanten für bessere Sichtbarkeit */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
        <lineBasicMaterial color="#000000" opacity={0.3} transparent />
      </lineSegments>
    </group>
  )
}

export default Package
