import { getRandomProducts } from '../data/products'
import { getCartonById } from '../data/cartonTypes'

// Pallet dimensions in mm
export const PALLET = {
  length: 1200,
  width: 800,
  height: 144
}

// Container configurations
export const CONTAINER_CONFIG = {
  '20ft': {
    length: 5898,
    width: 2352,
    maxPallets: 11,
    // 2 rows of pallets, longitudinal orientation (1200mm along container length)
    palletsPerRow: 2,
    palletGap: 50 // 50mm safety gap between pallets
  },
  '40ft': {
    length: 12032,
    width: 2352,
    maxPallets: 24,
    palletsPerRow: 2,
    palletGap: 50
  }
}

// Overflow area configuration (behind the container for ultimate overflow)
export const OVERFLOW_AREA = {
  offsetX: 1500, // Default offset for single pallet mode
  length: 1200,
  width: 800,
  floorHeight: 0
}

// Default configuration for "no container" mode (unlimited pallets in grid)
const NO_CONTAINER_CONFIG = {
  maxPallets: 200, // Allow up to 200 pallets when no container is selected
  palletsPerRow: 4, // 4 pallets per row in grid layout
  palletGap: 100 // 100mm gap between pallets
}

/**
 * Calculate pallet positions in a grid layout (for no container mode)
 * @param {number} palletCount - Number of pallets to position
 * @returns {Array} Array of pallet positions {x, z, index}
 */
export const calculatePalletPositionsGrid = (palletCount) => {
  const positions = []
  const gap = NO_CONTAINER_CONFIG.palletGap
  const palletsPerRow = NO_CONTAINER_CONFIG.palletsPerRow
  const palletSpacingX = PALLET.length + gap
  const palletSpacingZ = PALLET.width + gap

  for (let i = 0; i < palletCount; i++) {
    const row = Math.floor(i / palletsPerRow) // Which row (Z direction)
    const col = i % palletsPerRow // Which column (X direction)

    positions.push({
      x: col * palletSpacingX,
      z: row * palletSpacingZ,
      index: i,
      row,
      column: col
    })
  }

  return positions
}

/**
 * Calculate pallet positions within a container
 * Two rows side-by-side (longitudinal orientation), 50mm gaps
 * @param {string} containerType - '20ft' or '40ft'
 * @param {number} palletCount - Number of pallets to position
 * @returns {Array} Array of pallet positions {x, z, index}
 */
export const calculatePalletPositionsInContainer = (containerType, palletCount) => {
  const config = CONTAINER_CONFIG[containerType]
  if (!config) return calculatePalletPositionsGrid(palletCount)

  const positions = []
  const effectivePalletCount = Math.min(palletCount, config.maxPallets)

  // Two rows: Row 0 (left) and Row 1 (right)
  // Longitudinal orientation: pallet length (1200mm) goes along container length
  const rowWidth = PALLET.width // 800mm per row
  const palletSpacing = PALLET.length + config.palletGap // 1200mm + 50mm = 1250mm

  // Center the two rows within container width
  const totalRowsWidth = rowWidth * 2 + config.palletGap
  const rowStartZ = (config.width - totalRowsWidth) / 2

  for (let i = 0; i < effectivePalletCount; i++) {
    const row = i % 2 // Alternate between rows 0 and 1
    const column = Math.floor(i / 2) // Which position along the length

    const x = column * palletSpacing
    const z = rowStartZ + row * (rowWidth + config.palletGap)

    positions.push({
      x,
      z,
      index: i,
      row,
      column
    })
  }

  return positions
}

// Max weight for color calculation (kg)
const MAX_PACKAGE_WEIGHT = 20

// Overflow color for packages that could not be placed
export const OVERFLOW_COLOR = '#FF0000'

/**
 * Calculate heatmap color based on weight using linear interpolation
 * Light (0kg): #E0FFF0 (Light Mint Green)
 * Heavy (20kg): #006400 (Dark Forest Green)
 */
