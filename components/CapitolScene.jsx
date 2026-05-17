'use client'
import { useEffect, useRef } from 'react'

export default function CapitolScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const setSize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)

    const makeStars = (W, H) =>
      Array.from({ length: 200 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.72,
        r: Math.random() * 1.3 + 0.2,
        base: Math.random() * 0.45 + 0.15,
        speed: Math.random() * 0.022 + 0.006,
        phase: Math.random() * Math.PI * 2,
      }))

    const makeParticles = (W, H) =>
      Array.from({ length: 28 }, () => ({
        x: Math.random() * W,
        y: H * (0.55 + Math.random() * 0.5),
        vy: -(Math.random() * 0.28 + 0.1),
        r: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.45 + 0.08,
        gold: Math.random() > 0.38,
      }))

    let stars = makeStars(canvas.width, canvas.height)
    let particles = makeParticles(canvas.width, canvas.height)

    const onResize = () => {
      stars = makeStars(canvas.width, canvas.height)
      particles = makeParticles(canvas.width, canvas.height)
    }
    ro.observe(canvas)
    canvas.addEventListener('resize', onResize)

    let frame = 0
    let raf

    const draw = () => {
      frame++
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      for (const s of stars) {
        const a = s.base + s.base * 0.55 * Math.sin(frame * s.speed + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220,228,255,${a.toFixed(3)})`
        ctx.fill()
      }

      for (const p of particles) {
        p.y -= p.vy
        if (p.y < -8) {
          p.y = H * (0.85 + Math.random() * 0.2)
          p.x = Math.random() * W
        }
        const a = p.alpha.toFixed(3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.gold ? `rgba(212,175,55,${a})` : `rgba(178,34,52,${(p.alpha * 0.65).toFixed(3)})`
        ctx.fill()
      }

      const cx = W * 0.5
      const cy = H * 0.6
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.38)
      grd.addColorStop(0, 'rgba(178,34,52,0.045)')
      grd.addColorStop(0.5, 'rgba(27,42,107,0.03)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {/* Capitol dome silhouette */}
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMax meet"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          opacity: 0.17,
          pointerEvents: 'none',
        }}
      >
        <g fill="#1B2A6B">
          {/* Bottom steps */}
          <rect x="70"  y="464" width="660" height="36" />
          <rect x="110" y="442" width="580" height="24" />
          <rect x="148" y="420" width="504" height="24" />

          {/* Side wings */}
          <rect x="72"  y="286" width="168" height="134" />
          <rect x="560" y="286" width="168" height="134" />

          {/* Main building body */}
          <rect x="168" y="286" width="464" height="134" />

          {/* Center pavilion (taller) */}
          <rect x="265" y="232" width="270" height="188" />

          {/* Rotunda drum */}
          <rect x="328" y="142" width="144" height="110" />

          {/* Dome hemisphere — cubic bezier arc */}
          <path d="M 288 144 C 288 52, 512 52, 512 144 Z" />

          {/* Inner dome highlight cut-out (slightly darker) */}
          <path
            d="M 310 144 C 310 82, 490 82, 490 144"
            fill="none"
            stroke="#0D1640"
            strokeWidth="2.5"
            opacity="0.45"
          />

          {/* Lantern */}
          <rect x="388" y="36" width="24" height="56" />

          {/* Cupola */}
          <rect x="395" y="14" width="10" height="22" />
          <polygon points="400,0 391,14 409,14" />
        </g>
      </svg>
    </div>
  )
}
