'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const BG = 0x07070f
const ACCENT = 0x7c7cff

export default function CapitolScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(BG, 1)
    mount.appendChild(renderer.domElement)

    // Scene & camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 200)
    camera.position.set(0, 8, 28)
    camera.lookAt(0, 4, 0)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const point = new THREE.PointLight(0xffffff, 1.2, 120)
    point.position.set(0, 20, 15)
    scene.add(point)

    // Wireframe material
    const wireMat = new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true })

    const group = new THREE.Group()
    scene.add(group)

    function box(w, h, d, x, y, z) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wireMat)
      m.position.set(x, y, z)
      group.add(m)
    }

    function cyl(rt, rb, h, segs, x, y, z) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), wireMat)
      m.position.set(x, y, z)
      group.add(m)
    }

    function sph(r, ws, hs, x, y, z, phiStart, phiLen, thetaStart, thetaLen) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, ws, hs, phiStart, phiLen, thetaStart, thetaLen),
        wireMat
      )
      m.position.set(x, y, z)
      group.add(m)
    }

    // --- Capitol building geometry ---

    // Base platform / steps
    box(22, 1.0, 12, 0, 0.5, 0)
    box(20, 0.6, 10, 0, 1.3, 0)
    box(18, 0.6, 9,  0, 1.9, 0)

    // Main body
    box(16, 5, 8, 0, 4.5, 0)

    // Wings (left & right)
    box(6, 4, 7, -11, 4, 0)
    box(6, 4, 7,  11, 4, 0)

    // Wing rooflines
    box(6.2, 0.5, 7.2, -11, 6.2, 0)
    box(6.2, 0.5, 7.2,  11, 6.2, 0)

    // Central portico / front protrusion
    box(8, 5, 3, 0, 4.5, 5.5)

    // Portico columns (front row)
    for (let i = -3; i <= 3; i += 1.5) {
      cyl(0.18, 0.18, 5, 8, i, 4.5, 7)
    }

    // Portico pediment (triangle approximated as flat box)
    box(8, 1.2, 0.4, 0, 7.4, 6.8)

    // Drum (cylindrical base for dome)
    cyl(3.2, 3.4, 2.5, 16, 0, 7.5, 0)

    // Drum colonnade ring
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      cyl(0.15, 0.15, 2.5, 6, Math.cos(a) * 3.1, 7.5, Math.sin(a) * 3.1)
    }

    // Dome — lower hemisphere
    sph(3, 18, 9, 0, 9, 0, 0, Math.PI * 2, 0, Math.PI / 2)

    // Dome — upper hemisphere (slightly smaller for tapering)
    sph(2.6, 16, 8, 0, 11.5, 0, 0, Math.PI * 2, 0, Math.PI / 2)

    // Lantern
    cyl(0.8, 1.0, 2, 10, 0, 14.5, 0)

    // Statue pedestal + figure (simplified)
    cyl(0.25, 0.3, 1.5, 6, 0, 16.5, 0)
    cyl(0.12, 0.12, 1.2, 6, 0, 17.85, 0)

    // Wing columns (decorative, left & right)
    for (const sx of [-11, 11]) {
      for (let i = -2; i <= 2; i += 2) {
        cyl(0.14, 0.14, 4, 6, sx + i * 0.5, 4, 3.6)
      }
    }

    // --- Floating particles ---
    const COUNT = 700
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40 + 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    const ptGeo = new THREE.BufferGeometry()
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const ptMat = new THREE.PointsMaterial({ color: ACCENT, size: 0.15, sizeAttenuation: true })
    scene.add(new THREE.Points(ptGeo, ptMat))

    // --- Mouse parallax ---
    let targetRX = 0, targetRY = 0
    function onMouseMove(e) {
      const nx = (e.clientX / window.innerWidth)  * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      targetRY = nx * 0.18
      targetRX = -ny * 0.08
    }
    window.addEventListener('mousemove', onMouseMove)

    // --- Resize ---
    function onResize() {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // --- Animation loop ---
    let raf
    const clock = new THREE.Clock()
    function animate() {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Smooth parallax
      group.rotation.y += (targetRY - group.rotation.y) * 0.05
      group.rotation.x += (targetRX - group.rotation.x) * 0.05

      // Float
      group.position.y = Math.sin(t * 0.5) * 0.3

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