export const getHeatmapColor = (weight) => {
  const normalizedWeight = Math.min(Math.max(weight, 0), MAX_PACKAGE_WEIGHT) / MAX_PACKAGE_WEIGHT
  // Light Mint: RGB(224, 255, 240) -> Dark Forest Green: RGB(0, 100, 0)
  const r = Math.round(224 - 224 * normalizedWeight)
  const g = Math.round(255 - (255 - 100) * normalizedWeight)
  const b = Math.round(240 - 240 * normalizedWeight)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Calculate volume of a carton in mm³
 */
const getCartonVolume = (carton) => {
  return carton.length * carton.width * carton.height
}

/**
 * Sort products by Volume (descending) then by Weight (descending)
 * Larger and heavier items get placed first (at the bottom)
 */
export const sortProductsForAdvancedPacking = (products) => {
  return [...products].sort((a, b) => {
    const cartonA = getCartonById(a.cartonId)
    const cartonB = getCartonById(b.cartonId)

    if (!cartonA || !cartonB) return 0

    // Primary: sort by volume (larger first)
    const volumeA = getCartonVolume(cartonA)
    const volumeB = getCartonVolume(cartonB)
    const volumeDiff = volumeB - volumeA

    if (Math.abs(volumeDiff) > 1000) return volumeDiff

    // Secondary: sort by weight (heavier first)
    return b.weight - a.weight
  })
}

/**
 * Check if two 3D bounding boxes overlap
 */
const boxesOverlap = (box1, box2) => {
  // box format: { x, y, z, length, width, height }
  // x, y, z are the minimum corners

  const overlapX = box1.x < box2.x + box2.length && box1.x + box1.length > box2.x
  const overlapY = box1.y < box2.y + box2.height && box1.y + box1.height > box2.y
  const overlapZ = box1.z < box2.z + box2.width && box1.z + box1.width > box2.z

  return overlapX && overlapY && overlapZ
}

/**
 * Check if a box at position collides with any placed boxes
 */
const hasCollision = (newBox, placedBoxes) => {
  for (const placed of placedBoxes) {
    if (boxesOverlap(newBox, placed)) {
      return true
    }
  }
  return false
}

/**
 * Check if box fits within pallet boundaries
 */
const fitsOnPallet = (box) => {
  return (
    box.x >= 0 &&
    box.z >= 0 &&
    box.x + box.length <= PALLET.length &&
    box.z + box.width <= PALLET.width
  )
}

/**
 * Check if a box has sufficient support below it (gravity rule)
 * A box must either be on the pallet floor OR have support from boxes below
 */
const hasSupport = (box, placedBoxes) => {
  // On pallet floor - always supported
  if (Math.abs(box.y - PALLET.height) < 1) {
    return true
  }

  // Find all boxes that could potentially support this one
  const supportingBoxes = placedBoxes.filter(placed => {
    // Box below must have its top at our bottom
    const topOfPlaced = placed.y + placed.height
    if (Math.abs(topOfPlaced - box.y) > 1) return false

    // Check XZ overlap for support
    const overlapX = box.x < placed.x + placed.length && box.x + box.length > placed.x
    const overlapZ = box.z < placed.z + placed.width && box.z + box.width > placed.z

    return overlapX && overlapZ
  })

  if (supportingBoxes.length === 0) return false

  // Calculate total support area
  let totalSupportArea = 0
  const boxArea = box.length * box.width

  for (const support of supportingBoxes) {
    // Calculate overlap area
    const overlapMinX = Math.max(box.x, support.x)
    const overlapMaxX = Math.min(box.x + box.length, support.x + support.length)
    const overlapMinZ = Math.max(box.z, support.z)
    const overlapMaxZ = Math.min(box.z + box.width, support.z + support.width)

    if (overlapMaxX > overlapMinX && overlapMaxZ > overlapMinZ) {
      totalSupportArea += (overlapMaxX - overlapMinX) * (overlapMaxZ - overlapMinZ)
    }
  }

  // Require at least 50% support
  return totalSupportArea >= boxArea * 0.5
}

/**
 * Find the lowest valid Y position for a box at given XZ coordinates
 * Implements gravity - box drops until it hits support
 */
const findLowestY = (x, z, length, width, height, placedBoxes, maxHeightMm) => {
  let lowestY = PALLET.height // Start at pallet surface

  // Find the highest point of any box that overlaps in XZ
  for (const placed of placedBoxes) {
    // Check XZ overlap
    const overlapX = x < placed.x + placed.length && x + length > placed.x
    const overlapZ = z < placed.z + placed.width && z + width > placed.z

    if (overlapX && overlapZ) {
      const topOfPlaced = placed.y + placed.height
      if (topOfPlaced > lowestY) {
        lowestY = topOfPlaced
      }
    }
  }

  // Check height limit
  if (lowestY + height > PALLET.height + maxHeightMm) {
    return -1 // Can't place here
  }

  return lowestY
}

/**
 * Generate candidate positions for placing a box
 * Uses extreme points heuristic
 */
const generateCandidatePositions = (placedBoxes) => {
  const positions = [{ x: 0, z: 0 }] // Always try origin

  for (const box of placedBoxes) {
    // Add positions at corners of placed boxes
    positions.push(
      { x: box.x + box.length, z: box.z },           // Right of box
      { x: box.x, z: box.z + box.width },            // Behind box
      { x: box.x + box.length, z: box.z + box.width } // Diagonal
    )
  }

  // Filter out duplicates and invalid positions
  const unique = []
  const seen = new Set()

  for (const pos of positions) {
    const key = `${Math.round(pos.x)},${Math.round(pos.z)}`
    if (!seen.has(key) && pos.x >= 0 && pos.z >= 0 && pos.x < PALLET.length && pos.z < PALLET.width) {
      seen.add(key)
      unique.push(pos)
    }
  }

  // Sort by position (prefer bottom-left)
  unique.sort((a, b) => {
    const distA = a.x + a.z
    const distB = b.x + b.z
    return distA - distB
  })

  return unique
}

/**
 * Try to place a box at any valid position with rotation
 */
const tryPlaceBox = (length, width, height, placedBoxes, maxHeightMm) => {
  const positions = generateCandidatePositions(placedBoxes)

  // Try both orientations
  const orientations = [
    { l: length, w: width },
    { l: width, w: length }
  ]

  let bestPlacement = null
  let bestScore = Infinity

  for (const pos of positions) {
    for (const orient of orientations) {
      const testBox = {
        x: pos.x,
        z: pos.z,
        length: orient.l,
        width: orient.w,
        height: height
      }

      // Check if fits on pallet
      if (!fitsOnPallet(testBox)) continue

      // Find lowest valid Y
      const y = findLowestY(pos.x, pos.z, orient.l, orient.w, height, placedBoxes, maxHeightMm)
      if (y < 0) continue

      testBox.y = y

      // Check collision
      if (hasCollision(testBox, placedBoxes)) continue

      // Check support
      if (!hasSupport(testBox, placedBoxes)) continue

      // Score: prefer lower positions and positions closer to origin
      const score = y * 10 + pos.x + pos.z

      if (score < bestScore) {
        bestScore = score
        bestPlacement = {
          x: pos.x,
          y: y,
          z: pos.z,
          length: orient.l,
          width: orient.w,
          height: height
        }
      }
    }
  }

  return bestPlacement
}

/**
 * Advanced 3D Bin Packing Algorithm with rotation and gravity
 * Returns both placed packages and overflow packages (those that couldn't be placed)
 */
export const calculateAdvancedPackagePositions = (sortedProducts, maxHeightMm = 2300, maxWeightKg = 700) => {
  const placedPackages = []
  const overflowPackages = []
  const placedBoxes = [] // Simplified box representation for collision
  let currentTotalWeight = 0
  let totalVolume = 0

  for (const product of sortedProducts) {
    const carton = getCartonById(product.cartonId)
    if (!carton) continue

    // Check weight limit
    if (currentTotalWeight + product.weight > maxWeightKg) {
      // Can't place due to weight - mark as overflow
      overflowPackages.push({
        ...product,
        length: carton.length,
        width: carton.width,
        height: carton.height,
        color: OVERFLOW_COLOR,
        isOverflow: true,
        overflowReason: 'weight'
      })
      continue
    }

    // Try to place the box
    const placement = tryPlaceBox(
      carton.length,
      carton.width,
      carton.height,
      placedBoxes,
      maxHeightMm
    )

    if (!placement) {
      // Can't place due to space/height - mark as overflow
      overflowPackages.push({
        ...product,
        length: carton.length,
        width: carton.width,
        height: carton.height,
        color: OVERFLOW_COLOR,
        isOverflow: true,
        overflowReason: 'space'
      })
      continue
    }

    // Add to placed boxes
    placedBoxes.push(placement)

    // Create package with center position for Three.js
    const pkg = {
      ...product,
      length: carton.length,
      width: carton.width,
      height: carton.height,
      color: getHeatmapColor(product.weight),
      isOverflow: false,
      position: {
        x: placement.x + placement.length / 2,
        y: placement.y + placement.height / 2,
        z: placement.z + placement.width / 2
      },
      dimensions: {
        length: placement.length,
        width: placement.width,
        height: placement.height
      }
    }

    placedPackages.push(pkg)
    currentTotalWeight += product.weight
    totalVolume += carton.length * carton.width * carton.height
  }

  // Calculate max height
  const maxHeight = placedBoxes.length > 0
    ? Math.max(...placedBoxes.map(b => b.y + b.height)) - PALLET.height
    : 0

  // Calculate volume utilization
  const usedVolume = totalVolume
  const availableVolume = PALLET.length * PALLET.width * (maxHeight > 0 ? maxHeight : 1)
  const volumeUtilization = availableVolume > 0 ? (usedVolume / availableVolume) * 100 : 0

  // Calculate positions for overflow packages in the red stack area
  const positionedOverflowPackages = calculateOverflowPositions(overflowPackages)

  return {
    packages: placedPackages,
    overflowPackages: positionedOverflowPackages,
    totalWeight: currentTotalWeight,
    maxHeight: maxHeight,
    totalVolume: totalVolume,
    volumeUtilization: Math.min(volumeUtilization, 100),
    requestedCount: sortedProducts.length,
    placedCount: placedPackages.length,
    overflowCount: overflowPackages.length
  }
}

/**
 * Calculate positions for overflow packages in the red stack area
 * Uses a simple layer-based stacking approach
 */
const calculateOverflowPositions = (overflowPackages) => {
  if (overflowPackages.length === 0) return []

  const positionedPackages = []
  const placedBoxes = []

  for (const pkg of overflowPackages) {
    // Try to find a position in the overflow area
    const placement = tryPlaceBoxInOverflowArea(
      pkg.length,
      pkg.width,
      pkg.height,
      placedBoxes
    )

    if (placement) {
      placedBoxes.push(placement)

      positionedPackages.push({
        ...pkg,
        position: {
          x: OVERFLOW_AREA.offsetX + placement.x + placement.length / 2,
          y: placement.y + placement.height / 2,
          z: placement.z + placement.width / 2
        },
        dimensions: {
          length: placement.length,
          width: placement.width,
          height: placement.height
        }
      })
    } else {
      // If can't fit in overflow area either, just stack vertically
      const fallbackY = placedBoxes.length > 0
        ? Math.max(...placedBoxes.map(b => b.y + b.height))
        : OVERFLOW_AREA.floorHeight

      const fallbackPlacement = {
        x: 0,
        y: fallbackY,
        z: 0,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height
      }
      placedBoxes.push(fallbackPlacement)

      positionedPackages.push({
        ...pkg,
        position: {
          x: OVERFLOW_AREA.offsetX + pkg.length / 2,
          y: fallbackY + pkg.height / 2,
          z: pkg.width / 2
        },
        dimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height
        }
      })
    }
  }

  return positionedPackages
}

