import { getRandomProducts } from '../data/products'
import { getCartonById } from '../data/cartonTypes'

// Pallet dimensions in mm
const PALLET = {
  length: 1200,
  width: 800,
  height: 144
}

// Max weight for color calculation (kg)
const MAX_PACKAGE_WEIGHT = 20

/**
 * Calculate heatmap color based on weight using linear interpolation
 * Light (0kg): #FFFFE0 (Light Yellow)
 * Heavy (20kg): #8B0000 (Dark Red)
 */
export const getHeatmapColor = (weight) => {
  const normalizedWeight = Math.min(Math.max(weight, 0), MAX_PACKAGE_WEIGHT) / MAX_PACKAGE_WEIGHT
  const r = Math.round(255 - (255 - 139) * normalizedWeight)
  const g = Math.round(255 - 255 * normalizedWeight)
  const b = Math.round(224 - 224 * normalizedWeight)
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
 */
export const calculateAdvancedPackagePositions = (sortedProducts, maxHeightMm = 2300, maxWeightKg = 700) => {
  const placedPackages = []
  const placedBoxes = [] // Simplified box representation for collision
  let currentTotalWeight = 0
  let totalVolume = 0

  for (const product of sortedProducts) {
    const carton = getCartonById(product.cartonId)
    if (!carton) continue

    // Check weight limit
    if (currentTotalWeight + product.weight > maxWeightKg) {
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
      continue // Can't place this package
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

  return {
    packages: placedPackages,
    totalWeight: currentTotalWeight,
    maxHeight: maxHeight,
    totalVolume: totalVolume,
    volumeUtilization: Math.min(volumeUtilization, 100)
  }
}

/**
 * Main function to fill pallet with random products using advanced packing
 */
export const fillPalletWithProducts = (count, maxHeightM = 2.3, maxWeightKg = 700) => {
  const maxHeightMm = maxHeightM * 1000

  // Get random products
  const randomProducts = getRandomProducts(count)

  // Sort by volume and weight (larger/heavier first)
  const sortedProducts = sortProductsForAdvancedPacking(randomProducts)

  // Calculate positions with advanced algorithm
  const result = calculateAdvancedPackagePositions(sortedProducts, maxHeightMm, maxWeightKg)

  return result
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
