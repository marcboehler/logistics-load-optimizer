import * as THREE from 'three'
import { Select } from '@react-three/postprocessing'

function StackedPackage({ pkg, scale, palletOffsetX, palletOffsetZ, opacity = 1.0, isGhost = false }) {
  // Position from stacking algorithm (in mm, needs to be converted)
  const posX = (pkg.position.x * scale) + palletOffsetX
  const posY = pkg.position.y * scale
  const posZ = (pkg.position.z * scale) + palletOffsetZ

  // Dimensions from stacking algorithm
  const boxWidth = pkg.dimensions.length * scale
  const boxHeight = pkg.dimensions.height * scale
  const boxDepth = pkg.dimensions.width * scale

  if (!isGhost) {
    // === FOCUSED RENDERING: Full quality with lighting ===
    return (
      <group position={[posX, posY, posZ]}>
        <mesh key="focused-pkg" castShadow receiveShadow>
          <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
          <meshStandardMaterial
            color={pkg.color}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
          <lineBasicMaterial color="#000000" opacity={0.4} transparent />
        </lineSegments>
        {pkg.weight >= 10 && (
          <mesh position={[0, boxHeight / 2 + 0.05, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        )}
      </group>
    )
  } else {
    // === GHOST RENDERING: 0% opacity but visible for outline detection ===
    return (
      <Select enabled>
        <group position={[posX, posY, posZ]}>
          <mesh key="ghost-pkg">
            <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
            <meshBasicMaterial
              color="#808080"
              transparent={true}
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Select>
    )
  }
}

export default StackedPackage