/**
 * Try to place a box in the overflow area using similar logic to pallet placement
 */
const tryPlaceBoxInOverflowArea = (length, width, height, placedBoxes) => {
  const positions = generateOverflowCandidatePositions(placedBoxes)

  const orientations = [
    { l: length, w: width },
    { l: width, w: length }
  ]

  let bestPlacement = null
  let bestScore = Infinity

  for (const pos of positions) {
    for (const orient of orientations) {
      const testBox = {
        x: pos.x,
        z: pos.z,
        length: orient.l,
        width: orient.w,
        height: height
      }

      // Check if fits in overflow area
      if (testBox.x + testBox.length > OVERFLOW_AREA.length ||
          testBox.z + testBox.width > OVERFLOW_AREA.width) {
        continue
      }

      // Find lowest Y position
      let lowestY = OVERFLOW_AREA.floorHeight
      for (const placed of placedBoxes) {
        const overlapX = pos.x < placed.x + placed.length && pos.x + orient.l > placed.x
        const overlapZ = pos.z < placed.z + placed.width && pos.z + orient.w > placed.z

        if (overlapX && overlapZ) {
          const topOfPlaced = placed.y + placed.height
          if (topOfPlaced > lowestY) {
            lowestY = topOfPlaced
          }
        }
      }

      testBox.y = lowestY

      // Check collision
      if (hasCollision(testBox, placedBoxes)) continue

      // Score: prefer lower and closer to origin
      const score = lowestY * 10 + pos.x + pos.z

      if (score < bestScore) {
        bestScore = score
        bestPlacement = {
          x: pos.x,
          y: lowestY,
          z: pos.z,
          length: orient.l,
          width: orient.w,
          height: height
        }
      }
    }
  }

  return bestPlacement
}

