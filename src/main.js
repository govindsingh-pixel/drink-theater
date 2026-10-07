import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { activeDrink } from './data/drinks.js'
import { build3DJourney } from './timeline/build3DJourney.js'
import { buildVideoJourney } from './timeline/buildVideoJourney.js'

gsap.registerPlugin(ScrollTrigger)

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="hero">
    <div class="hero-bg"></div>
    <p class="hero-eyebrow">Drink Theater presents</p>
    <h1 class="hero-title" aria-label="${activeDrink.name}">
      <span class="hero-line">VIRGIN</span>
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
      <div class="stage-glow" aria-hidden="true"></div>
      <canvas class="drink-canvas"></canvas>
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

bootJourney()
introAnimation()

// ---------- journey: try 3D, fall back to video scrub ----------
function bootJourney() {
  const journey = document.querySelector('.journey')
  const scene = build3DJourney(activeDrink, journey)
  if (scene) return

  const wrap = journey.querySelector('.video-frame')
  const bg = document.createElement('video')
  bg.className = 'journey-video journey-video--bg'
  bg.src = activeDrink.video
  bg.muted = true
  bg.playsInline = true
  bg.preload = 'auto'
  bg.setAttribute('aria-hidden', 'true')
  bg.tabIndex = -1
  const fg = document.createElement('video')
  fg.className = 'journey-video journey-video--fg'
  fg.src = activeDrink.video
  fg.muted = true
  fg.playsInline = true
  fg.preload = 'auto'
  wrap.append(bg, fg)
  const start = () => buildVideoJourney(activeDrink, journey)
  if (fg.readyState >= 1) start()
  else fg.addEventListener('loadedmetadata', start, { once: true })
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
