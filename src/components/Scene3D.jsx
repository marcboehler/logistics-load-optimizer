import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Line } from '@react-three/drei'
import Pallet from './Pallet'
import StackedPackage from './StackedPackage'

// Container dimensions in mm
const CONTAINER_SIZES = {
  '20ft': { length: 5898, width: 2352 },
  '40ft': { length: 12032, width: 2352 }
}

// Container footprint visualization
function ContainerFootprint({ containerType, scale }) {
  if (containerType === 'none' || !CONTAINER_SIZES[containerType]) {
    return null
  }

  const { length, width } = CONTAINER_SIZES[containerType]
  const scaledLength = length * scale
  const scaledWidth = width * scale

  // Position container so pallet is at one end
  // Pallet is centered at origin, so container starts at pallet position
  const offsetX = -6 // Pallet center X offset
  const offsetZ = -4 // Pallet center Z offset

  // Container corners (pallet at the front-left corner of container)
  const x1 = offsetX - 6 // Start slightly before pallet
  const z1 = offsetZ - 4
  const x2 = x1 + scaledLength
  const z2 = z1 + scaledWidth

  const floorPoints = [
    [x1, 0.01, z1],
    [x2, 0.01, z1],
    [x2, 0.01, z2],
    [x1, 0.01, z2],
    [x1, 0.01, z1]
  ]

  return (
    <group>
      {/* Container floor outline - dashed line */}
      <Line
        points={floorPoints}
        color="#3b82f6"
        lineWidth={3}
        dashed
        dashSize={0.5}
        gapSize={0.25}
      />

      {/* Semi-transparent floor plane */}
      <mesh
        position={[(x1 + x2) / 2, 0.005, (z1 + z2) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[scaledLength, scaledWidth]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.08} side={2} />
      </mesh>

      {/* Container dimension labels using corner markers */}
      {[[x1, z1], [x2, z1], [x2, z2], [x1, z2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      ))}
    </group>
  )
}

// Height limit indicator plane
function HeightLimitIndicator({ maxHeightM, scale }) {
  const palletHeight = 144 * scale
  const limitHeight = palletHeight + (maxHeightM * 1000 * scale)

  const palletLength = 1200 * scale
  const palletWidth = 800 * scale
  const offsetX = -palletLength / 2
  const offsetZ = -palletWidth / 2

  const points = [
    [offsetX, limitHeight, offsetZ],
    [offsetX + palletLength, limitHeight, offsetZ],
    [offsetX + palletLength, limitHeight, offsetZ + palletWidth],
    [offsetX, limitHeight, offsetZ + palletWidth],
    [offsetX, limitHeight, offsetZ]
  ]

  return (
    <group>
      <Line
        points={points}
        color="#ef4444"
        lineWidth={2}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />

      <mesh position={[0, limitHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[palletLength, palletWidth]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.1} side={2} />
      </mesh>

      {[[offsetX, offsetZ], [offsetX + palletLength, offsetZ], [offsetX + palletLength, offsetZ + palletWidth], [offsetX, offsetZ + palletWidth]].map(([x, z], i) => (
        <Line
          key={i}
          points={[[x, palletHeight, z], [x, limitHeight, z]]}
          color="#ef4444"
          lineWidth={1}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />
      ))}
    </group>
  )
}

function Scene3D({ packages, maxHeightLimit = 2.3, containerType = 'none' }) {
  const scale = 0.01

  const palletOffsetX = -6
  const palletOffsetZ = -4

  // Pallet dimensions for default target calculation
  const palletLength = 1200 * scale
  const palletWidth = 800 * scale
  const palletHeight = 144 * scale

  // Calculate dynamic camera target based on actual stack geometry
  const cameraTarget = useMemo(() => {
    if (packages.length === 0) {
      // Default: center on pallet surface
      return [0, palletHeight + 0.5, 0]
    }

    // Calculate bounding box of all packages
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    for (const pkg of packages) {
      const pos = pkg.position
      const dim = pkg.dimensions

      // Convert to scene coordinates (scaled and offset)
      const pkgMinX = (pos.x - dim.length / 2) * scale + palletOffsetX
      const pkgMaxX = (pos.x + dim.length / 2) * scale + palletOffsetX
      const pkgMinY = pos.y * scale - (dim.height / 2) * scale
      const pkgMaxY = pos.y * scale + (dim.height / 2) * scale
      const pkgMinZ = (pos.z - dim.width / 2) * scale + palletOffsetZ
      const pkgMaxZ = (pos.z + dim.width / 2) * scale + palletOffsetZ

      minX = Math.min(minX, pkgMinX)
      maxX = Math.max(maxX, pkgMaxX)
      minY = Math.min(minY, pkgMinY)
      maxY = Math.max(maxY, pkgMaxY)
      minZ = Math.min(minZ, pkgMinZ)
      maxZ = Math.max(maxZ, pkgMaxZ)
    }

    // Geometric center of all packages
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2

    return [centerX, centerY, centerZ]
  }, [packages, scale, palletOffsetX, palletOffsetZ, palletHeight])

  // Adjust camera position based on container size
  const cameraDistance = containerType === '40ft' ? 35 : containerType === '20ft' ? 25 : 20

  return (
    <Canvas
      camera={{ position: [cameraDistance, 15, cameraDistance], fov: 50 }}
      className="w-full h-full"
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 15, -10]} intensity={0.3} />
      <hemisphereLight intensity={0.3} />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Floor Grid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#404040"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#606060"
        fadeDistance={80}
        fadeStrength={1}
      />

      {/* Container footprint */}
      <ContainerFootprint containerType={containerType} scale={scale} />

      {/* Euro Pallet: 1200x800x144mm */}
      <Pallet scale={scale} />

      {/* Height limit indicator */}
      <HeightLimitIndicator maxHeightM={maxHeightLimit} scale={scale} />

      {/* Packages on pallet */}
      {packages.map((pkg) => (
        <StackedPackage
          key={pkg.id}
          pkg={pkg}
          scale={scale}
          palletOffsetX={palletOffsetX}
          palletOffsetZ={palletOffsetZ}
        />
      ))}

      {/* Camera Controls - dynamic target based on stack geometry */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
        target={cameraTarget}
      />
    </Canvas>
  )
}

export default Scene3D
