import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const smooth = (t) => t * t * (3 - 2 * t)
const clamp01 = (x) => Math.min(1, Math.max(0, x))

/**
 * Premium HD-image scroll journey.
 * Pinned section — scroll progress scrubs across a set of full-bleed HD images
 * with a slow Ken Burns drift + crossfade, chapter labels and a progress line.
 * Apple-product-page / Pinterest-pin feel, but driven by crisp stills.
 */
export function buildImageJourney(actsData, section, base) {
  const wrap = section.querySelector('.stage')

  // build act elements: blurred cover backdrop + contained sharp foreground
  const acts = actsData.map((a, i) => {
    const src = `${base}${a.img}`
    const fg = document.createElement('img')
    const bg = document.createElement('img')
    fg.className = 'act-img act-img--fg'
    bg.className = 'act-img act-img--bg'
    fg.src = src
    bg.src = src
    fg.alt = a.label
    fg.draggable = false
    fg.loading = i === 0 ? 'eager' : 'lazy'
    bg.ariaHidden = true
    wrap.append(bg, fg)
    return { ...a, fg, bg }
  })

  const N = acts.length
  const last = acts[N - 1]
  const duration = last.t + 4
  const labelEl = section.querySelector('.chapter-label')
  const progressBar = section.querySelector('.progress-fill')

  // ---------- chapter label ----------
  let currentChapter = -1
  const setChapter = (t) => {
    let i = -1
    for (let k = 0; k < N; k++) if (t >= acts[k].t) i = k
    if (i === currentChapter) return
    currentChapter = i
    if (i < 0 || !acts[i]) {
      gsap.to(labelEl, { autoAlpha: 0, y: 14, duration: 0.25, overwrite: true })
      return
    }
    labelEl.textContent = acts[i].label
    gsap.fromTo(
      labelEl,
      { autoAlpha: 0, y: 14, filter: 'blur(8px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.4, overwrite: true },
    )
  }

  // ---------- per-frame scrub state ----------
  const restyle = (t) => {
    let activeZ = 0
    for (let i = 0; i < N; i++) {
      const a = acts[i]
      const t0 = a.t
      const t1 = i < N - 1 ? acts[i + 1].t : t0 + 4

      // opacity: fade in just before its slot, hold, fade out at the boundary
      const fin = t0 - 0.5
      const fout = t1 + 0.6
      let op = 1
      if (t < fin) op = 0
      else if (t < t0 + 0.05) op = smooth((t - fin) / (t0 + 0.05 - fin))
      else if (t > fout) op = 0
      else if (t > t1 - 0.05) op = 1 - smooth((t - (t1 - 0.05)) / (fout - (t1 - 0.05)))
      op = clamp01(op)

      // Ken Burns drift across the act's window
      const kb = clamp01((t - t0) / (t1 - t0 + 1))
      const scale = 1.16 - 0.16 * kb
      const ty = 2.5 - 2.5 * kb
      const bright = 0.9 + 0.1 * kb

      a.fg.style.opacity = op
      a.bg.style.opacity = op * 0.9
      a.fg.style.transform = `translateY(${ty}%) scale(${scale})`
      a.fg.style.filter = `brightness(${bright}) drop-shadow(0 30px 80px rgba(0,0,0,0.55))`
      a.fg.style.zIndex = op > 0.01 ? 20 : 0
      if (op > 0.15) activeZ = i
    }
    void activeZ
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    // static final frame
    for (let i = 0; i < N; i++) {
      acts[i].fg.style.opacity = i === N - 1 ? 1 : 0
      acts[i].bg.style.opacity = i === N - 1 ? 0.9 : 0
    }
    return null
  }

  restyle(0)

  // ---------- scroll scrub ----------
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${Math.round(duration * 55)}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    onUpdate(self) {
      const t = self.progress * duration
      if (progressBar) progressBar.style.transform = `scaleX(${self.progress})`
      restyle(t)
      setChapter(t)
    },
  })

  return { restyle, dispose: () => st.kill() }
}