/**
 * Generate candidate positions for overflow area
 */
const generateOverflowCandidatePositions = (placedBoxes) => {
  const positions = [{ x: 0, z: 0 }]

  for (const box of placedBoxes) {
    positions.push(
      { x: box.x + box.length, z: box.z },
      { x: box.x, z: box.z + box.width },
      { x: box.x + box.length, z: box.z + box.width }
    )
  }

  const unique = []
  const seen = new Set()

  for (const pos of positions) {
    const key = `${Math.round(pos.x)},${Math.round(pos.z)}`
    if (!seen.has(key) && pos.x >= 0 && pos.z >= 0 &&
        pos.x < OVERFLOW_AREA.length && pos.z < OVERFLOW_AREA.width) {
      seen.add(key)
      unique.push(pos)
    }
  }

  unique.sort((a, b) => (a.x + a.z) - (b.x + b.z))

  return unique
}

/**
 * Main function to fill pallet with random products using advanced packing
 * Supports multi-pallet mode for both container and no-container scenarios
 */
export const fillPalletWithProducts = (count, maxHeightM = 2.3, maxWeightKg = 700, containerType = 'none') => {
  const maxHeightMm = maxHeightM * 1000

  // Get random products
  const randomProducts = getRandomProducts(count)

  // Sort by volume and weight (larger/heavier first)
  const sortedProducts = sortProductsForAdvancedPacking(randomProducts)

  // Always use multi-pallet mode
  return fillContainerWithPallets(sortedProducts, maxHeightMm, maxWeightKg, containerType)
}

