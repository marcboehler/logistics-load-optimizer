import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Line, Text } from '@react-three/drei'
import Pallet from './Pallet'
import StackedPackage from './StackedPackage'
import { PALLET, CONTAINER_CONFIG } from '../utils/palletStacking'

// Performance threshold for overflow rendering
const MAX_VISIBLE_OVERFLOW = 50

// Container dimensions in mm (for backwards compatibility)
const CONTAINER_SIZES = {
  '20ft': { length: 5898, width: 2352 },
  '40ft': { length: 12032, width: 2352 }
}

/**
 * Calculate scene bounding box from all packages and pallets
 * When overflow exceeds threshold, uses placeholder height instead of all overflow items
 */
const calculateSceneBounds = (packages, overflowPackages, pallets, containerType, scale, maxHeightLimit = 2.3) => {
  let minX = 0, maxX = PALLET.length * scale
  let minY = 0, maxY = (PALLET.height + 500) * scale
  let minZ = 0, maxZ = PALLET.width * scale

  // Include container bounds
  if (containerType !== 'none' && CONTAINER_SIZES[containerType]) {
    const container = CONTAINER_SIZES[containerType]
    maxX = Math.max(maxX, container.length * scale)
    maxZ = Math.max(maxZ, container.width * scale)
  }

  // Include pallet packages (always rendered individually)
  for (const pkg of packages) {
    if (!pkg.position || !pkg.dimensions) continue

    const halfL = (pkg.dimensions.length / 2) * scale
    const halfH = (pkg.dimensions.height / 2) * scale
    const halfW = (pkg.dimensions.width / 2) * scale

    const posX = pkg.position.x * scale
    const posY = pkg.position.y * scale
    const posZ = pkg.position.z * scale

    minX = Math.min(minX, posX - halfL)
    maxX = Math.max(maxX, posX + halfL)
    minY = Math.min(minY, posY - halfH)
    maxY = Math.max(maxY, posY + halfH)
    minZ = Math.min(minZ, posZ - halfW)
    maxZ = Math.max(maxZ, posZ + halfW)
  }

  // Handle overflow bounds based on whether we use placeholder or individual items
  if (overflowPackages.length > 0) {
    const useOverflowPlaceholder = overflowPackages.length > MAX_VISIBLE_OVERFLOW
    const config = CONTAINER_CONFIG[containerType]

    // Calculate overflow area position
    let overflowOffsetX = 0
    let overflowOffsetZ = 0
    if (config) {
      overflowOffsetZ = (config.width + 500) * scale
    } else {
      overflowOffsetX = (PALLET.length + 300) * scale
    }

    if (useOverflowPlaceholder) {
      // Use placeholder dimensions for bounds calculation
      const placeholderWidth = PALLET.length * scale
      const placeholderDepth = PALLET.width * scale
      const placeholderHeight = maxHeightLimit * 1.5 // Same as OverflowPlaceholder

      maxX = Math.max(maxX, overflowOffsetX + placeholderWidth)
      maxY = Math.max(maxY, placeholderHeight)
      maxZ = Math.max(maxZ, overflowOffsetZ + placeholderDepth)
    } else {
      // Include individual overflow packages
      for (const pkg of overflowPackages) {
        if (!pkg.position || !pkg.dimensions) continue

        const halfL = (pkg.dimensions.length / 2) * scale
        const halfH = (pkg.dimensions.height / 2) * scale
        const halfW = (pkg.dimensions.width / 2) * scale

        const posX = pkg.position.x * scale
        const posY = pkg.position.y * scale
        const posZ = pkg.position.z * scale

        minX = Math.min(minX, posX - halfL)
        maxX = Math.max(maxX, posX + halfL)
        minY = Math.min(minY, posY - halfH)
        maxY = Math.max(maxY, posY + halfH)
        minZ = Math.min(minZ, posZ - halfW)
        maxZ = Math.max(maxZ, posZ + halfW)
      }
    }
  }

  // Include pallet positions
  for (const pallet of pallets) {
    if (!pallet.position) continue
    const px = pallet.position.x * scale
    const pz = pallet.position.z * scale
    minX = Math.min(minX, px)
    maxX = Math.max(maxX, px + PALLET.length * scale)
    minZ = Math.min(minZ, pz)
    maxZ = Math.max(maxZ, pz + PALLET.width * scale)
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    },
    size: {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ
    }
  }
}

