import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Line } from '@react-three/drei'
import Pallet from './Pallet'
import StackedPackage from './StackedPackage'
import { PALLET, CONTAINER_CONFIG } from '../utils/palletStacking'

// Container dimensions in mm (for backwards compatibility)
const CONTAINER_SIZES = {
  '20ft': { length: 5898, width: 2352 },
  '40ft': { length: 12032, width: 2352 }
}

// Overflow area visual indicator (for container overflow behind container)
function ContainerOverflowIndicator({ scale, containerType, hasOverflow }) {
  if (!hasOverflow || containerType === 'none') return null

  const config = CONTAINER_CONFIG[containerType]
  if (!config) return null

  const length = 1200 * scale
  const width = 800 * scale
  const overflowOffsetZ = (config.width + 500) * scale

  const x1 = 0
  const z1 = overflowOffsetZ
  const x2 = x1 + length
  const z2 = z1 + width

  const floorPoints = [
    [x1, 0.01, z1],
    [x2, 0.01, z1],
    [x2, 0.01, z2],
    [x1, 0.01, z2],
    [x1, 0.01, z1]
  ]

  return (
    <group>
      <Line
        points={floorPoints}
        color="#ef4444"
        lineWidth={3}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />
      <mesh
        position={[(x1 + x2) / 2, 0.005, (z1 + z2) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[length, width]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.15} side={2} />
      </mesh>
      {[[x1, z1], [x2, z1], [x2, z2], [x1, z2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}
    </group>
  )
}

// Single pallet overflow indicator (original behavior)
function SinglePalletOverflowIndicator({ scale, hasOverflow }) {
  if (!hasOverflow) return null

  const offsetX = 1500 * scale
  const length = 1200 * scale
  const width = 800 * scale

  const x1 = offsetX
  const z1 = 0
  const x2 = x1 + length
  const z2 = z1 + width

  const floorPoints = [
    [x1, 0.01, z1],
    [x2, 0.01, z1],
    [x2, 0.01, z2],
    [x1, 0.01, z2],
    [x1, 0.01, z1]
  ]

  return (
    <group>
      <Line
        points={floorPoints}
        color="#ef4444"
        lineWidth={3}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />
      <mesh
        position={[(x1 + x2) / 2, 0.005, (z1 + z2) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[length, width]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.15} side={2} />
      </mesh>
      {[[x1, z1], [x2, z1], [x2, z2], [x1, z2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}
    </group>
  )
}

// Container footprint visualization - enhanced for multi-pallet
function ContainerFootprint({ containerType, scale, pallets = [] }) {
  if (containerType === 'none' || !CONTAINER_SIZES[containerType]) {
    return null
  }

  const { length, width } = CONTAINER_SIZES[containerType]
  const scaledLength = length * scale
  const scaledWidth = width * scale

  // Container starts at origin
  const x1 = 0
  const z1 = 0
  const x2 = scaledLength
  const z2 = scaledWidth

  const floorPoints = [
    [x1, 0.01, z1],
    [x2, 0.01, z1],
    [x2, 0.01, z2],
    [x1, 0.01, z2],
    [x1, 0.01, z1]
  ]

  // Wall height visualization
  const wallHeight = 2.5 // 2.5m container internal height

  return (
    <group>
      {/* Container floor outline - solid prominent line */}
      <Line
        points={floorPoints}
        color="#3b82f6"
        lineWidth={4}
      />

      {/* Semi-transparent floor plane */}
      <mesh
        position={[(x1 + x2) / 2, 0.002, (z1 + z2) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[scaledLength, scaledWidth]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.05} side={2} />
      </mesh>

      {/* Container wall outlines (vertical edges) */}
      {[[x1, z1], [x2, z1], [x2, z2], [x1, z2]].map(([x, z], i) => (
        <group key={i}>
          <Line
            points={[[x, 0, z], [x, wallHeight, z]]}
            color="#3b82f6"
            lineWidth={2}
            dashed
            dashSize={0.3}
            gapSize={0.15}
          />
          <mesh position={[x, 0.02, z]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      ))}

      {/* Top frame of container */}
      <Line
        points={[
          [x1, wallHeight, z1],
          [x2, wallHeight, z1],
          [x2, wallHeight, z2],
          [x1, wallHeight, z2],
          [x1, wallHeight, z1]
        ]}
        color="#3b82f6"
        lineWidth={2}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />
    </group>
  )
}

// Height limit indicator plane - updated for pallet position
function HeightLimitIndicator({ maxHeightM, scale, palletPosition = { x: 0, z: 0 } }) {
  const palletHeightScaled = PALLET.height * scale
  const limitHeight = palletHeightScaled + (maxHeightM * 1000 * scale)

  const palletLength = PALLET.length * scale
  const palletWidth = PALLET.width * scale
  const offsetX = palletPosition.x * scale
  const offsetZ = palletPosition.z * scale

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
      <mesh
        position={[offsetX + palletLength / 2, limitHeight, offsetZ + palletWidth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[palletLength, palletWidth]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.08} side={2} />
      </mesh>
    </group>
  )
}

// Pallet with position offset
function PositionedPallet({ scale, position, index, isSelected }) {
  const x = position.x * scale
  const z = position.z * scale

  return (
    <group position={[x, 0, z]}>
      <Pallet scale={scale} />
      {/* Pallet index label indicator */}
      <mesh position={[PALLET.length * scale / 2, 0.02, PALLET.width * scale / 2]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#22c55e' : '#6b7280'}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}

function Scene3D({
  packages,
  overflowPackages = [],
  pallets = [],
  maxHeightLimit = 2.3,
  containerType = 'none',
  selectedPallet = null
}) {
  const scale = 0.01
  const isMultiPallet = containerType !== 'none' && pallets.length > 0

  // Calculate dynamic camera target based on scene content
  const cameraTarget = useMemo(() => {
    // Multi-pallet container mode
    if (isMultiPallet) {
      const config = CONTAINER_CONFIG[containerType]
      if (config) {
        // If a specific pallet is selected, focus on it
        if (selectedPallet !== null && pallets[selectedPallet]) {
          const pallet = pallets[selectedPallet]
          const x = (pallet.position.x + PALLET.length / 2) * scale
          const y = (PALLET.height + maxHeightLimit * 500) * scale
          const z = (pallet.position.z + PALLET.width / 2) * scale
          return [x, y, z]
        }

        // Otherwise, center on the container
        const centerX = (config.length / 2) * scale
        const centerY = 1.5 // Mid-height
        const centerZ = (config.width / 2) * scale
        return [centerX, centerY, centerZ]
      }
    }

    // Single pallet mode
    const allPackages = [...packages, ...overflowPackages]

    if (allPackages.length === 0) {
      return [PALLET.length * scale / 2, PALLET.height * scale + 0.5, PALLET.width * scale / 2]
    }

    // Calculate bounding box of all packages
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    for (const pkg of allPackages) {
      const pos = pkg.position
      const dim = pkg.dimensions

      const pkgMinX = (pos.x - dim.length / 2) * scale
      const pkgMaxX = (pos.x + dim.length / 2) * scale
      const pkgMinY = (pos.y - dim.height / 2) * scale
      const pkgMaxY = (pos.y + dim.height / 2) * scale
      const pkgMinZ = (pos.z - dim.width / 2) * scale
      const pkgMaxZ = (pos.z + dim.width / 2) * scale

      minX = Math.min(minX, pkgMinX)
      maxX = Math.max(maxX, pkgMaxX)
      minY = Math.min(minY, pkgMinY)
      maxY = Math.max(maxY, pkgMaxY)
      minZ = Math.min(minZ, pkgMinZ)
      maxZ = Math.max(maxZ, pkgMaxZ)
    }

    return [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2]
  }, [packages, overflowPackages, pallets, containerType, selectedPallet, isMultiPallet, scale, maxHeightLimit])

  // Calculate camera distance based on scene size
  const cameraDistance = useMemo(() => {
    if (isMultiPallet) {
      const config = CONTAINER_CONFIG[containerType]
      if (config) {
        // Base distance on container size
        const containerDiagonal = Math.sqrt(
          Math.pow(config.length * scale, 2) + Math.pow(config.width * scale, 2)
        )
        return Math.max(containerDiagonal * 1.2, 30)
      }
    }
    // Single pallet mode
    const hasOverflow = overflowPackages.length > 0
    return hasOverflow ? 30 : 20
  }, [containerType, isMultiPallet, overflowPackages.length, scale])

  const hasOverflow = overflowPackages.length > 0

  return (
    <Canvas
      camera={{ position: [cameraDistance, cameraDistance * 0.5, cameraDistance], fov: 50 }}
      className="w-full h-full"
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[30, 40, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-20, 20, -20]} intensity={0.3} />
      <hemisphereLight intensity={0.3} />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Floor Grid - larger for containers */}
      <Grid
        position={[0, -0.01, 0]}
        args={[120, 120]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#404040"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#606060"
        fadeDistance={100}
        fadeStrength={1}
      />

      {/* Container footprint */}
      <ContainerFootprint containerType={containerType} scale={scale} pallets={pallets} />

      {/* Render pallets and packages */}
      {isMultiPallet ? (
        // Multi-pallet mode: render each pallet at its position
        <>
          {pallets.map((pallet) => (
            <group key={`pallet-group-${pallet.index}`}>
              <PositionedPallet
                scale={scale}
                position={pallet.position}
                index={pallet.index}
                isSelected={selectedPallet === pallet.index}
              />
              <HeightLimitIndicator
                maxHeightM={maxHeightLimit}
                scale={scale}
                palletPosition={pallet.position}
              />
            </group>
          ))}

          {/* Packages are already positioned with pallet offsets */}
          {packages.map((pkg) => (
            <StackedPackage
              key={pkg.id}
              pkg={pkg}
              scale={scale}
              palletOffsetX={0}
              palletOffsetZ={0}
            />
          ))}

          {/* Container overflow indicator */}
          <ContainerOverflowIndicator
            scale={scale}
            containerType={containerType}
            hasOverflow={hasOverflow}
          />
        </>
      ) : (
        // Single pallet mode
        <>
          <Pallet scale={scale} position={[0, 0, 0]} />
          <HeightLimitIndicator maxHeightM={maxHeightLimit} scale={scale} />
          <SinglePalletOverflowIndicator scale={scale} hasOverflow={hasOverflow} />

          {packages.map((pkg) => (
            <StackedPackage
              key={pkg.id}
              pkg={pkg}
              scale={scale}
              palletOffsetX={0}
              palletOffsetZ={0}
            />
          ))}
        </>
      )}

      {/* Overflow packages (red stack) */}
      {overflowPackages.map((pkg) => (
        <StackedPackage
          key={`overflow-${pkg.id}`}
          pkg={pkg}
          scale={scale}
          palletOffsetX={0}
          palletOffsetZ={0}
        />
      ))}

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent camera going below floor
        target={cameraTarget}
      />
    </Canvas>
  )
}

export default Scene3D