/**
 * Fill a container with multiple pallets
 * Distributes packages across pallets until container capacity is reached
 * Also handles "no container" mode with unlimited grid layout
 */
const fillContainerWithPallets = (sortedProducts, maxHeightMm, maxWeightKg, containerType) => {
  const config = CONTAINER_CONFIG[containerType]
  const maxPalletsAllowed = config ? config.maxPallets : NO_CONTAINER_CONFIG.maxPallets
  const isContainer = !!config

  const pallets = []
  let remainingProducts = [...sortedProducts]
  let palletIndex = 0
  let totalPlacedPackages = []
  let totalWeight = 0

  // Fill pallets one by one until we run out of products or hit max pallets
  while (remainingProducts.length > 0 && palletIndex < maxPalletsAllowed) {
    // Calculate packing for this pallet
    const palletResult = calculateAdvancedPackagePositions(remainingProducts, maxHeightMm, maxWeightKg)

    if (palletResult.packages.length === 0) {
      // Can't place any more packages on new pallets (all too big/heavy)
      break
    }

    // Get pallet position in container
    const palletPositions = calculatePalletPositionsInContainer(containerType, palletIndex + 1)
    const palletPos = palletPositions[palletIndex]

    // Offset package positions to pallet location in container
    const offsetPackages = palletResult.packages.map(pkg => ({
      ...pkg,
      palletIndex,
      position: {
        x: pkg.position.x + palletPos.x,
        y: pkg.position.y,
        z: pkg.position.z + palletPos.z
      }
    }))

    pallets.push({
      index: palletIndex,
      packages: offsetPackages,
      weight: palletResult.totalWeight,
      height: palletResult.maxHeight,
      volumeUtilization: palletResult.volumeUtilization,
      position: palletPos
    })

    totalPlacedPackages = [...totalPlacedPackages, ...offsetPackages]
    totalWeight += palletResult.totalWeight

    // Remove placed products from remaining
    const placedIds = new Set(palletResult.packages.map(p => p.id))
    remainingProducts = remainingProducts.filter(p => !placedIds.has(p.id))

    palletIndex++
  }

  // Calculate overflow (products that couldn't fit in container)
  const overflowPackages = remainingProducts.length > 0
    ? calculateContainerOverflowPositions(remainingProducts, containerType)
    : []

  // Calculate container utilization
  const containerUtilization = (pallets.length / maxPalletsAllowed) * 100

  // Calculate max height across all pallets
  const maxHeight = pallets.length > 0
    ? Math.max(...pallets.map(p => p.height || 0))
    : 0

  return {
    packages: totalPlacedPackages,
    overflowPackages,
    pallets,
    totalWeight,
    maxHeight,
    totalPallets: pallets.length,
    maxPallets: maxPalletsAllowed,
    containerType,
    containerUtilization,
    volumeUtilization: pallets.length > 0
      ? pallets.reduce((sum, p) => sum + (p.volumeUtilization || 0), 0) / pallets.length
      : 0,
    requestedCount: sortedProducts.length,
    placedCount: totalPlacedPackages.length,
    overflowCount: overflowPackages.length
  }
}

