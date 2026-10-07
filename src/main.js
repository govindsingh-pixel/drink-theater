import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { activeDrink } from './data/drinks.js'
import { buildImageJourney } from './timeline/buildImageJourney.js'

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
    <div class="stage">
      <div class="stage-glow" aria-hidden="true"></div>
    </div>
    <div class="vignette"></div>
    <div class="grain"></div>
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

// ---------- journey: HD image scroll-scrub ----------
function bootJourney() {
  buildImageJourney(activeDrink.acts, document.querySelector('.journey'), import.meta.env.BASE_URL)
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
