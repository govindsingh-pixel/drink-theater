import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Premium video scroll journey.
 * Pinned video that scrubs frame-by-frame with scroll.
 * Chapters = ingredient labels synced to video timestamps.
 */
export function buildVideoJourney(drink, section) {
  const video = section.querySelector('.journey-video')
  const labelEl = section.querySelector('.chapter-label')
  const progressBar = section.querySelector('.progress-fill')
  const chapters = drink.chapters || []
  const duration = video.duration

  let currentChapter = -1

  const setChapter = (i) => {
    if (i === currentChapter) return
    currentChapter = i
    if (i < 0 || !chapters[i]) {
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

  // smooth proxy so currentTime jumps don't stutter
  const proxy = { t: 0 }
  let targetT = 0

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${Math.round(duration * 100)}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    onUpdate(self) {
      targetT = self.progress * duration
      gsap.to(proxy, {
        t: targetT,
        duration: 0.15,
        ease: 'power2.out',
        overwrite: true,
        onUpdate() {
          if (video.readyState >= 1) video.currentTime = proxy.t
        },
      })
      if (progressBar) progressBar.style.transform = `scaleX(${self.progress})`

      const t = self.progress * duration
      let idx = -1
      for (let i = 0; i < chapters.length; i++) {
        if (t >= chapters[i].t) idx = i
      }
      setChapter(idx)
    },
  })

  return st
}