/**
 * Calculate positions for overflow packages
 * For containers: behind the container (Z offset)
 * For no-container: beside the pallets grid (X offset) on the ground floor
 */
const calculateContainerOverflowPositions = (overflowProducts, containerType, palletCount = 1) => {
  const config = CONTAINER_CONFIG[containerType]

  // Calculate offset based on mode
  let overflowOffsetX = 0
  let overflowOffsetZ = 0

  if (config) {
    // Container mode: place behind container (Z direction)
    overflowOffsetZ = config.width + 500
  } else {
    // No-container mode: place beside the pallet grid (X direction)
    // Calculate the rightmost X position of the grid
    const palletsPerRow = NO_CONTAINER_CONFIG.palletsPerRow
    const palletSpacingX = PALLET.length + NO_CONTAINER_CONFIG.palletGap
    overflowOffsetX = palletsPerRow * palletSpacingX + 300 // 300mm gap from grid
  }

  const positionedPackages = []
  const placedBoxes = []

  for (const product of overflowProducts) {
    const carton = getCartonById(product.cartonId)
    if (!carton) continue

    // Simple stacking in overflow area (on the floor, y starts at 0)
    const placement = tryPlaceBoxInOverflowArea(
      carton.length,
      carton.width,
      carton.height,
      placedBoxes
    )

    if (placement) {
      placedBoxes.push(placement)

      positionedPackages.push({
        ...product,
        length: carton.length,
        width: carton.width,
        height: carton.height,
        color: OVERFLOW_COLOR,
        isOverflow: true,
        overflowReason: 'container_full',
        position: {
          x: overflowOffsetX + placement.x + placement.length / 2,
          y: placement.y + placement.height / 2, // Starts from floor (y=0)
          z: overflowOffsetZ + placement.z + placement.width / 2
        },
        dimensions: {
          length: placement.length,
          width: placement.width,
          height: placement.height
        }
      })
    } else {
      // Fallback: stack vertically on the floor
      const fallbackY = placedBoxes.length > 0
        ? Math.max(...placedBoxes.map(b => b.y + b.height))
        : 0

      placedBoxes.push({
        x: 0,
        y: fallbackY,
        z: 0,
        length: carton.length,
        width: carton.width,
        height: carton.height
      })

      positionedPackages.push({
        ...product,
        length: carton.length,
        width: carton.width,
        height: carton.height,
        color: OVERFLOW_COLOR,
        isOverflow: true,
        overflowReason: 'container_full',
        position: {
          x: overflowOffsetX + carton.length / 2,
          y: fallbackY + carton.height / 2,
          z: overflowOffsetZ + carton.width / 2
        },
        dimensions: {
          length: carton.length,
          width: carton.width,
          height: carton.height
        }
      })
    }
  }

  return positionedPackages
}

// Calculate total weight
export const calculateTotalWeight = (packages) => {
  return packages.reduce((sum, pkg) => sum + pkg.weight, 0)
}

// Calculate max stack height (above pallet)
export const calculateMaxHeight = (packages) => {
  if (packages.length === 0) return 0
  const maxY = Math.max(...packages.map(p => p.position.y + p.dimensions.height / 2))
  return maxY - PALLET.height
}
