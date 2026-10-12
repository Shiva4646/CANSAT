import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { CylinderGeometry, EdgesGeometry } from 'three'
import { useTelemetry } from '../context/TelemetryContext'

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180
const BODY_RADIUS = 1.1
const BODY_HEIGHT = 2.8
const INNER_RADIUS = BODY_RADIUS * 0.5
const INNER_HEIGHT = 1.5
const RING_RADIUS = 1.2
const RING_TUBE = 0.12
const OUTER_EDGE_GEOMETRY = new EdgesGeometry(
  new CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 28, 1, true),
)

function SatelliteMesh({ wireframe }) {
  const meshRef = useRef(null)
  const { gyroscope } = useTelemetry()

  useFrame(() => {
    if (!meshRef.current) return

    const targetRotation = {
      x: degreesToRadians(gyroscope.roll),
      y: degreesToRadians(gyroscope.pitch),
      z: degreesToRadians(gyroscope.yaw),
    }

    meshRef.current.rotation.x +=
      (targetRotation.x - meshRef.current.rotation.x) * 0.1
    meshRef.current.rotation.y +=
      (targetRotation.y - meshRef.current.rotation.y) * 0.1
    meshRef.current.rotation.z +=
      (targetRotation.z - meshRef.current.rotation.z) * 0.1
  })

  return (
    <group ref={meshRef}>
      <group>
        <mesh>
          <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 28, 1, true]} />
          <meshStandardMaterial
            color="#0a192f"
            emissive="#071426"
            metalness={0.15}
            roughness={0.2}
            transparent
            opacity={0.3}
            wireframe={wireframe}
          />
        </mesh>
        <lineSegments>
          <primitive attach="geometry" object={OUTER_EDGE_GEOMETRY} />
          <lineBasicMaterial color="#00d2ff" />
        </lineSegments>
      </group>
      <mesh>
        <cylinderGeometry args={[INNER_RADIUS, INNER_RADIUS, INNER_HEIGHT, 20, 6]} />
        <meshBasicMaterial color="#00f0ff" wireframe />
      </mesh>
      <group>
        <mesh position={[0, BODY_HEIGHT / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING_RADIUS, RING_TUBE, 16, 64]} />
          <meshBasicMaterial color="#ff7a1a" wireframe={wireframe} />
        </mesh>
        <mesh position={[0, -BODY_HEIGHT / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING_RADIUS, RING_TUBE, 16, 64]} />
          <meshBasicMaterial color="#3c8dff" wireframe={wireframe} />
        </mesh>
      </group>
    </group>
  )
}

function ResettableCamera({ controlsRef, resetTrigger }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [camera, controlsRef, resetTrigger])

  return null
}

function Satellite3D({ wireframe = false, resetTrigger = 0 }) {
  const controlsRef = useRef(null)

  return (
    <div className="satellite-3d" aria-label="3D CanSat orientation">
      <Canvas camera={{ fov: 35, position: [0, 0, 5] }}>
        <color attach="background" args={['#0d1117']} />
        <ambientLight color="#8bc5ff" intensity={0.9} />
        <directionalLight color="#ffffff" intensity={1.2} position={[3, 4, 5]} />
        <directionalLight color="#00f0ff" intensity={0.5} position={[-4, -2, -3]} />
        <ResettableCamera controlsRef={controlsRef} resetTrigger={resetTrigger} />
        <SatelliteMesh wireframe={wireframe} />
        <OrbitControls ref={controlsRef} enableDamping />
      </Canvas>
    </div>
  )
}

export default Satellite3D
