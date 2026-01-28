import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import Pallet from './Pallet'
import StackedPackage from './StackedPackage'

function Scene3D({ packages }) {
  // Umrechnung mm zu Three.js Einheiten (1 Einheit = 100mm)
  const scale = 0.01

  // Pallet center offset (pallet is 1200x800, so center is at 600x400)
  const palletOffsetX = -6 // -600mm * scale
  const palletOffsetZ = -4 // -400mm * scale

  return (
    <Canvas
      camera={{ position: [20, 15, 20], fov: 50 }}
      className="w-full h-full"
    >
      {/* Beleuchtung */}
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

      {/* Umgebung */}
      <Environment preset="warehouse" />

      {/* Boden-Grid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#404040"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#606060"
        fadeDistance={50}
        fadeStrength={1}
      />

      {/* Europalette: 1200x800x144mm */}
      <Pallet scale={scale} />

      {/* Pakete auf der Palette mit berechneten Positionen */}
      {packages.map((pkg) => (
        <StackedPackage
          key={pkg.id}
          pkg={pkg}
          scale={scale}
          palletOffsetX={palletOffsetX}
          palletOffsetZ={palletOffsetZ}
        />
      ))}

      {/* Kamera-Steuerung */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={60}
        target={[0, 4, 0]}
      />
    </Canvas>
  )
}

export default Scene3D
