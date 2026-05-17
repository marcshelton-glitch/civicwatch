'use client';
import { useEffect, useRef } from 'react';

export default function CapitolScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    import('three').then((THREE) => {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
      camera.position.set(0, 1, 10);
      camera.lookAt(0, 0.5, 0);

      function resize() {
        const w = canvas.offsetWidth, h = canvas.offsetHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();
      window.addEventListener('resize', resize);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x7c7cff, transparent: true, opacity: 0.55 });
      const lineMatDim = new THREE.LineBasicMaterial({ color: 0x7c7cff, transparent: true, opacity: 0.25 });
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x7c7cff, wireframe: true, transparent: true, opacity: 0.15 });
      const solidMat = new THREE.MeshBasicMaterial({ color: 0x7c7cff, transparent: true, opacity: 0.45 });

      function edges(geo, mat) {
        return new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat || lineMat);
      }

      const capitol = new THREE.Group();

      const base1 = edges(new THREE.BoxGeometry(7.2, 0.2, 3.0), lineMatDim);
      base1.position.y = -0.9;
      capitol.add(base1);
      const base2 = edges(new THREE.BoxGeometry(6.6, 0.2, 2.7), lineMatDim);
      base2.position.y = -0.7;
      capitol.add(base2);

      const body = edges(new THREE.BoxGeometry(6.2, 1.4, 2.4));
      body.position.y = 0.1;
      capitol.add(body);

      const lw = edges(new THREE.BoxGeometry(2.4, 1.1, 2.0), lineMatDim);
      lw.position.set(-4.3, -0.05, 0);
      capitol.add(lw);
      const rw = edges(new THREE.BoxGeometry(2.4, 1.1, 2.0), lineMatDim);
      rw.position.set(4.3, -0.05, 0);
      capitol.add(rw);

      const lp = edges(new THREE.BoxGeometry(1.2, 0.15, 2.0), lineMatDim);
      lp.position.set(-4.3, 0.5, 0);
      capitol.add(lp);
      const rp = edges(new THREE.BoxGeometry(1.2, 0.15, 2.0), lineMatDim);
      rp.position.set(4.3, 0.5, 0);
      capitol.add(rp);

      const rtBase = edges(new THREE.BoxGeometry(2.0, 0.4, 2.0));
      rtBase.position.y = 0.9;
      capitol.add(rtBase);

      const drum = edges(new THREE.CylinderGeometry(0.85, 0.85, 0.9, 12));
      drum.position.y = 1.5;
      capitol.add(drum);

      for (let i = 0; i < 6; i++) {
        const angle = (i / 5) * Math.PI;
        const col = edges(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), lineMatDim);
        col.position.set(Math.cos(angle) * 0.9, 1.5, Math.sin(angle) * 0.9);
        capitol.add(col);
      }

      const domeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.88, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
        wireMat
      );
      domeMesh.position.y = 2.0;
      capitol.add(domeMesh);

      const domeRing = edges(new THREE.CylinderGeometry(0.88, 0.88, 0.12, 20));
      domeRing.position.y = 2.0;
      capitol.add(domeRing);

      const lantern = edges(new THREE.CylinderGeometry(0.16, 0.2, 0.38, 10));
      lantern.position.y = 2.88;
      capitol.add(lantern);

      const statueMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), solidMat);
      statueMesh.position.y = 3.27;
      capitol.add(statueMesh);

      capitol.position.set(3.2, -0.5, 0);
      scene.add(capitol);

      const pCount = 700;
      const pos = new Float32Array(pCount * 3);
      const vel = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 22;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
        vel[i * 3] = (Math.random() - 0.5) * 0.002;
        vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
        vel[i * 3 + 2] = 0;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0x818cf8, size: 0.04, transparent: true, opacity: 0.5 });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      let mouseX = 0, mouseY = 0;
      function onMouseMove(e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }
      document.addEventListener('mousemove', onMouseMove);

      let t = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.008;

        capitol.rotation.y += 0.0025;
        capitol.position.y = -0.5 + Math.sin(t * 0.6) * 0.12;

        camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 0.3 + 1.0 - camera.position.y) * 0.03;
        camera.lookAt(0, 0.5, 0);

        const pPos = pGeo.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
          pPos[i * 3] += vel[i * 3];
          pPos[i * 3 + 1] += vel[i * 3 + 1];
          if (pPos[i * 3] > 11) pPos[i * 3] = -11;
          if (pPos[i * 3] < -11) pPos[i * 3] = 11;
          if (pPos[i * 3 + 1] > 7) pPos[i * 3 + 1] = -7;
          if (pPos[i * 3 + 1] < -7) pPos[i * 3 + 1] = 7;
        }
        pGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      }
      animate();

      return () => {
        cancelAnimationFrame(animId);
        document.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', resize);
        renderer.dispose();
      };
    });

    return () => { if (animId) cancelAnimationFrame(animId); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        willChange: 'transform',
      }}
    />
  );
}
