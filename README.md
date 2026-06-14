# Sharad weds Sakshi — Wedding Invitation

An animated, single-page wedding invitation website (Royal Jaipur theme).
Pure HTML/CSS/JS — no build step required.

**Date:** Monday, 6th July 2026 · Jaipur

## Highlights

- Royal splash with self-drawing mandala, gold-dust particles and a "royal doors" reveal
- Animated marigold garland, falling petals, fireflies and a leafy vine photo frame
- Scroll-drawn festivities timeline, live countdown, photo slideshow
- Lottie animations (diya, fireworks, blooming flowers, floating hearts) sourced and bundled locally
- Background music, custom cursor, section dot-nav
- Automatic **lite mode** — strips ambience on low-powered devices to keep scrolling smooth
- Fully responsive, with reduced-motion support

## Run locally

It's a static site — serve the folder with any web server:

```bash
python3 -m http.server 8741
# then open http://localhost:8741
```

## Tech

GSAP (+ ScrollTrigger, SplitText, ScrollToPlugin), Lenis smooth scroll,
tsParticles, lottie-web and canvas-confetti — all vendored under `assets/vendor/`
so the site works fully offline.

## Credits

- Animations via [LottieFiles](https://lottiefiles.com) (Lottie Simple License)
- Fonts via Google Fonts