/**
 * Camera controller that auto-fits to scene bounds
 */
function CameraController({ bounds, selectedPallet, pallets, scale }) {
  const { camera } = useThree()
  const controlsRef = useRef()

  useEffect(() => {
    if (!bounds) return

    // Calculate camera position to fit entire scene
    const maxDimension = Math.max(bounds.size.x, bounds.size.y, bounds.size.z)
    const fov = 50 * (Math.PI / 180)
    const cameraDistance = (maxDimension / 2) / Math.tan(fov / 2) * 1.5

    // If a specific pallet is selected, focus on it
    let target = bounds.center
    let distance = Math.max(cameraDistance, 15)

    if (selectedPallet !== null && pallets[selectedPallet]) {
      const pallet = pallets[selectedPallet]
      target = {
        x: (pallet.position.x + PALLET.length / 2) * scale,
        y: PALLET.height * scale + 1,
        z: (pallet.position.z + PALLET.width / 2) * scale
      }
      distance = 25 // Closer for single pallet focus
    }

    // Update camera position
    const angle = Math.PI / 4 // 45 degrees
    camera.position.set(
      target.x + distance * Math.cos(angle),
      target.y + distance * 0.6,
      target.z + distance * Math.sin(angle)
    )
    camera.lookAt(target.x, target.y, target.z)
    camera.updateProjectionMatrix()
  }, [bounds, selectedPallet, pallets, scale, camera])

  return null
}

