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
  // Clamp weight between 0 and MAX_PACKAGE_WEIGHT
  const normalizedWeight = Math.min(Math.max(weight, 0), MAX_PACKAGE_WEIGHT) / MAX_PACKAGE_WEIGHT

  // Light Yellow: RGB(255, 255, 224)
  // Dark Red: RGB(139, 0, 0)
  const r = Math.round(255 - (255 - 139) * normalizedWeight)
  const g = Math.round(255 - 255 * normalizedWeight)
  const b = Math.round(224 - 224 * normalizedWeight)

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Convert hex color to RGB object
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 224 }
}

/**
 * Get RGB values for heatmap color
 */
export const getHeatmapColorRGB = (weight) => {
  const normalizedWeight = Math.min(Math.max(weight, 0), MAX_PACKAGE_WEIGHT) / MAX_PACKAGE_WEIGHT

  return {
    r: (255 - (255 - 139) * normalizedWeight) / 255,
    g: (255 - 255 * normalizedWeight) / 255,
    b: (224 - 224 * normalizedWeight) / 255
  }
}

// Sort products by weight (descending) and size for stacking
export const sortProductsForStacking = (products) => {
  return [...products].sort((a, b) => {
    // Primary: sort by weight (heavy first - goes to bottom)
    const weightDiff = b.weight - a.weight
    if (Math.abs(weightDiff) > 0.5) return weightDiff

    // Secondary: sort by carton volume (larger first)
    const cartonA = getCartonById(a.cartonId)
    const cartonB = getCartonById(b.cartonId)
    if (cartonA && cartonB) {
      const volumeA = cartonA.length * cartonA.width * cartonA.height
      const volumeB = cartonB.length * cartonB.width * cartonB.height
      return volumeB - volumeA
    }

    return 0
  })
}

/**
 * Calculate package positions with dynamic height and weight limits
 * @param {Array} sortedProducts - Products sorted by weight (heavy first)
 * @param {number} maxHeightMm - Maximum stack height in mm (from pallet surface)
 * @param {number} maxWeightKg - Maximum total weight in kg
 */
export const calculatePackagePositions = (sortedProducts, maxHeightMm = 2300, maxWeightKg = 700) => {
  const placedPackages = []
  let currentTotalWeight = 0
  let currentMaxHeight = PALLET.height // Start from pallet surface

  // Track occupied space per layer
  let layers = [{ y: PALLET.height, spaces: [{ x: 0, z: 0, w: PALLET.length, d: PALLET.width }] }]

  for (const product of sortedProducts) {
    const carton = getCartonById(product.cartonId)
    if (!carton) continue

    // Check weight limit - stop if adding this package would exceed limit
    if (currentTotalWeight + product.weight > maxWeightKg) {
      continue // Skip this package, try next (lighter) one
    }

    const pkg = {
      ...product,
      length: carton.length,
      width: carton.width,
      height: carton.height,
      color: getHeatmapColor(product.weight)
    }

    // Try to place in existing layers
    let placed = false

    for (let layerIdx = 0; layerIdx < layers.length && !placed; layerIdx++) {
      const layer = layers[layerIdx]

      // Check if this layer + package height would exceed height limit
      const potentialHeight = layer.y + pkg.height
      if (potentialHeight > maxHeightMm + PALLET.height) {
        continue // Skip this layer, try next
      }

      for (let spaceIdx = 0; spaceIdx < layer.spaces.length && !placed; spaceIdx++) {
        const space = layer.spaces[spaceIdx]

        // Try both orientations
        const orientations = [
          { l: pkg.length, w: pkg.width },
          { l: pkg.width, w: pkg.length }
        ]

        for (const orient of orientations) {
          if (orient.l <= space.w && orient.w <= space.d) {
            // Place package
            const packageY = layer.y + pkg.height / 2

            placedPackages.push({
              ...pkg,
              position: {
                x: space.x + orient.l / 2,
                y: packageY,
                z: space.z + orient.w / 2
              },
              dimensions: {
                length: orient.l,
                width: orient.w,
                height: pkg.height
              }
            })

            // Update weight and height tracking
            currentTotalWeight += product.weight
            currentMaxHeight = Math.max(currentMaxHeight, packageY + pkg.height / 2)

            // Update remaining spaces (guillotine cut)
            const newSpaces = []

            // Right space
            if (space.w - orient.l > 50) {
              newSpaces.push({
                x: space.x + orient.l,
                z: space.z,
                w: space.w - orient.l,
                d: space.d
              })
            }

            // Top space (depth)
            if (space.d - orient.w > 50) {
              newSpaces.push({
                x: space.x,
                z: space.z + orient.w,
                w: orient.l,
                d: space.d - orient.w
              })
            }

            // Remove used space and add new ones
            layer.spaces.splice(spaceIdx, 1, ...newSpaces)
            placed = true
            break
          }
        }
      }
    }

    // If not placed in existing layer, try to create new layer
    if (!placed) {
      const topY = placedPackages.length > 0
        ? Math.max(...placedPackages.map(p => p.position.y + p.dimensions.height / 2))
        : PALLET.height

      // Check if new layer would exceed height limit
      if (topY + pkg.height > maxHeightMm + PALLET.height) {
        continue // Can't place this package, skip it
      }

      layers.push({
        y: topY,
        spaces: [{ x: 0, z: 0, w: PALLET.length, d: PALLET.width }]
      })

      // Place in new layer
      placedPackages.push({
        ...pkg,
        position: {
          x: pkg.length / 2,
          y: topY + pkg.height / 2,
          z: pkg.width / 2
        },
        dimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height
        }
      })

      // Update weight and height tracking
      currentTotalWeight += product.weight
      currentMaxHeight = Math.max(currentMaxHeight, topY + pkg.height)

      // Update space
      const newLayer = layers[layers.length - 1]
      newLayer.spaces = []

      if (PALLET.length - pkg.length > 50) {
        newLayer.spaces.push({
          x: pkg.length,
          z: 0,
          w: PALLET.length - pkg.length,
          d: PALLET.width
        })
      }
      if (PALLET.width - pkg.width > 50) {
        newLayer.spaces.push({
          x: 0,
          z: pkg.width,
          w: pkg.length,
          d: PALLET.width - pkg.width
        })
      }
    }
  }

  return {
    packages: placedPackages,
    totalWeight: currentTotalWeight,
    maxHeight: currentMaxHeight - PALLET.height // Height above pallet surface
  }
}

/**
 * Main function to fill pallet with random products respecting limits
 * @param {number} count - Number of packages to try to place
 * @param {number} maxHeightM - Maximum height in meters
 * @param {number} maxWeightKg - Maximum weight in kg
 */
export const fillPalletWithProducts = (count, maxHeightM = 2.3, maxWeightKg = 700) => {
  // Convert height from meters to mm
  const maxHeightMm = maxHeightM * 1000

  // Get random products
  const randomProducts = getRandomProducts(count)

  // Sort by weight/size (heavy/large at bottom)
  const sortedProducts = sortProductsForStacking(randomProducts)

  // Calculate positions with limits
  const result = calculatePackagePositions(sortedProducts, maxHeightMm, maxWeightKg)

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
