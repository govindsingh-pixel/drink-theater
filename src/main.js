import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { activeDrink } from './data/drinks.js'
import { buildVideoJourney } from './timeline/buildVideoJourney.js'

gsap.registerPlugin(ScrollTrigger)

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="loader" aria-hidden="true">
    <div class="loader-mark">DT</div>
    <div class="loader-bar"><span></span></div>
    <div class="loader-pct">0%</div>
  </div>

  <header class="hero">
    <div class="hero-bg"></div>
    <p class="hero-eyebrow">Drink Theater presents</p>
    <h1 class="hero-title" aria-label="${activeDrink.name}">
      <span class="hero-line">BLUE CURACAO</span>
      <span class="hero-line hero-line--outline">MOJITO</span>
    </h1>
    <p class="hero-tag">${activeDrink.tagline}</p>
    <div class="scroll-hint">
      <span>Scroll</span>
      <div class="scroll-arrow"></div>
    </div>
  </header>

  <section class="journey" aria-label="${activeDrink.name} being made">
    <div class="video-frame">
      <video class="journey-video" src="${activeDrink.video}" poster="${activeDrink.poster}"
        muted playsinline preload="auto"></video>
      <div class="vignette"></div>
      <div class="grain"></div>
    </div>
    <div class="chapter-label" aria-live="polite"></div>
    <div class="progress">
      <div class="progress-fill"></div>
    </div>
  </section>

  <section class="cta">
    <p class="cta-eyebrow">That's it. That's the drink.</p>
    <h2>Apni drink banwani hai?</h2>
    <p>Ek drink, ek scroll, zero recipe text.</p>
    <form class="cta-form" action="mailto:hello@example.com" method="get" enctype="text/plain">
      <input type="email" name="body" placeholder="your@email.com" required aria-label="Email" />
      <button type="submit">Banao</button>
    </form>
    <footer class="footer">drink-theater — scroll · watch · sip</footer>
  </section>
`

// ---------- loader + boot ----------
const loader = document.querySelector('.loader')
const loaderFill = loader.querySelector('.loader-bar span')
const loaderPct = loader.querySelector('.loader-pct')
const video = document.querySelector('.journey-video')

const boot = () => {
  gsap.to(loader, {
    autoAlpha: 0,
    duration: 0.6,
    onComplete: () => {
      loader.remove()
      buildVideoJourney(activeDrink, document.querySelector('.journey'))
      introAnimation()
    },
  })
}

let loaded = 0
const bump = () => {
  loaded = Math.min(loaded + 12, 92)
  loaderFill.style.width = `${loaded}%`
  loaderPct.textContent = `${loaded}%`
}
;['loadeddata', 'canplay', 'loadedmetadata', 'progress', 'durationchange', 'error'].forEach((ev) =>
  video.addEventListener(ev, bump),
)

let finished = false
const finish = () => {
  if (finished) return
  finished = true
  loaderFill.style.width = '100%'
  loaderPct.textContent = '100%'
  // wait a beat so the 100% is visible
  setTimeout(boot, 350)
}

if (video.readyState >= 3) finish()
else {
  video.addEventListener('canplaythrough', finish, { once: true })
  // safety: never hang the loader more than 8s
  setTimeout(finish, 8000)
}

// ---------- hero intro ----------
function introAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.from('.hero-eyebrow', { autoAlpha: 0, y: 20, duration: 0.6 })
    .from('.hero-line', { autoAlpha: 0, y: 90, rotateX: -40, stagger: 0.12, duration: 0.9 }, '-=0.2')
    .from('.hero-tag', { autoAlpha: 0, y: 20, duration: 0.6 }, '-=0.4')
    .from('.scroll-hint', { autoAlpha: 0, duration: 0.6 }, '-=0.2')

  gsap.to('.hero-title', {
    yPercent: 45,
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  })
}

// ---------- reduced motion ----------
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  video.currentTime = 0
  ScrollTrigger.getAll().forEach((st) => st.kill())
  loader.remove()
}
