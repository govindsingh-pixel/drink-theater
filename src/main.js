import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { activeDrink } from './data/drinks.js'
import { buildDrinkTimeline } from './timeline/buildDrinkTimeline.js'

gsap.registerPlugin(ScrollTrigger)

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="hero">
    <div class="hero-bg"></div>
    <h1 class="hero-title" aria-label="${activeDrink.name}">
      ${activeDrink.name.split(' ')[0].toUpperCase()}
    </h1>
    <p class="hero-tag">${activeDrink.tagline}</p>
    <div class="scroll-hint">
      <span>Scroll to make it</span>
      <div class="scroll-arrow"></div>
    </div>
  </header>

  <section class="stage" aria-label="Drink making journey">
    <div class="stage-inner">
      <div class="step-dots" aria-hidden="true">
        ${activeDrink.steps.map((s) => `<span class="step-dot" title="${s.label}"></span>`).join('')}
      </div>

      <div class="step-label"></div>

      <div class="glass-wrap">
        <div class="liquid"><div class="liquid-fill"></div></div>
        <img class="glass-img" src="${activeDrink.glass}" alt="Empty glass" />
      </div>

      <img class="finished-drink" src="${activeDrink.finished}" alt="${activeDrink.name} ready" />

      ${activeDrink.steps
        .map(
          (s) => `
        <img class="ingredient ${s.assetClass}" data-ing="${s.key}" src="${s.asset}" alt="" aria-hidden="true" />
      `,
        )
        .join('')}
    </div>
  </section>

  <section class="cta">
    <h2>Apni drink banwani hai?</h2>
    <p>Ek drink, ek scroll, zero recipe text.</p>
    <form class="cta-form" action="mailto:hello@example.com" method="get" enctype="text/plain">
      <input type="email" name="body" placeholder="your@email.com" required aria-label="Email" />
      <button type="submit">Banao</button>
    </form>
    <footer class="footer">drink-theater — built with GSAP ScrollTrigger</footer>
  </section>
`

buildDrinkTimeline(activeDrink, document.querySelector('.stage'))

// hero parallax on the giant title
gsap.to('.hero-title', {
  yPercent: 60,
  autoAlpha: 0.15,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
})

// reduced motion: skip scrub journey, show finished state
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  ScrollTrigger.getAll().forEach((st) => st.kill())
  gsap.set('.glass-wrap', { autoAlpha: 0 })
  gsap.set('.finished-drink', { autoAlpha: 1, scale: 1 })
  gsap.set('.step-label', { autoAlpha: 1, y: 0, textContent: activeDrink.name })
}
