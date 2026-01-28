import { getRandomProducts } from '../data/products'
import { getCartonById } from '../data/cartonTypes'

// Pallet dimensions in mm
const PALLET = {
  length: 1200,
  width: 800,
  height: 144
}

// Generate colors for packages based on weight
const getColorByWeight = (weight) => {
  // Heavy = red/orange, Light = blue/green
  if (weight >= 15) return '#ef4444' // red
  if (weight >= 10) return '#f97316' // orange
  if (weight >= 7) return '#eab308' // yellow
  if (weight >= 4) return '#22c55e' // green
  if (weight >= 2) return '#3b82f6' // blue
  return '#8b5cf6' // purple
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

// Simple bin packing algorithm for placing packages on pallet
export const calculatePackagePositions = (sortedProducts) => {
  const placedPackages = []

  // Track occupied space per layer
  let layers = [{ y: PALLET.height, spaces: [{ x: 0, z: 0, w: PALLET.length, d: PALLET.width }] }]

  for (const product of sortedProducts) {
    const carton = getCartonById(product.cartonId)
    if (!carton) continue

    const pkg = {
      ...product,
      length: carton.length,
      width: carton.width,
      height: carton.height,
      color: getColorByWeight(product.weight)
    }

    // Try to place in existing layers
    let placed = false

    for (let layerIdx = 0; layerIdx < layers.length && !placed; layerIdx++) {
      const layer = layers[layerIdx]

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
            placedPackages.push({
              ...pkg,
              position: {
                x: space.x + orient.l / 2,
                y: layer.y + pkg.height / 2,
                z: space.z + orient.w / 2
              },
              dimensions: {
                length: orient.l,
                width: orient.w,
                height: pkg.height
              }
            })

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

    // If not placed in existing layer, create new layer
    if (!placed) {
      const topY = layers.length > 0
        ? Math.max(...placedPackages.map(p => p.position.y + p.dimensions.height / 2))
        : PALLET.height

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

  return placedPackages
}

// Main function to fill pallet with random products
export const fillPalletWithProducts = (count) => {
  // Get random products
  const randomProducts = getRandomProducts(count)

  // Sort by weight/size (heavy/large at bottom)
  const sortedProducts = sortProductsForStacking(randomProducts)

  // Calculate positions
  const placedPackages = calculatePackagePositions(sortedProducts)

  return placedPackages
}

// Calculate total weight
export const calculateTotalWeight = (packages) => {
  return packages.reduce((sum, pkg) => sum + pkg.weight, 0)
}
