import gsap from 'gsap'

/**
 * Data-driven drink journey timeline.
 * One pinned section + one scrubbed timeline built from drink.steps.
 * Scroll = the drink being made.
 */
export function buildDrinkTimeline(drink, stage) {
  const { steps } = drink

  const liquid = stage.querySelector('.liquid-fill')
  const glassWrap = stage.querySelector('.glass-wrap')
  const labelEl = stage.querySelector('.step-label')
  const finishedEl = stage.querySelector('.finished-drink')
  const stepDots = stage.querySelectorAll('.step-dot')

  // initial state: ingredients parked off-screen per step.from
  steps.forEach((step, i) => {
    const el = stage.querySelector(`[data-ing="${step.key}"]`)
    if (!el) return
    gsap.set(el, {
      x: step.from.x,
      y: step.from.y,
      rotate: step.from.rotate,
      scale: step.from.scale,
      autoAlpha: 0,
    })
  })
  gsap.set(liquid, { height: '0%' })
  gsap.set(finishedEl, { autoAlpha: 0, scale: 0.9 })
  gsap.set(labelEl, { autoAlpha: 0, y: 20 })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: `+=${(steps.length + 1) * 100}%`,
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
    },
  })

  steps.forEach((step, i) => {
    const el = stage.querySelector(`[data-ing="${step.key}"]`)
    const at = i * step.duration

    // label: in -> hold -> out
    tl.call(() => setLabel(step.label, i), null, at)
    tl.fromTo(
      labelEl,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.25 },
      at,
    )
    tl.to(labelEl, { autoAlpha: 0, y: -20, duration: 0.25 }, at + step.duration - 0.3)

    if (el) {
      // fly in from -> to (into the glass)
      tl.to(
        el,
        {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 0.55,
          autoAlpha: 1,
          duration: step.duration * 0.5,
          ease: 'power2.out',
        },
        at,
      )
      // settle: shrink into glass + fade as it "mixes in"
      tl.to(
        el,
        {
          x: 0,
          y: 40,
          scale: 0.3,
          autoAlpha: 0,
          duration: step.duration * 0.4,
          ease: 'power1.in',
        },
        at + step.duration * 0.55,
      )
    }

    // liquid rises as the ingredient mixes
    tl.to(
      liquid,
      { height: `${step.liquidTo}%`, duration: step.duration * 0.8, ease: 'none' },
      at + step.duration * 0.3,
    )

    // active dot
    tl.call(() => setActiveDot(i), null, at)
  })

  // finale: glass swaps to finished drink photo
  const finAt = steps.length * steps[0].duration
  tl.to(glassWrap, { autoAlpha: 0, scale: 0.85, duration: 0.5 }, finAt)
  tl.to(finishedEl, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }, finAt + 0.2)
  tl.call(() => setLabel(drink.name, -1), null, finAt)
  tl.fromTo(
    labelEl,
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 0.3 },
    finAt + 0.3,
  )
  tl.to({}, { duration: 0.6 }) // tail hold before unpin

  function setLabel(text, stepIndex) {
    labelEl.textContent = text
    stepDots.forEach((d, i) => {
      d.classList.toggle('is-done', stepIndex >= 0 ? i <= stepIndex : true)
      d.classList.toggle('is-active', i === stepIndex)
    })
  }

  function setActiveDot(i) {
    stepDots.forEach((d, j) => {
      d.classList.toggle('is-active', j === i)
      d.classList.toggle('is-done', j < i)
    })
  }

  return tl
}
