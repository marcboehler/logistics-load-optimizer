import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import Pallet from './Pallet'
import Package from './Package'

function Scene3D({ packages }) {
  // Umrechnung mm zu Three.js Einheiten (1 Einheit = 100mm)
  const scale = 0.01

  return (
    <Canvas
      camera={{ position: [15, 12, 15], fov: 50 }}
      className="w-full h-full"
    >
      {/* Beleuchtung */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Umgebung */}
      <Environment preset="warehouse" />

      {/* Boden-Grid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[30, 30]}
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

      {/* Pakete auf der Palette */}
      {packages.map((pkg, index) => (
        <Package
          key={pkg.id}
          length={pkg.length}
          width={pkg.width}
          height={pkg.height}
          color={pkg.color}
          scale={scale}
          // Platziere Paket auf der Palette (Mitte, auf Palettenhöhe)
          position={[0, 144 * scale + (pkg.height * scale) / 2, 0]}
        />
      ))}

      {/* Kamera-Steuerung */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        target={[0, 3, 0]}
      />
    </Canvas>
  )
}

export default Scene3D