// Dynamic ground grid that expands based on scene size
function DynamicGrid({ bounds }) {
  const gridSize = useMemo(() => {
    if (!bounds) return 60

    const maxDim = Math.max(bounds.size.x, bounds.size.z)
    // Round up to nearest 20 and add padding
    return Math.ceil((maxDim + 20) / 20) * 20
  }, [bounds])

  const gridCenter = useMemo(() => {
    if (!bounds) return [0, 0]
    return [bounds.center.x, bounds.center.z]
  }, [bounds])

  return (
    <Grid
      position={[gridCenter[0], -0.01, gridCenter[1]]}
      args={[gridSize * 2, gridSize * 2]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#404040"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#606060"
      fadeDistance={gridSize * 1.5}
      fadeStrength={1}
    />
  )
}

// Overflow area visual indicator (for container overflow behind container)
function ContainerOverflowIndicator({ scale, containerType, hasOverflow }) {
  if (!hasOverflow || containerType === 'none') return null

  const config = CONTAINER_CONFIG[containerType]
  if (!config) return null

  const length = PALLET.length * scale
  const width = PALLET.width * scale
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
      <Line points={floorPoints} color="#ef4444" lineWidth={3} dashed dashSize={0.3} gapSize={0.15} />
      <mesh position={[(x1 + x2) / 2, 0.005, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
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

// No-container mode overflow indicator (beside the single pallet)
function NoContainerOverflowIndicator({ scale, hasOverflow }) {
  if (!hasOverflow) return null

  // Position beside single pallet (1500mm = pallet length 1200mm + 300mm gap)
  const offsetX = (PALLET.length + 300) * scale

  const length = PALLET.length * scale
  const width = PALLET.width * scale

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
      <Line points={floorPoints} color="#ef4444" lineWidth={3} dashed dashSize={0.3} gapSize={0.15} />
      <mesh position={[(x1 + x2) / 2, 0.005, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
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

// Container footprint visualization
function ContainerFootprint({ containerType, scale }) {
  if (containerType === 'none' || !CONTAINER_SIZES[containerType]) {
    return null
  }

  const { length, width } = CONTAINER_SIZES[containerType]
  const scaledLength = length * scale
  const scaledWidth = width * scale

  const x1 = 0
  const z1 = 0
  const x2 = scaledLength
  const z2 = scaledWidth
  const wallHeight = 2.5

  const floorPoints = [
    [x1, 0.01, z1],
    [x2, 0.01, z1],
    [x2, 0.01, z2],
    [x1, 0.01, z2],
    [x1, 0.01, z1]
  ]

  return (
    <group>
      <Line points={floorPoints} color="#3b82f6" lineWidth={4} />
      <mesh position={[(x1 + x2) / 2, 0.002, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[scaledLength, scaledWidth]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.05} side={2} />
      </mesh>
      {[[x1, z1], [x2, z1], [x2, z2], [x1, z2]].map(([x, z], i) => (
        <group key={i}>
          <Line points={[[x, 0, z], [x, wallHeight, z]]} color="#3b82f6" lineWidth={2} dashed dashSize={0.3} gapSize={0.15} />
          <mesh position={[x, 0.02, z]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      ))}
      <Line
        points={[[x1, wallHeight, z1], [x2, wallHeight, z1], [x2, wallHeight, z2], [x1, wallHeight, z2], [x1, wallHeight, z1]]}
        color="#3b82f6"
        lineWidth={2}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />
    </group>
  )
}

// Height limit indicator plane
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
      <Line points={points} color="#ef4444" lineWidth={2} dashed dashSize={0.3} gapSize={0.15} />
      <mesh position={[offsetX + palletLength / 2, limitHeight, offsetZ + palletWidth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
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
      <mesh position={[PALLET.length * scale / 2, 0.02, PALLET.width * scale / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color={isSelected ? '#22c55e' : '#6b7280'} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// Large overflow placeholder (performance optimization)
function OverflowPlaceholder({ scale, containerType, overflowCount, maxHeightM }) {
  const config = CONTAINER_CONFIG[containerType]

  // Calculate position (same as overflow area)
  let offsetX = 0
  let offsetZ = 0

  if (config) {
    // Container mode: behind container
    offsetZ = (config.width + 500) * scale
  } else {
    // No-container mode: beside pallet
    offsetX = (PALLET.length + 300) * scale
  }

  // Placeholder dimensions
  const width = PALLET.length * scale
  const depth = PALLET.width * scale
  const height = maxHeightM * 1.5 // 1.5x max stack height

  const centerX = offsetX + width / 2
  const centerY = height / 2
  const centerZ = offsetZ + depth / 2

  // Text positioning - three-line block above the box
  const textBaseY = height + 0.3
  const largeFontSize = 1.2 // Large number font
  const smallFontSize = 0.35 // Small label font
  const lineSpacing = 0.15

  return (
    <group>
      {/* Large red placeholder box */}
      <mesh position={[centerX, centerY, centerZ]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#FF0000" transparent opacity={0.8} />
      </mesh>

      {/* Edge lines for visibility */}
      <lineSegments position={[centerX, centerY, centerZ]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#990000" linewidth={2} />
      </lineSegments>

      {/* Three-line text block above the box */}
      {/* Line 1: "OVERFLOW:" label (top) */}
      <Text
        position={[centerX, textBaseY + largeFontSize + smallFontSize + lineSpacing * 2, centerZ]}
        fontSize={smallFontSize}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
        font="/fonts/Inter-Bold.woff"
      >
        OVERFLOW:
      </Text>

      {/* Line 2: The big number (middle) */}
      <Text
        position={[centerX, textBaseY + smallFontSize + lineSpacing, centerZ]}
        fontSize={largeFontSize}
        color="#FFFF00"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#000000"
        font="/fonts/Inter-Bold.woff"
      >
        {overflowCount.toLocaleString()}
      </Text>

      {/* Line 3: "ITEMS" label (bottom) */}
      <Text
        position={[centerX, textBaseY, centerZ]}
        fontSize={smallFontSize}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
        font="/fonts/Inter-Bold.woff"
      >
        ITEMS
      </Text>
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
  const hasOverflow = overflowPackages.length > 0
  const useOverflowPlaceholder = overflowPackages.length > MAX_VISIBLE_OVERFLOW

  // Calculate scene bounding box for camera and grid
  const bounds = useMemo(() => {
    return calculateSceneBounds(packages, overflowPackages, pallets, containerType, scale, maxHeightLimit)
  }, [packages, overflowPackages, pallets, containerType, scale, maxHeightLimit])

  // Calculate camera target
  const cameraTarget = useMemo(() => {
    if (selectedPallet !== null && pallets[selectedPallet]) {
      const pallet = pallets[selectedPallet]
      return [
        (pallet.position.x + PALLET.length / 2) * scale,
        PALLET.height * scale + 1,
        (pallet.position.z + PALLET.width / 2) * scale
      ]
    }
    return [bounds.center.x, bounds.center.y, bounds.center.z]
  }, [bounds, selectedPallet, pallets, scale])

  // Calculate initial camera distance
  const initialDistance = useMemo(() => {
    const maxDim = Math.max(bounds.size.x, bounds.size.y, bounds.size.z)
    return Math.max(maxDim * 2, 20)
  }, [bounds])

  return (
    <Canvas
      camera={{ position: [initialDistance, initialDistance * 0.6, initialDistance], fov: 50 }}
      className="w-full h-full"
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[30, 40, 30]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[-20, 20, -20]} intensity={0.3} />
      <hemisphereLight intensity={0.3} />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Dynamic Ground Grid */}
      <DynamicGrid bounds={bounds} />

      {/* Camera Controller for auto-zoom */}
      <CameraController bounds={bounds} selectedPallet={selectedPallet} pallets={pallets} scale={scale} />

      {/* Container footprint */}
      <ContainerFootprint containerType={containerType} scale={scale} />

      {/* Render pallets and packages */}
      {pallets.length > 0 ? (
        <>
          {pallets.map((pallet) => (
            <group key={`pallet-group-${pallet.index}`}>
              <PositionedPallet scale={scale} position={pallet.position} index={pallet.index} isSelected={selectedPallet === pallet.index} />
              <HeightLimitIndicator maxHeightM={maxHeightLimit} scale={scale} palletPosition={pallet.position} />
            </group>
          ))}
          {packages.map((pkg) => (
            <StackedPackage key={pkg.id} pkg={pkg} scale={scale} palletOffsetX={0} palletOffsetZ={0} />
          ))}
          {containerType !== 'none' ? (
            <ContainerOverflowIndicator scale={scale} containerType={containerType} hasOverflow={hasOverflow} />
          ) : (
            <NoContainerOverflowIndicator scale={scale} hasOverflow={hasOverflow} />
          )}
        </>
      ) : (
        <>
          <Pallet scale={scale} />
          <HeightLimitIndicator maxHeightM={maxHeightLimit} scale={scale} />
          <NoContainerOverflowIndicator scale={scale} hasOverflow={hasOverflow} />
          {packages.map((pkg) => (
            <StackedPackage key={pkg.id} pkg={pkg} scale={scale} palletOffsetX={0} palletOffsetZ={0} />
          ))}
        </>
      )}

      {/* Overflow packages (red stack) - use placeholder for performance when count > threshold */}
      {hasOverflow && (
        useOverflowPlaceholder ? (
          <OverflowPlaceholder
            scale={scale}
            containerType={containerType}
            overflowCount={overflowPackages.length}
            maxHeightM={maxHeightLimit}
          />
        ) : (
          overflowPackages.map((pkg) => (
            <StackedPackage key={`overflow-${pkg.id}`} pkg={pkg} scale={scale} palletOffsetX={0} palletOffsetZ={0} />
          ))
        )
      )}

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={cameraTarget}
      />
    </Canvas>
  )
}

export default Scene3D
