import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const smooth = (t) => t * t * (3 - 2 * t)
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const phase = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : smooth((t - a) / (b - a)))
const mix = (a, b, f) => a + (b - a) * f

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

/**
 * Scroll-scrubbed 3D drink scene (three.js). Same contract as buildVideoJourney:
 * pinned section, progress -> scene time t, chapters + progress bar driven by
 * the shared drinks.js data. Everything is procedural — no assets, deterministic
 * per time value so the scrub is frame-exact.
 */
export function build3DJourney(drink, section) {
  const chapters = drink.chapters || []
  const duration = chapters.length ? chapters[chapters.length - 1].t + 4 : 22
  const labelEl = section.querySelector('.chapter-label')
  const progressBar = section.querySelector('.progress-fill')

  const wrap = section.querySelector('.video-frame')
  let canvas = section.querySelector('.drink-canvas')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.className = 'drink-canvas'
    wrap.prepend(canvas)
  }
  canvas.replaceChildren()

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!hasWebGL()) return null

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b0d09)

  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30)
  camera.position.set(0, 0.35, 6.4)
  camera.lookAt(0, 0.05, 0)

  // ---------- lighting (dark moody bar) ----------
  scene.add(new THREE.AmbientLight(0xffe6c4, 0.35))
  const key = new THREE.SpotLight(0xfff2dc, 90, 30, Math.PI / 5, 0.45, 1.4)
  key.position.set(3.6, 6, 3.2)
  scene.add(key)
  const rim = new THREE.SpotLight(0x9fd8ff, 70, 30, Math.PI / 4, 0.5, 1.4)
  rim.position.set(-4.5, 2.5, -4)
  scene.add(rim)
  const fill = new THREE.PointLight(0xffd9a0, 8, 12)
  fill.position.set(-2.5, 0.6, 3.4)
  scene.add(fill)

  // ground disc so the glass sits on something
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 48),
    new THREE.MeshStandardMaterial({ color: 0x0f120c, roughness: 0.85, metalness: 0.2 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.48
  scene.add(ground)

  const stage = new THREE.Group()
  scene.add(stage)

  // ---------- glass ----------
  const lathePts = []
  for (let i = 0; i <= 28; i++) {
    const f = i / 28
    const y = -1.45 + f * 3.0
    const r = 0.12 + 0.74 * f + 0.14 * Math.sin(Math.PI * f)
    lathePts.push(new THREE.Vector2(r, y))
  }
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(lathePts, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xdfe8ee,
      roughness: 0.06,
      metalness: 0,
      transmission: 0.95,
      thickness: 1.6,
      ior: 1.5,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 1.25,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    }),
  )
  glass.position.y = 0.03
  stage.add(glass)

  // ---------- liquid (grows up from the glass base) ----------
  const liq = new THREE.Group()
  liq.position.y = -1.42
  stage.add(liq)
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.76, 2.3, 48, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0xe7f2d4,
      roughness: 0.18,
      metalness: 0,
      transparent: true,
      opacity: 0.82,
      transmission: 0.5,
      thickness: 0.9,
      envMapIntensity: 0.7,
    }),
  )
  liq.add(liquid)

  // ---------- ice cubes ----------
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8ecf3,
    roughness: 0.05,
    transmission: 0.7,
    thickness: 0.5,
    envMapIntensity: 0.9,
  })
  const ices = []
  for (let i = 0; i < 5; i++) {
    const s = 0.38 + Math.random() * 0.16
    const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s * (0.8 + Math.random() * 0.4), s), iceMat)
    cube.position.set(
      (Math.random() - 0.5) * 0.7,
      -0.7 + Math.random() * 0.45,
      (Math.random() - 0.5) * 0.6,
    )
    cube.rotation.set(Math.random() * 6.28, Math.random() * 6.28, 0)
    stage.add(cube)
    ices.push({ mesh: cube, drop: 3.4 + i * 0.16, spin: 2 + Math.random() * 4 })
  }

  // ---------- lime wheel + juice droplets ----------
  const limeMat = new THREE.MeshPhysicalMaterial({
    color: 0x8fd43c,
    roughness: 0.35,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.8,
  })
  const lime = new THREE.Group()
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 36), limeMat)
  lime.add(wheel)
  lime.position.set(2.7, 0.5, 0.5)
  stage.add(lime)
  const drops = []
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xb8e85a, roughness: 0.2, emissive: 0x223a08 }),
    )
    m.visible = false
    lime.add(m)
    drops.push({
      mesh: m,
      dir: new THREE.Vector3(Math.random() * 2 - 1, -0.4 - Math.random() * 0.5, Math.random() * 2 - 1).normalize(),
    })
  }

  // ---------- mint sprig ----------
  const mint = new THREE.Group()
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.75, 8),
    new THREE.MeshStandardMaterial({ color: 0x2e8b34, roughness: 0.5 }),
  )
  stem.position.y = 0.35
  mint.add(stem)
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x3fae3a,
    roughness: 0.45,
    emissive: 0x0d2a08,
  })
  const leafDefs = [
    [0.15, 0.55, 0.18, 0.35, 0.25],
    [-0.14, 0.42, 0.16, -0.3, 0.32],
    [0.16, 0.3, 0.17, 0.45, 0.2],
    [-0.13, 0.66, 0.14, -0.4, 0.4],
    [0.05, 0.72, 0.12, 0.15, 0.9],
  ]
  for (const [x, y, s, rotY, tilt] of leafDefs) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 10), leafMat)
    l.scale.set(1, 0.45, 0.3)
    l.position.set(x, y, 0)
    l.rotation.set(0.3, rotY, tilt)
    mint.add(l)
  }
  mint.position.set(0, 3.6, 0)
  mint.rotation.y = 0.6
  stage.add(mint)

  // ---------- muddling rod ----------
  const muddle = new THREE.Group()
  const muddleRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.055, 2.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x7a5027, roughness: 0.6 }),
  )
  muddle.add(muddleRod)
  muddleRod.position.y = 1.2
  muddle.position.set(0, 3.4, 0)
  stage.add(muddle)

  // ---------- sugar sprinkle (points) ----------
  const SUGAR_N = 70
  const sugarGeo = new THREE.BufferGeometry()
  const sugarPos = new Float32Array(SUGAR_N * 3)
  const sugarSeed = new Float32Array(SUGAR_N)
  for (let i = 0; i < SUGAR_N; i++) {
    const ring = Math.random() * 0.75
    const ang = Math.random() * Math.PI * 2
    sugarPos[i * 3] = Math.cos(ang) * ring
    sugarPos[i * 3 + 1] = 3.0 + Math.random() * 1.4
    sugarPos[i * 3 + 2] = Math.sin(ang) * ring * 0.6
    sugarSeed[i] = Math.random()
  }
  sugarGeo.setAttribute('position', new THREE.BufferAttribute(sugarPos, 3))
  const sugar = new THREE.Points(
    sugarGeo,
    new THREE.PointsMaterial({
      color: 0xfff8e7,
      size: 0.05,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  stage.add(sugar)

  // ---------- soda bubbles (points, rise inside liquid) ----------
  const BUB_N = 150
  const bubGeo = new THREE.BufferGeometry()
  const bubBase = new Float32Array(BUB_N * 3)
  const bubSeed = new Float32Array(BUB_N)
  for (let i = 0; i < BUB_N; i++) {
    const ang = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * 0.72
    bubBase[i * 3] = Math.cos(ang) * r
    bubBase[i * 3 + 1] = -1.1 + Math.random() * 1.6
    bubBase[i * 3 + 2] = Math.sin(ang) * r
    bubSeed[i] = Math.random()
  }
  bubGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BUB_N * 3), 3))
  const bubbles = new THREE.Points(
    bubGeo,
    new THREE.PointsMaterial({
      color: 0xdcf7e2,
      size: 0.055,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  stage.add(bubbles)

  // ---------- stir + garnish + straw ----------
  const stir = new THREE.Group()
  const stirRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.0, 10),
    new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.25, metalness: 0.7 }),
  )
  stir.add(stirRod)
  stirRod.position.y = 1.0
  stir.visible = false
  stage.add(stir)

  const garnish = new THREE.Group()
  const gWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 36), limeMat)
  garnish.add(gWheel)
  garnish.visible = false
  stage.add(garnish)

  const straw = new THREE.Group()
  const strawTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.9, 14),
    new THREE.MeshPhysicalMaterial({ color: 0xe9f7ff, roughness: 0.15, clearcoat: 0.8 }),
  )
  straw.add(strawTube)
  straw.rotation.z = -0.55
  straw.position.set(0.8, 1.25, 0.2)
  straw.visible = false
  stage.add(straw)

  // ---------- deterministic scene state ----------
  const applyTime = (t) => {
    // gentle stage sway
    stage.rotation.y = -0.05 * Math.sin(t * 0.14)

    // glass + liquid
    glass.position.y = 0.03 + 0.05 * phase(t, 0, 1.4)
    liquid.material.opacity = mix(0.2, 0.82, phase(t, 0.4, 2.6))
    liq.scale.y = mix(0.12, 1, phase(t, 13.0, 15.4))
    liquid.material.color.set('#e7f2d4').lerp(new THREE.Color('#d8f0bf'), phase(t, 13.5, 15.5))

    // ice tumble
    ices.forEach((it, i) => {
      const a = clamp01((phase(t, 2.1, 5.4) * 5 - i * 0.85) / 5)
      if (a <= 0) return
      const e = smooth(a)
      it.mesh.position.y = mix(it.drop, -0.7 + i * 0.08, e)
      it.mesh.rotation.x += 0.02
      it.mesh.rotation.y += it.spin * e * 0.18
      it.mesh.position.x = mix(0, it.mesh.userData.baseX ?? 0, e)
    })
    if (ices[0].mesh.userData.baseX === undefined) {
      ices.forEach((it) => (it.mesh.userData.baseX = it.mesh.position.x))
    }

    // lime wheel slides in + juice droplet burst
    const la = phase(t, 5.4, 8.2)
    if (la > 0) {
      const e = smooth(la)
      lime.position.x = mix(2.7, -0.05, e)
      lime.position.z = mix(0.5, 0.2, e)
      lime.position.y = mix(0.5, 0.34, e)
      lime.rotation.x = mix(-0.5, 0.04, e)
      lime.rotation.z = mix(0.5, 0.02, e) * (1 - e)
      const burst = phase(t, 6.1, 6.9)
      drops.forEach((d, i) => {
        d.mesh.visible = burst > 0
        if (burst > 0) {
          d.mesh.position.copy(d.dir).multiplyScalar(burst * (0.3 + i * 0.03))
          d.mesh.position.y -= burst * 0.35
          d.mesh.material.opacity = 1 - burst
          d.mesh.visible = d.mesh.material.opacity > 0.02
        }
      })
    }

    // mint sprig drop
    const ma = phase(t, 8.2, 9.8)
    if (ma > 0) {
      const e = smooth(ma)
      mint.position.y = mix(3.6, 0.4, e)
      mint.rotation.x = mix(-0.3, 0.02, e)
    }

    // muddle press (mint ko press karta hai)
    const mudA = phase(t, 9.6, 10.6)
    muddle.visible = t > 9.2
    if (muddle.visible) {
      const down = mudA < 0.55 ? smooth(mudA / 0.55) : 1 - smooth((mudA - 0.55) / 0.45)
      muddle.position.y = mix(2.2, 0.55, clamp01(down))
      muddle.rotation.z = Math.sin(mudA * 20) * 0.12
      mint.position.y = mix(0.42, 0.3, clamp01(down))
    }

    // sugar sprinkle
    const sa = phase(t, 10.8, 12.6)
    sugar.material.opacity = sa * 0.85
    if (sa > 0) {
      const p = sugarGeo.attributes.position
      for (let i = 0; i < SUGAR_N; i++) {
        const f = clamp01((sa + sugarSeed[i] * 0.25) / 1.25)
        p.array[i * 3 + 1] = mix(3.4, 0.35, f)
      }
      p.needsUpdate = true
      sugar.rotation.y = sa * 1.6
    }

    // soda: liquid fills (done via liq scale) + bubbles erupt
    const ba = phase(t, 13.0, 16.8)
    bubbles.material.opacity = ba * 0.6
    if (ba > 0) {
      const p = bubGeo.attributes.position
      for (let i = 0; i < BUB_N; i++) {
        const rise = phase(t, 13, 17.5)
        const f = (bubSeed[i] + rise * (0.4 + bubSeed[i] * 1.1)) % 1
        p.array[i * 3] = bubBase[i * 3]
        p.array[i * 3 + 1] = mix(-1.05, 0.45, f)
        p.array[i * 3 + 2] = bubBase[i * 3 + 2]
      }
      p.needsUpdate = true
    }

    // stir orbit
    const stA = phase(t, 15.8, 18.6)
    stir.visible = stA > 0 && stA < 1
    if (stir.visible) {
      const ang = -3.2 + stA * (Math.PI * 2.2)
      stir.position.set(Math.cos(ang) * 1.05, 0.25, Math.sin(ang) * 1.05)
      stir.rotation.y = -ang
    }

    // garnish lime on rim + straw
    const ga = phase(t, 18.4, 19.6)
    if (ga > 0) {
      const e = smooth(ga)
      garnish.visible = true
      garnish.position.set(mix(1.35, 1.12, e), mix(1.7, 1.52, e), mix(0.4, 0.16, e))
      garnish.rotation.z = mix(0.9, 0.6, e)
      garnish.rotation.y = e * 0.5
    }
    const swA = phase(t, 19.2, 20.4)
    if (swA > 0) {
      straw.visible = true
      straw.position.y = mix(2.2, 1.25, smooth(swA))
    }

    // camera life
    camera.position.y = 0.35 + Math.sin(t * 0.2) * 0.03
    camera.lookAt(0, 0.05, 0)
  }

  // ---------- chapter label ----------
  let currentChapter = -1
  const setChapter = (t) => {
    let i = -1
    for (let k = 0; k < chapters.length; k++) if (t >= chapters[k].t) i = k
    if (i === currentChapter) return
    currentChapter = i
    if (i < 0) {
      gsap.to(labelEl, { autoAlpha: 0, y: 14, duration: 0.25, overwrite: true })
      return
    }
    labelEl.textContent = chapters[i].label
    gsap.fromTo(
      labelEl,
      { autoAlpha: 0, y: 14, filter: 'blur(8px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.4, overwrite: true },
    )
  }

  // ---------- render loop ----------
  let currentT = 0
  const animate = () => {
    applyTime(currentT)
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
  animate()

  // ---------- resize ----------
  const resize = () => {
    const w = canvas.clientWidth || wrap.clientWidth
    const h = canvas.clientHeight || wrap.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)
  resize()

  if (reduced) {
    currentT = duration
    applyTime(duration)
    setChapter(duration)
    return { applyTime, dispose: () => {} }
  }

  applyTime(0)

  // ---------- scroll scrub ----------
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${Math.round(duration * 55)}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    onUpdate(self) {
      currentT = self.progress * duration
      if (progressBar) progressBar.style.transform = `scaleX(${self.progress})`
      setChapter(self.progress * duration)
    },
  })

  return { applyTime, dispose: () => st.kill() }
}