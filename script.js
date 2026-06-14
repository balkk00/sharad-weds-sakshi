/* ============================================================
   SHARAD & SAKSHI — ROYAL JAIPUR EDITION · INTERACTIVE SCRIPT
   GSAP + ScrollTrigger + SplitText + Lenis + tsParticles +
   lottie-web (external assets) + canvas-confetti + procedural
   SVG (mandalas · marigold garland · vine frame · string lights)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);

    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const MOBILE = window.matchMedia('(max-width: 768px)').matches;

    // --- perf: pause infinite tweens & lottie players while their
    //     section is off-screen (they otherwise repaint every frame) ---
    function gateAmbient(trigger, getTargets) {
        const apply = active => {
            gsap.getTweensOf(getTargets()).forEach(t => {
                if (t.repeat && t.repeat() === -1) active ? t.play() : t.pause();
            });
        };
        const st = ScrollTrigger.create({
            trigger, start: 'top bottom', end: 'bottom top',
            onToggle: s => apply(s.isActive)
        });
        apply(st.isActive);
        return st;
    }
    const lottieAnims = [];   // {anim, container} — gated after creation

    // always greet visitors with the splash at the top of the page
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // ===== REFERENCES =====
    const splashOverlay = document.getElementById('splash-overlay');
    const openInviteBtn = document.getElementById('open-invite-btn');
    const mainContent   = document.getElementById('main-content');
    const musicToggle   = document.getElementById('music-toggle');
    const bgMusic       = document.getElementById('bg-music');
    const doorL         = document.querySelector('.door-left');
    const doorR         = document.querySelector('.door-right');
    const petalsContainer = document.getElementById('petals-container');

    let musicPlaying = false;
    let invitationOpened = false;

    // ============================================================
    // SMOOTH SCROLL (Lenis) — wired into GSAP's ticker
    // ============================================================
    const lenis = new Lenis({ duration: 1.0, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const lenisTick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // page is locked behind the splash

    const isLite = () => document.body.classList.contains('lite');
    const scrollToSection = (target) => {
        if (isLite()) gsap.to(window, { scrollTo: target, duration: .8, ease: 'power2.out' });
        else lenis.scrollTo(target, { duration: 1.6 });
    };

    // ============================================================
    // SVG HELPERS
    // ============================================================
    const SVGNS = 'http://www.w3.org/2000/svg';
    function el(name, attrs, parent) {
        const n = document.createElementNS(SVGNS, name);
        for (const k in attrs) n.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(n);
        return n;
    }

    // ============================================================
    // PROCEDURAL SVG — MANDALA (concentric petal rings, drawable)
    // ============================================================
    function petalPath(cx, cy, rIn, rOut, angleDeg, widthDeg) {
        const a = angleDeg * Math.PI / 180;
        const w = widthDeg * Math.PI / 180 / 2;
        const tipX = cx + rOut * Math.cos(a), tipY = cy + rOut * Math.sin(a);
        const bX1 = cx + rIn * Math.cos(a - w), bY1 = cy + rIn * Math.sin(a - w);
        const bX2 = cx + rIn * Math.cos(a + w), bY2 = cy + rIn * Math.sin(a + w);
        const mid = rIn + (rOut - rIn) * 0.55;
        const c1X = cx + mid * Math.cos(a - w * 1.6), c1Y = cy + mid * Math.sin(a - w * 1.6);
        const c2X = cx + mid * Math.cos(a + w * 1.6), c2Y = cy + mid * Math.sin(a + w * 1.6);
        return `M ${bX1.toFixed(1)} ${bY1.toFixed(1)} Q ${c1X.toFixed(1)} ${c1Y.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${c2X.toFixed(1)} ${c2Y.toFixed(1)} ${bX2.toFixed(1)} ${bY2.toFixed(1)}`;
    }

    function buildMandala(svg) {
        if (!svg) return;
        const C = 300;
        const vb = svg.viewBox.baseVal;
        const scale = (vb && vb.width ? vb.width : 600) / 600;
        const g = el('g', {
            fill: 'none', stroke: 'currentColor',
            'stroke-width': 1.2 / scale,
            'stroke-linecap': 'round',
            transform: scale !== 1 ? `scale(${scale})` : ''
        }, svg);

        [288, 282, 232, 174, 118, 64, 40].forEach(r => el('circle', { cx: C, cy: C, r, pathLength: 100 }, g));
        [[24, 232, 280, 9], [16, 174, 228, 14], [12, 118, 170, 18], [8, 64, 114, 26]].forEach(([n, rIn, rOut, w]) => {
            for (let i = 0; i < n; i++) el('path', { d: petalPath(C, C, rIn, rOut, i * 360 / n - 90, w), pathLength: 100 }, g);
        });
        for (let i = 0; i < 36; i++) {
            const a = i * 10 * Math.PI / 180;
            el('circle', { cx: (C + 252 * Math.cos(a)).toFixed(1), cy: (C + 252 * Math.sin(a)).toFixed(1), r: 2.2, fill: 'currentColor', stroke: 'none' }, g);
        }
        let d = '';
        for (let i = 0; i <= 16; i++) {
            const r = i % 2 === 0 ? 40 : 18;
            const a = (i * 22.5 - 90) * Math.PI / 180;
            d += `${i === 0 ? 'M' : 'L'} ${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)} `;
        }
        el('path', { d: d + 'Z', pathLength: 100 }, g);
        el('circle', { cx: C, cy: C, r: 6, fill: 'currentColor', stroke: 'none' }, g);
        return g;
    }

    // ============================================================
    // PROCEDURAL SVG — ROYAL FLOWER TORAN (hero top)
    // A gold rail with a deep draped swag, long hanging side strands of
    // strung rosettes + beads ending in tassels (a reversed-U / ∩ arch),
    // and a central medallion. viewBox width tracks the screen and CSS
    // height is auto, so the ratio is fixed → it never stretches.
    // ============================================================
    function buildGarland(svg) {
        if (!svg) return [];
        const W = Math.max(window.innerWidth, 360);
        const H = 212;
        gsap.killTweensOf(svg);
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.innerHTML = '';

        const defs = el('defs', {}, svg);
        const g1 = el('linearGradient', { id: 'valGold', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
        el('stop', { offset: '0%', 'stop-color': '#f7e7a8' }, g1);
        el('stop', { offset: '45%', 'stop-color': '#d4af37' }, g1);
        el('stop', { offset: '100%', 'stop-color': '#9a7416' }, g1);
        const g2 = el('radialGradient', { id: 'valBead' }, defs);
        el('stop', { offset: '0%', 'stop-color': '#fff3c4' }, g2);
        el('stop', { offset: '55%', 'stop-color': '#e8cf7a' }, g2);
        el('stop', { offset: '100%', 'stop-color': '#b8902c' }, g2);
        const g3 = el('radialGradient', { id: 'valRose' }, defs);
        el('stop', { offset: '0%', 'stop-color': '#eaa0b3' }, g3);
        el('stop', { offset: '100%', 'stop-color': '#b14a68' }, g3);

        const railY = 6;

        // --- small strung-element helpers ---
        const rosette = (parent, x, y, r) => {
            const f = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, parent);
            for (let k = 0; k < 6; k++) {
                const a = k * 60 * Math.PI / 180;
                el('circle', { cx: (r * Math.cos(a)).toFixed(1), cy: (r * Math.sin(a)).toFixed(1), r: (r * .6).toFixed(1), fill: 'url(#valBead)' }, f);
            }
            el('circle', { cx: 0, cy: 0, r: (r * .72).toFixed(1), fill: 'url(#valGold)' }, f);
            el('circle', { cx: 0, cy: 0, r: (r * .28).toFixed(1), fill: '#6b1c34', opacity: .75 }, f);
        };
        const bead = (parent, x, y, r, rose) => el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r, fill: rose ? 'url(#valRose)' : 'url(#valBead)' }, parent);
        const medallion = (parent) => {
            el('line', { x1: 0, y1: 0, x2: 0, y2: 18, stroke: '#9a7416', 'stroke-width': 1.5 }, parent);
            const m = el('g', { transform: 'translate(0 33)' }, parent);
            for (let k = 0; k < 12; k++) {
                const a = k * 30 * Math.PI / 180;
                el('line', { x1: (10 * Math.cos(a)).toFixed(1), y1: (10 * Math.sin(a)).toFixed(1), x2: (16 * Math.cos(a)).toFixed(1), y2: (16 * Math.sin(a)).toFixed(1), stroke: '#d4af37', 'stroke-width': 1.2 }, m);
            }
            el('circle', { cx: 0, cy: 0, r: 10.5, fill: 'url(#valBead)', stroke: '#9a7416', 'stroke-width': 1 }, m);
            el('circle', { cx: 0, cy: 0, r: 4, fill: '#6b1c34' }, m);
            el('circle', { cx: 0, cy: 0, r: 1.6, fill: 'url(#valBead)' }, m);
            el('path', { d: 'M0 16 C6 21 6 30 0 33 C-6 30 -6 21 0 16 Z', fill: 'url(#valBead)' }, parent);
        };

        // top rail (gold molding)
        el('rect', { x: 0, y: 0, width: W, height: 6, fill: 'url(#valGold)' }, svg);
        el('line', { x1: 0, y1: 6.5, x2: W, y2: 6.5, stroke: '#8a6a14', 'stroke-width': 1, opacity: .7 }, svg);

        const gap = 84;
        const n = Math.max(4, Math.round(W / gap));
        const step = W / n;
        const danglers = [];

        // deep draped swag chain across the top + strung beads/rosettes
        let chain = `M 0 ${railY} `;
        for (let i = 0; i < n; i++) chain += `Q ${((i + .5) * step).toFixed(1)} ${railY + 36} ${((i + 1) * step).toFixed(1)} ${railY} `;
        const cp = el('path', { d: chain, fill: 'none', stroke: '#b8902c', 'stroke-width': 1.6, opacity: .85 }, svg);
        const clen = cp.getTotalLength();
        const cN = Math.max(1, Math.floor(clen / 26));
        for (let i = 0; i <= cN; i++) {
            const pt = cp.getPointAtLength(i * clen / cN);
            if (i % 3 === 0) rosette(svg, pt.x, pt.y, 4.6);
            else bead(svg, pt.x, pt.y, 2.6, i % 3 === 2);
        }

        // medium latkan danglers from the interior nodes; medallion at centre
        const mid = Math.round(n / 2);
        for (let i = 1; i < n; i++) {
            const x = i * step;
            const d = el('g', { transform: `translate(${x.toFixed(1)} ${railY})`, class: 'garland-dangler' }, svg);
            if (i === mid) {
                medallion(d);
            } else {
                const len = (i % 2 ? 22 : 34);
                el('line', { x1: 0, y1: 0, x2: 0, y2: len, stroke: '#9a7416', 'stroke-width': 1.3 }, d);
                el('circle', { cx: 0, cy: len, r: 2.7, fill: 'url(#valGold)' }, d);
                el('path', { d: `M0 ${len + 2} C6 ${len + 7} 6 ${len + 17} 0 ${len + 19} C-6 ${len + 17} -6 ${len + 7} 0 ${len + 2} Z`, fill: 'url(#valBead)', stroke: '#9a7416', 'stroke-width': .7 }, d);
                bead(d, 0, len + 9, 1.4, true);
            }
            danglers.push(d);
        }

        // long hanging side strands — the legs of the reversed-U arch
        const legLen = Math.min(184, H - 26);
        const buildLeg = (xPos, dir) => {
            const g = el('g', { transform: `translate(${xPos.toFixed(1)} ${railY})`, class: 'garland-dangler' }, svg);
            const lp = el('path', { d: `M0 0 Q ${6 * dir} ${(legLen * .5).toFixed(1)} 0 ${legLen}`, fill: 'none', stroke: '#9a7416', 'stroke-width': 1.7, opacity: .85 }, g);
            const ll = lp.getTotalLength();
            const nE = Math.max(2, Math.floor(ll / 21));
            for (let i = 1; i <= nE; i++) {
                const pt = lp.getPointAtLength(i * ll / nE);
                if (i % 2 === 0) rosette(g, pt.x, pt.y, 5.2);
                else bead(g, pt.x, pt.y, 3, i % 4 === 3);
            }
            // tassel at the tip
            const tip = lp.getPointAtLength(ll);
            const t = el('g', { transform: `translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)})` }, g);
            el('circle', { cx: 0, cy: 0, r: 5, fill: 'url(#valGold)' }, t);
            el('path', { d: 'M0 4 C7 9 7 20 0 24 C-7 20 -7 9 0 4 Z', fill: 'url(#valBead)', stroke: '#9a7416', 'stroke-width': .8 }, t);
            for (let k = -2; k <= 2; k++) el('line', { x1: k * 1.7, y1: 20, x2: k * 2.6, y2: 33, stroke: '#c9a227', 'stroke-width': 1 }, t);
            return g;
        };
        danglers.push(buildLeg(13, 1));
        danglers.push(buildLeg(W - 13, -1));

        // gentle pendulum sway of the WHOLE svg — composited (no re-raster)
        gsap.killTweensOf(svg);
        if (!RM) gsap.fromTo(svg, { rotation: -0.55 }, { rotation: 0.55, transformOrigin: '50% 0%', duration: 5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        return danglers;
    }

    // ============================================================
    // PROCEDURAL SVG — VINE FRAME around the photo slideshow
    // (leafy creeper that draws itself and keeps swaying)
    // ============================================================
    let vineState = null;
    function buildVineFrame(svg, animateIn) {
        if (!svg) return;
        const cont = svg.parentElement;
        if (!cont.offsetWidth) return;
        gsap.killTweensOf(svg.querySelectorAll('*'));
        svg.innerHTML = '';
        const w = cont.offsetWidth + 32, h = cont.offsetHeight + 32;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('preserveAspectRatio', 'none');

        const inset = 9, r = 16;
        const d = `M ${w / 2} ${inset}
                   H ${w - inset - r} A ${r} ${r} 0 0 1 ${w - inset} ${inset + r}
                   V ${h - inset - r} A ${r} ${r} 0 0 1 ${w - inset - r} ${h - inset}
                   H ${inset + r} A ${r} ${r} 0 0 1 ${inset} ${h - inset - r}
                   V ${inset + r} A ${r} ${r} 0 0 1 ${inset + r} ${inset}
                   H ${w / 2}`;
        const path = el('path', { d, class: 'vine-path' }, svg);
        const len = path.getTotalLength();

        const leaves = [], buds = [];
        const step = 34;
        for (let dist = step * .6, i = 0; dist < len - 10; dist += step, i++) {
            const p = path.getPointAtLength(dist);
            const p2 = path.getPointAtLength(Math.min(len, dist + 2));
            const ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
            const side = i % 2 ? 48 : -48;
            const L = 16 + (i * 7 % 5) * 2.2;
            const g = el('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(ang + side).toFixed(1)})` }, svg);
            const leaf = el('path', {
                d: `M0 0 Q ${L * .42} ${-L * .32} ${L} 0 Q ${L * .42} ${L * .32} 0 0 Z`,
                class: 'vine-leaf' + (i % 4 === 3 ? ' gold' : '')
            }, g);
            // centre vein
            el('path', { d: `M2 0 L ${L * .82} 0`, stroke: 'rgba(250,244,230,.55)', 'stroke-width': .9, fill: 'none' }, g);
            leaves.push(leaf);

            // curling tendril every few leaves
            if (i % 5 === 2) {
                const tg = el('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(ang - side).toFixed(1)})` }, svg);
                const t = el('path', {
                    d: 'M0 0 Q 8 -2 10 -7 Q 11.5 -11.5 8 -12.5 Q 5 -13 5 -10 Q 5 -8 7.5 -8.5',
                    class: 'vine-tendril'
                }, tg);
                leaves.push(t);
            }
            // rose buds and little blossoms alternate along the vine
            if (i % 4 === 0) {
                const b = el('circle', { cx: p.x, cy: p.y, r: 3.4, class: 'vine-bud' }, svg);
                buds.push(b);
            } else if (i % 4 === 2) {
                const fg = el('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` }, svg);
                for (let k = 0; k < 5; k++) {
                    const a = k * 72 * Math.PI / 180;
                    el('circle', { cx: (3.1 * Math.cos(a)).toFixed(1), cy: (3.1 * Math.sin(a)).toFixed(1), r: 2.1, class: 'vine-blossom' }, fg);
                }
                el('circle', { cx: 0, cy: 0, r: 1.7, fill: '#d4af37' }, fg);
                buds.push(fg);
            }
        }

        gsap.set(path, { strokeDasharray: len, strokeDashoffset: animateIn ? len : 0 });
        gsap.set(leaves, { scale: animateIn ? 0 : 1, transformOrigin: '0% 50%' });
        gsap.set(buds, { scale: animateIn ? 0 : 1, transformOrigin: 'center' });

        // whole-frame breath instead of per-leaf tweens — per-leaf animation
        // forced a full re-raster of the vine svg every single frame
        gsap.killTweensOf(svg);
        if (!RM) gsap.to(svg, { rotation: .6, transformOrigin: '50% 50%', duration: 3.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });

        vineState = { path, len, leaves, buds };
        return vineState;
    }

    function playVineDraw() {
        if (!vineState) return;
        gsap.timeline({ defaults: { ease: 'power2.out' } })
            .to(vineState.path, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' })
            .to(vineState.leaves, { scale: 1, duration: .5, ease: 'back.out(2.4)', stagger: .035 }, .25)
            .to(vineState.buds, { scale: 1, duration: .45, ease: 'back.out(3)', stagger: .1 }, .6);
    }

    // ============================================================
    // PROCEDURAL SVG — STRING LIGHTS (countdown + venue)
    // ============================================================
    function buildStringLights(svg) {
        if (!svg) return;
        gsap.killTweensOf(svg.querySelectorAll('*'));
        svg.innerHTML = '';
        const W = svg.parentElement.offsetWidth || window.innerWidth;
        const H = 130;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        const colors = ['#ffd98a', '#e8cf7a', '#f0a8b8'];

        for (let k = 0; k < 2; k++) {
            const swags = Math.max(2, Math.round(W / 430)) + k;
            const sw = W / swags;
            const y0 = 4 + k * 9;
            const sag = 34 + k * 16;
            let dPath = `M 0 ${y0} `;
            for (let s = 0; s < swags; s++) {
                dPath += `Q ${(s + .5) * sw} ${y0 + sag * 2} ${(s + 1) * sw} ${y0} `;
            }
            const wire = el('path', { d: dPath, class: 'light-wire' }, svg);
            const len = wire.getTotalLength();
            const n = Math.round(len / (MOBILE ? 88 : 64));
            for (let i = 1; i < n; i++) {
                const p = wire.getPointAtLength(len * i / n);
                const c = colors[(i + k) % colors.length];
                const drop = 7 + ((i * 5) % 3) * 3 + k * 3;
                const g = el('g', { class: 'bulb' }, svg);
                el('line', { x1: p.x, y1: p.y, x2: p.x, y2: p.y + drop, stroke: 'rgba(212,175,55,.5)', 'stroke-width': 1 }, g);
                el('circle', { cx: p.x, cy: p.y + drop + 5, r: 7.5, fill: c, class: 'bulb-glow' }, g);
                el('circle', { cx: p.x, cy: p.y + drop + 5, r: 3.2, fill: c }, g);
                // twinkle only every third bulb, slowly — each tween repaints the strip
                if (!RM && i % 3 === 0) gsap.fromTo(g, { opacity: .5 }, { opacity: 1, duration: 1.6 + ((i * 13) % 10) / 5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: ((i * 7) % 20) / 10 });
            }
        }
    }

    // ============================================================
    // PROCEDURAL SVG — CORNER ORNAMENT (quarter-mandala fan)
    // ============================================================
    function buildCornerOrnament(svg) {
        if (!svg) return;
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.innerHTML = '';
        const g = el('g', {
            fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round'
        }, svg);

        // concentric quarter arcs from the corner
        [64, 100, 138, 168].forEach(r => {
            el('path', { d: `M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`, pathLength: 100 }, g);
        });
        // petal fan between the middle arcs
        for (let a = 8; a <= 82; a += 15) {
            el('path', { d: petalPath(0, 0, 100, 136, a, 10), pathLength: 100 }, g);
        }
        // dot ring
        const dots = [];
        for (let a = 6; a <= 84; a += 13) {
            const rad = a * Math.PI / 180;
            dots.push(el('circle', {
                cx: (153 * Math.cos(rad)).toFixed(1), cy: (153 * Math.sin(rad)).toFixed(1),
                r: 2.4, fill: 'currentColor', stroke: 'none'
            }, g));
        }
        // small diamond accent on the diagonal
        const dr = 42, dx = dr * Math.cos(Math.PI / 4), dy = dr * Math.sin(Math.PI / 4);
        el('path', { d: `M ${dx} ${dy - 9} L ${dx + 9} ${dy} L ${dx} ${dy + 9} L ${dx - 9} ${dy} Z`, pathLength: 100 }, g);

        const paths = g.querySelectorAll('[pathLength]');
        gsap.set(paths, { strokeDasharray: 100, strokeDashoffset: 100 });
        gsap.set(dots, { scale: 0, transformOrigin: 'center' });

        ScrollTrigger.create({
            trigger: svg.parentElement, start: 'top 75%', once: true,
            onEnter: () => {
                gsap.to(paths, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: .05 });
                gsap.to(dots, { scale: 1, duration: .5, ease: 'back.out(2.5)', stagger: .05, delay: .9 });
            }
        });
    }

    // ============================================================
    // SPLASH — mandala draw-on + tsParticles gold dust + entrance
    // ============================================================
    const splashMandala = document.getElementById('splash-mandala');
    buildMandala(splashMandala);

    const splashPaths = splashMandala ? splashMandala.querySelectorAll('[pathLength]') : [];
    gsap.set(splashPaths, { strokeDasharray: 100, strokeDashoffset: 100 });
    gsap.to(splashPaths, {
        strokeDashoffset: 0,
        duration: RM ? .01 : 2.6,
        ease: 'power2.inOut',
        stagger: { each: .012, from: 'random' }
    });
    gsap.to(splashMandala, { rotation: 360, duration: 240, repeat: -1, ease: 'none' });

    const splashIntro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    splashIntro
        .from('.splash-arch-frame', { opacity: 0, y: 40, scale: .88, duration: 1.2 }, .25)
        .from('.splash-subtitle', { opacity: 0, y: 24, duration: .9 }, '-=.6');

    const splashNamesSplit = new SplitText('.splash-names', { type: 'chars', charsClass: 'char' });
    splashIntro
        .from(splashNamesSplit.chars, {
            opacity: 0, y: 44, rotateX: -70, transformOrigin: '50% 100%',
            duration: 1, stagger: .045, ease: 'back.out(1.6)'
        }, '-=.45')
        .from('.splash-divider', { opacity: 0, scaleX: 0, duration: .8 }, '-=.4')
        .from('.splash-date', { opacity: 0, y: 18, duration: .8 }, '-=.5')
        .from('.open-invite-btn', { opacity: 0, y: 24, scale: .9, duration: .9, ease: 'back.out(1.8)' }, '-=.4');

    gsap.to('.splash-couple-art', { scale: 1.02, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    // gold dust field (tsParticles — twinkling, cursor-reactive)
    let splashParticles = null;
    if (typeof tsParticles !== 'undefined' && !RM) {
        tsParticles.load({
            id: 'sparkle-particles',
            options: {
                fullScreen: { enable: false },
                fpsLimit: 60,
                detectRetina: true,
                particles: {
                    number: { value: MOBILE ? 38 : 70, density: { enable: true } },
                    color: { value: ['#e8cf7a', '#d4af37', '#fff6e0'] },
                    shape: { type: ['circle', 'star'] },
                    opacity: { value: { min: .15, max: .8 }, animation: { enable: true, speed: .9, sync: false } },
                    size: { value: { min: .8, max: 2.8 } },
                    move: { enable: true, direction: 'top', speed: { min: .25, max: .8 }, outModes: { default: 'out' } },
                    shadow: { enable: true, blur: 5, color: '#e8cf7a' },
                    twinkle: { particles: { enable: true, frequency: .06, color: { value: '#fff6e0' } } }
                },
                interactivity: {
                    events: { onHover: { enable: true, mode: 'bubble' } },
                    modes: { bubble: { distance: 120, size: 4, duration: 2, opacity: 1 } }
                }
            }
        }).then(c => { splashParticles = c; }).catch(() => {});
    }

    // ============================================================
    // EXTERNAL LOTTIE ANIMATIONS (sourced from the internet,
    // served from assets/external — see manifest.json)
    // ============================================================
    function initLottieSpots() {
        if (typeof lottie === 'undefined') return;
        fetch('assets/external/manifest.json', { cache: 'no-store' })
            .then(r => r.json())
            .then(manifest => {
                const lotties = manifest.filter(m => m.kind === 'lottie');
                const pathFor = m => 'assets/external/' + (m.file.includes('/') ? m.file : 'lottie/' + m.file);
                const pick = words => {
                    const m = lotties.find(a => words.some(w => (a.file + ' ' + (a.desc || '')).toLowerCase().includes(w)));
                    return m ? pathFor(m) : null;
                };

                const spots = [
                    { sel: '#lottie-toran',       words: ['toran', 'garland', 'hanging', 'bunting'], speed: .7 },
                    { sel: '#lottie-couple-anim', words: ['couple', 'bride', 'groom'] },
                    { sel: '#lottie-hearts',      words: ['heart', 'love'] },
                    { sel: '.lottie-bloom',       words: ['bloom', 'floral', 'flower'], all: true, speed: .8 },
                    { sel: '#lottie-diya-spot',   words: ['diya', 'lamp', 'candle', 'flame'],
                      onload: () => { const dr = document.querySelector('.diya-row'); if (dr) dr.style.display = 'none'; } },
                    { sel: '#lottie-fireworks',   words: ['firework', 'celebrat'], speed: .85 }
                ];

                let loadedAny = false;
                spots.forEach(spot => {
                    const path = pick(spot.words);
                    if (!path) return;
                    const targets = spot.all ? document.querySelectorAll(spot.sel) : [document.querySelector(spot.sel)];
                    targets.forEach(t => {
                        if (!t) return;
                        try {
                            const anim = lottie.loadAnimation({
                                container: t, renderer: 'svg', loop: true, autoplay: true, path,
                                rendererSettings: { progressiveLoad: true }
                            });
                            anim.setSubframe(false); // cap to the animation's own fps
                            if (spot.speed) anim.setSpeed(spot.speed);
                            anim.addEventListener('data_failed', () => t.classList.remove('loaded'));
                            t.classList.add('loaded');
                            loadedAny = true;
                            if (spot.onload) anim.addEventListener('DOMLoaded', spot.onload);
                            lottieAnims.push({ anim, container: t });
                            // pause whenever the host section scrolls out of view
                            const sec = t.closest('.section');
                            if (sec) {
                                ScrollTrigger.create({
                                    trigger: sec, start: 'top bottom', end: 'bottom top',
                                    onToggle: s => s.isActive ? anim.play() : anim.pause()
                                });
                            }
                        } catch (e) { /* asset missing — keep procedural fallback */ }
                    });
                });
                if (loadedAny) setTimeout(() => ScrollTrigger.refresh(), 800);
            })
            .catch(() => { /* no manifest — procedural art carries the show */ });
    }
    initLottieSpots();

    // ============================================================
    // FALLING PETALS — DOM layer (marigold, gold & rose petals)
    // ============================================================
    const PETAL_STYLES = [
        { bg: 'radial-gradient(ellipse at 30% 30%, #f6c453, #e8962e 72%)', br: '50% 0 50% 50%' },
        { bg: 'radial-gradient(ellipse at 30% 30%, #e8cf7a, #c9a227 75%)', br: '0 50% 50% 50%' },
        { bg: 'radial-gradient(ellipse at 35% 30%, #d98aa3, #b14a68 78%)', br: '50% 50% 0 50%' },
        { bg: 'radial-gradient(ellipse at 30% 35%, #f3e6bd, #d4af37 80%)', br: '50% 50% 50% 0' },
        { bg: 'radial-gradient(ellipse at 30% 30%, #f0b9c8, #c76b7f 78%)', br: '46% 12% 46% 50%' },
        { bg: 'radial-gradient(ellipse at 35% 25%, #ffd9a0, #e8962e 80%)', br: '12% 50% 46% 50%' }
    ];

    const PETAL_CAP = MOBILE ? 12 : 18;
    function createPetal() {
        if (!petalsContainer || petalsContainer.childElementCount > PETAL_CAP) return;
        const s = PETAL_STYLES[(Math.random() * PETAL_STYLES.length) | 0];
        const size = 9 + Math.random() * 13;
        const petal = document.createElement('span');
        petal.className = 'petal';
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.width = size + 'px';
        petal.style.height = size * (0.9 + Math.random() * .35) + 'px';
        petal.style.setProperty('--fall-duration', (8 + Math.random() * 8) + 's');
        petal.style.setProperty('--fall-delay', (Math.random() * 1.2) + 's');
        petal.style.setProperty('--drift', (Math.random() * 280 - 140) + 'px');
        petal.style.setProperty('--spin', (Math.random() * 1080 - 540) + 'deg');
        petal.style.setProperty('--petal-alpha', (.55 + Math.random() * .4).toFixed(2));

        const inner = document.createElement('span');
        inner.className = 'petal-inner';
        inner.style.background = s.bg;
        inner.style.borderRadius = s.br;
        inner.style.setProperty('--flutter-duration', (1.8 + Math.random() * 1.8) + 's');
        petal.appendChild(inner);

        petalsContainer.appendChild(petal);
        setTimeout(() => petal.remove(), 18500);
    }

    let petalTimer = null;
    function startPetals() {
        if (RM || petalTimer || isLite()) return;
        for (let i = 0; i < (MOBILE ? 8 : 14); i++) setTimeout(createPetal, i * 180);
        petalTimer = setInterval(() => { if (!document.hidden) createPetal(); }, MOBILE ? 1300 : 850);
    }

    // ============================================================
    // AMBIENT FIREFLIES (canvas, very subtle)
    // ============================================================
    const ambient = (() => {
        const canvas = document.getElementById('ambient-canvas');
        if (!canvas || RM || MOBILE) return { start() {} };   // skip entirely on phones
        const ctx = canvas.getContext('2d');
        let running = false, flies = [];

        // pre-rendered glow sprite — shadowBlur per-frame is far too expensive
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 24;
        const sctx = sprite.getContext('2d');
        const grad = sctx.createRadialGradient(12, 12, 0, 12, 12, 12);
        grad.addColorStop(0, 'rgba(255,233,168,1)');
        grad.addColorStop(.25, 'rgba(255,225,150,.75)');
        grad.addColorStop(1, 'rgba(255,225,150,0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 24, 24);

        function fit() {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
        }
        addEventListener('resize', fit); fit();

        const newFly = () => ({
            x: Math.random() * innerWidth, y: Math.random() * innerHeight,
            a1: Math.random() * 6.28, a2: Math.random() * 6.28,
            v1: .2 + Math.random() * .4, v2: .15 + Math.random() * .3,
            tw: 1 + Math.random() * 2, t: Math.random() * 100
        });

        function frame() {
            if (!running) return;
            if (!document.hidden) {
                ctx.clearRect(0, 0, innerWidth, innerHeight);
                for (const f of flies) {
                    f.t += .016;
                    f.a1 += (Math.random() - .5) * .06;
                    f.a2 += (Math.random() - .5) * .06;
                    f.x += Math.cos(f.a1) * f.v1;
                    f.y += Math.sin(f.a2) * f.v2;
                    if (f.x < -10) f.x = innerWidth + 10; if (f.x > innerWidth + 10) f.x = -10;
                    if (f.y < -10) f.y = innerHeight + 10; if (f.y > innerHeight + 10) f.y = -10;
                    ctx.globalAlpha = .2 + .5 * (0.5 + 0.5 * Math.sin(f.t * f.tw));
                    ctx.drawImage(sprite, f.x - 12, f.y - 12);
                }
                ctx.globalAlpha = 1;
            }
            requestAnimationFrame(frame);
        }

        return {
            start() {
                if (running) return;
                running = true;
                flies = Array.from({ length: Math.min(8, Math.round(innerWidth / 180)) }, newFly);
                canvas.classList.add('on');
                frame();
            },
            stop() { running = false; canvas.classList.remove('on'); }
        };
    })();

    // ============================================================
    // PERF WATCHDOG — if the device can't hold a decent frame rate,
    // strip the ambience automatically ("lite mode")
    // ============================================================
    function enterLiteMode() {
        if (isLite()) return;
        document.body.classList.add('lite');
        clearInterval(petalTimer);
        petalTimer = -1; // blocks restarts
        if (petalsContainer) petalsContainer.innerHTML = '';
        ambient.stop();
        lottieAnims.forEach(({ anim }) => { try { anim.pause(); } catch (e) {} });
        // freeze every decorative infinite tween
        gsap.globalTimeline.getChildren(true, true, true).forEach(t => {
            if (t.repeat && t.repeat() === -1) t.pause();
        });
        // native scrolling is snappier than scripted smoothing on weak machines
        try { gsap.ticker.remove(lenisTick); lenis.destroy(); } catch (e) {}
        ScrollTrigger.refresh();
    }
    window.__liteMode = enterLiteMode; // manual escape hatch

    function perfGuard() {
        if (RM) return;
        let frames = 0;
        const t0 = performance.now();
        (function tick() {
            frames++;
            const elapsed = performance.now() - t0;
            if (elapsed < 3000) { requestAnimationFrame(tick); return; }
            const fps = frames / (elapsed / 1000);
            if (fps < 34) enterLiteMode();
        })();
    }

    // ============================================================
    // OPEN INVITATION — confetti burst + royal doors transition
    // ============================================================
    gsap.set(doorL, { xPercent: -102 });
    gsap.set(doorR, { xPercent: 102 });

    openInviteBtn.addEventListener('click', () => {
        if (invitationOpened) return;
        invitationOpened = true;

        // music — start at 1:41 where the melody blooms
        bgMusic.volume = 0;
        bgMusic.play().then(() => {
            bgMusic.currentTime = 101;
            bgMusic.volume = .5;
            musicPlaying = true;
            musicToggle.classList.add('playing');
        }).catch(() => { musicPlaying = false; });

        if (typeof confetti === 'function' && !RM) {
            const r = openInviteBtn.getBoundingClientRect();
            const origin = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
            confetti({ particleCount: 90, spread: 75, startVelocity: 38, origin, colors: ['#d4af37', '#e8cf7a', '#f3e6bd', '#b14a68'], zIndex: 2000, disableForReducedMotion: true });
            confetti({ particleCount: 40, spread: 360, startVelocity: 18, decay: .92, scalar: .8, shapes: ['star'], origin, colors: ['#e8cf7a', '#d4af37'], zIndex: 2000, disableForReducedMotion: true });
        }

        const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
        tl.to('.splash-content', { opacity: 0, y: -36, scale: .96, duration: .55, ease: 'power2.in' }, .12)
          .to(['.splash-mandala', '.sparkle-canvas', '.splash-texture'], { opacity: 0, duration: .5 }, '<')
          .to([doorL, doorR], { xPercent: 0, duration: .7 }, '-=.25')
          .add(() => {
              splashOverlay.classList.add('doors-only');
              splashOverlay.style.pointerEvents = 'none';
              gsap.set('.splash-content', { display: 'none' });
              if (splashParticles) { try { splashParticles.destroy(); } catch (e) {} }
              // stop every splash-only animation for good
              gsap.killTweensOf([splashMandala, '.splash-couple-art', ...splashNamesSplit.chars]);
              lottieAnims.forEach(({ anim, container }) => {
                  if (container.closest('#splash-overlay')) anim.pause();
              });
              mainContent.classList.add('visible');
              lenis.start();
              lenis.scrollTo(0, { immediate: true });
              initMainAnimations();
          })
          .to(doorL, { xPercent: -102, duration: 1.15, ease: 'power3.inOut' }, '+=.35')
          .to(doorR, { xPercent: 102, duration: 1.15, ease: 'power3.inOut' }, '<')
          .add(() => {
              splashOverlay.style.display = 'none';
              ambient.start();
              startPetals();
              setTimeout(perfGuard, 1500); // measure once the entrance settles
          }, '-=.55');
    });

    // ============================================================
    // MUSIC TOGGLE
    // ============================================================
    musicToggle.addEventListener('click', () => {
        if (musicPlaying) {
            bgMusic.pause();
            musicPlaying = false;
            musicToggle.classList.remove('playing');
        } else {
            bgMusic.volume = 0;
            bgMusic.play().then(() => {
                if (bgMusic.currentTime < 101) bgMusic.currentTime = 101;
                bgMusic.volume = .5;
                musicPlaying = true;
                musicToggle.classList.add('playing');
            }).catch(() => {});
        }
    });

    // ============================================================
    // COUNTDOWN — rolling digits
    // ============================================================
    const weddingDate = new Date('2026-07-06T19:00:00+05:30');
    const cdEls = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));

    let cdRevealed = false, cdAnimating = false;
    const pad2 = v => String(v).padStart(2, '0');
    const liveCd = () => {
        const diff = Math.max(0, weddingDate - new Date());
        return {
            d: Math.floor(diff / 864e5),
            h: Math.floor(diff % 864e5 / 36e5),
            m: Math.floor(diff % 36e5 / 6e4),
            s: Math.floor(diff % 6e4 / 1e3)
        };
    };

    function rollTo(elm, val) {
        const v = pad2(val);
        if (elm.textContent === v) return;
        if (RM || !invitationOpened || !cdRevealed) { elm.textContent = v; return; }
        gsap.timeline()
            .to(elm, { yPercent: -100, opacity: 0, duration: .2, ease: 'power2.in' })
            .add(() => { elm.textContent = v; })
            .fromTo(elm, { yPercent: 100, opacity: 0, scale: .8 }, { yPercent: 0, opacity: 1, scale: 1, duration: .36, ease: 'back.out(2.2)' });
    }

    function updateCountdown() {
        if (cdAnimating) return;        // don't fight the count-up reveal
        const c = liveCd();
        [c.d, c.h, c.m, c.s].forEach((v, i) => rollTo(cdEls[i], v));
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // count-up reveal — played once when the countdown scrolls into view
    function revealCountdown() {
        if (RM) { cdRevealed = true; return; }
        cdAnimating = true;
        const tgt = liveCd();
        const obj = { d: 0, h: 0, m: 0, s: 0 };
        gsap.to(obj, {
            d: tgt.d, h: tgt.h, m: tgt.m, s: tgt.s,
            duration: 1.5, ease: 'power2.out', delay: .35,
            onUpdate() {
                cdEls[0].textContent = pad2(Math.round(obj.d));
                cdEls[1].textContent = pad2(Math.round(obj.h));
                cdEls[2].textContent = pad2(Math.round(obj.m));
                cdEls[3].textContent = pad2(Math.round(obj.s));
            },
            onComplete() { cdAnimating = false; cdRevealed = true; }
        });
    }

    // ============================================================
    // STAR FIELD (countdown section)
    // ============================================================
    function initStars() {
        const canvas = document.getElementById('star-canvas');
        if (!canvas || RM) return;
        const ctx = canvas.getContext('2d');
        const section = canvas.parentElement;
        let stars = [], shooting = null;

        let inView = true;
        ScrollTrigger.create({
            trigger: section, start: 'top bottom', end: 'bottom top',
            onToggle: s => { inView = s.isActive; }
        });

        function fit() {
            canvas.width = section.offsetWidth;
            canvas.height = section.offsetHeight;
            stars = Array.from({ length: Math.round(canvas.width / (MOBILE ? 16 : 11)) }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: .4 + Math.random() * 1.3,
                tw: .5 + Math.random() * 2.2,
                t: Math.random() * 100
            }));
        }
        fit(); addEventListener('resize', fit);

        (function frame() {
            if (!document.hidden && inView) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (const st of stars) {
                    st.t += .016;
                    ctx.globalAlpha = .25 + .65 * (0.5 + 0.5 * Math.sin(st.t * st.tw));
                    ctx.fillStyle = '#f3e6bd';
                    ctx.beginPath();
                    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (!shooting && Math.random() < .003) {
                    shooting = { x: Math.random() * canvas.width * .7, y: Math.random() * canvas.height * .35, vx: 5.5 + Math.random() * 3, vy: 2.2 + Math.random() * 1.4, life: 1 };
                }
                if (shooting) {
                    shooting.x += shooting.vx; shooting.y += shooting.vy; shooting.life -= .02;
                    ctx.globalAlpha = Math.max(0, shooting.life);
                    const gr = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9);
                    gr.addColorStop(0, 'rgba(243,230,189,.95)');
                    gr.addColorStop(1, 'rgba(243,230,189,0)');
                    ctx.strokeStyle = gr;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.moveTo(shooting.x, shooting.y);
                    ctx.lineTo(shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9);
                    ctx.stroke();
                    if (shooting.life <= 0) shooting = null;
                }
                ctx.globalAlpha = 1;
            }
            requestAnimationFrame(frame);
        })();
    }

    // ============================================================
    // SLIDESHOW — ken-burns crossfade + dots
    // ============================================================
    (function initSlideshow() {
        const slides = document.querySelectorAll('.slideshow-frame .slide');
        const dotsWrap = document.querySelector('.slideshow-dots');
        if (!slides.length || !dotsWrap) return;
        let current = 0, timer;

        slides.forEach((_, i) => {
            const b = document.createElement('button');
            b.setAttribute('aria-label', `Photo ${i + 1}`);
            if (i === 0) b.classList.add('active');
            b.addEventListener('click', () => { go(i); restart(); });
            dotsWrap.appendChild(b);
        });
        const dots = dotsWrap.querySelectorAll('button');

        function go(i) {
            slides[current].classList.remove('active');
            dots[current].classList.remove('active');
            current = i % slides.length;
            slides[current].classList.add('active');
            dots[current].classList.add('active');
        }
        function restart() {
            clearInterval(timer);
            timer = setInterval(() => { if (!document.hidden) go(current + 1); }, 5000);
        }
        restart();
    })();

    // ============================================================
    // MAIN SCROLL ANIMATIONS — created once the doors open
    // ============================================================
    function initMainAnimations() {

        const heroMandala = document.getElementById('hero-mandala');
        const footerMandala = document.getElementById('footer-mandala');
        buildMandala(heroMandala);
        buildMandala(footerMandala);

        let garlandFlowers = buildGarland(document.getElementById('garland-svg'));
        buildVineFrame(document.getElementById('vine-svg'), true);
        document.querySelectorAll('[data-lights]').forEach(buildStringLights);
        document.querySelectorAll('[data-corner]').forEach(buildCornerOrnament);

        let resizeT;
        addEventListener('resize', () => {
            clearTimeout(resizeT);
            resizeT = setTimeout(() => {
                buildGarland(document.getElementById('garland-svg'));
                buildVineFrame(document.getElementById('vine-svg'), false);
                document.querySelectorAll('[data-lights]').forEach(buildStringLights);
                ScrollTrigger.refresh();
            }, 350);
        });

        // --- hero entrance ---
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .55 });

        if (garlandFlowers.length && !RM) {
            const garlandSvg = document.getElementById('garland-svg');
            gsap.set(garlandSvg, { opacity: 0 });
            gsap.set('.garland-dangler', { scaleY: 0, transformOrigin: '50% 0%' });
            heroTl.to(garlandSvg, { opacity: 1, duration: .8 }, 0);
            heroTl.to('.garland-dangler', { scaleY: 1, duration: .7, ease: 'back.out(1.7)', stagger: { each: .04, from: 'edges' } }, .15);
        }

        heroTl.from('.ganesha-wrap', { opacity: 0, scale: .6, y: 20, duration: 1, ease: 'back.out(1.7)' }, .25)
              .from('.hero-blessing', { opacity: 0, y: 22, duration: .8 }, '-=.5')
              .from(['.hero-blessing-english', '.hero-blessing-names'], { opacity: 0, y: 18, duration: .7, stagger: .14 }, '-=.45');

        const groomSplit = new SplitText('.hero-groom-name', { type: 'chars', charsClass: 'char' });
        const brideSplit = new SplitText('.hero-bride-name', { type: 'chars', charsClass: 'char' });
        heroTl.from(groomSplit.chars, { opacity: 0, y: 60, rotateX: -80, transformOrigin: '50% 100%', duration: .9, stagger: .06, ease: 'back.out(1.5)' }, '-=.3')
              .from('.hero-ampersand-container', { opacity: 0, scale: .4, duration: .6, ease: 'back.out(2)' }, '-=.5')
              .from(brideSplit.chars, { opacity: 0, y: 60, rotateX: -80, transformOrigin: '50% 100%', duration: .9, stagger: .06, ease: 'back.out(1.5)' }, '-=.45');

        const tagSplit = new SplitText('.hero-tagline', { type: 'words', wordsClass: 'word' });
        heroTl.from(tagSplit.words, { opacity: 0, y: 16, duration: .6, stagger: .12 }, '-=.35')
              .from('.hero-date-badge', { opacity: 0, scale: .75, y: 20, duration: .8, ease: 'elastic.out(1, .6)' }, '-=.2')
              .from('.scroll-cue', { opacity: 0, duration: .8 }, '-=.2');

        // hero parallax + mandala spin
        gsap.to(heroMandala, {
            rotation: 50, ease: 'none',
            scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: .8 }
        });
        gsap.to('.hero-content', {
            yPercent: -12, opacity: .25, ease: 'none',
            scrollTrigger: { trigger: '.hero-section', start: '55% center', end: 'bottom top', scrub: true }
        });
        gsap.to(footerMandala, { rotation: 360, duration: 280, repeat: -1, ease: 'none' });

        // --- generic reveals ---
        gsap.utils.toArray('[data-animate]').forEach(elm => {
            if (elm.closest('#hero')) return;
            gsap.from(elm, {
                opacity: 0, y: 42, duration: 1.05, ease: 'power3.out',
                scrollTrigger: { trigger: elm, start: 'top 88%' },
                clearProps: 'transform'
            });
        });

        // --- split-text titles (chars get their own gradient via CSS .char) ---
        gsap.utils.toArray('[data-split]').forEach(elm => {
            if (elm.closest('#hero')) return;
            // split into words AND chars so a word never breaks mid-line
            // (e.g. "Groom" wrapping to "Groo" + "m" on narrow phones)
            const split = new SplitText(elm, { type: 'words,chars', charsClass: 'char', wordsClass: 'split-word' });
            gsap.from(split.chars, {
                opacity: 0, y: 34, rotateX: -55, transformOrigin: '50% 100%',
                duration: .8, stagger: .025, ease: 'back.out(1.6)',
                scrollTrigger: { trigger: elm, start: 'top 86%' }
            });
            // (no per-char shimmer here — repainting dozens of glyphs every
            //  frame was a scroll-jank source; static gradient reads just as gold)
        });
        gsap.utils.toArray('[data-split-words]').forEach(elm => {
            if (elm.closest('#hero')) return;
            const split = new SplitText(elm, { type: 'words', wordsClass: 'word' });
            gsap.from(split.words, {
                opacity: 0, y: 22, duration: .7, stagger: .08, ease: 'power3.out',
                scrollTrigger: { trigger: elm, start: 'top 88%' }
            });
        });

        // --- dividers draw in ---
        gsap.utils.toArray('.head-divider, .card-divider').forEach(elm => {
            gsap.from(elm, {
                scaleX: 0, opacity: 0, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: elm, start: 'top 90%' }
            });
        });

        // --- vine frame draws when gallery scrolls in ---
        ScrollTrigger.create({
            trigger: '.slideshow-container', start: 'top 80%', once: true,
            onEnter: playVineDraw
        });

        // --- timelines: glowing line scrub + spark + item pops ---
        gsap.utils.toArray('.timeline').forEach(tl => {
            const line = tl.querySelector('.timeline-line');
            const spark = tl.querySelector('.timeline-spark');
            const st = { trigger: tl, start: 'top 72%', end: 'bottom 55%', scrub: .6 };
            gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: st });
            gsap.to(spark, { top: '100%', opacity: 1, ease: 'none', scrollTrigger: st });

            tl.querySelectorAll('.timeline-item').forEach(item => {
                const dot = item.querySelector('.timeline-dot');
                const content = item.querySelector('.timeline-content');
                const ist = { trigger: item, start: 'top 84%' };
                gsap.from(dot, { scale: 0, rotation: -120, duration: .7, ease: 'back.out(2)', scrollTrigger: ist, clearProps: 'transform' });
                gsap.from(content, { opacity: 0, x: -44, duration: .8, ease: 'power3.out', scrollTrigger: ist, clearProps: 'transform' });
            });
        });

        gsap.utils.toArray('.day-date-badge').forEach(b => {
            gsap.from(b, {
                opacity: 0, scale: .6, rotation: -8, duration: .8, ease: 'back.out(1.8)',
                scrollTrigger: { trigger: b, start: 'top 86%' },
                clearProps: 'transform'
            });
        });

        // --- countdown: stars, card pop, count-up reveal, diyas ---
        ScrollTrigger.create({
            trigger: '#countdown', start: 'top 78%', once: true,
            onEnter: () => {
                initStars();
                gsap.from('.countdown-item', {
                    y: 50, opacity: 0, scale: .8, duration: .7, ease: 'back.out(1.6)',
                    stagger: .12, clearProps: 'transform'
                });
                gsap.from('.countdown-separator', { opacity: 0, scale: 0, duration: .5, stagger: .12, delay: .3, ease: 'back.out(2)' });
                revealCountdown();
            }
        });
        gsap.from('.diya', {
            opacity: 0, y: 26, scale: .6, stagger: .18, duration: .8, ease: 'back.out(2)',
            scrollTrigger: { trigger: '.diya-row', start: 'top 88%' }
        });

        // --- couple cards: lotus emblems shimmer-pulse + names reveal ---
        gsap.to('.card-emblem svg', { scale: 1.12, duration: 1.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        gsap.utils.toArray('.couple-name-card').forEach(card => {
            const emblem = card.querySelector('.card-emblem');
            gsap.from(emblem, {
                scale: 0, rotation: -120, transformOrigin: 'center', duration: .9, ease: 'back.out(1.9)',
                scrollTrigger: { trigger: card, start: 'top 84%' }
            });
        });

        // --- couple heart: beat + one-time heart confetti burst ---
        gsap.to('#couple-heart svg', { scale: 1.18, duration: .55, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        ScrollTrigger.create({
            trigger: '#couple-heart', start: 'top 78%', once: true,
            onEnter: () => {
                if (typeof confetti !== 'function' || RM) return;
                const r = document.getElementById('couple-heart').getBoundingClientRect();
                const heart = confetti.shapeFromText ? [confetti.shapeFromText({ text: '❤️', scalar: 1.6 })] : undefined;
                confetti({
                    particleCount: 20, spread: 80, startVelocity: 15, gravity: .55, decay: .93, scalar: 1.3,
                    shapes: heart, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
                    colors: ['#b14a68', '#d4af37'], zIndex: 800, disableForReducedMotion: true
                });
            }
        });

        // --- venue: pin drop + ripple ---
        gsap.utils.toArray('.venue-card').forEach(card => {
            const pin = card.querySelector('.venue-pin');
            const ripple = card.querySelector('.pin-ripple');
            ScrollTrigger.create({
                trigger: card, start: 'top 80%', once: true,
                onEnter: () => {
                    gsap.timeline()
                        .from(pin, { y: -80, opacity: 0, duration: .85, ease: 'bounce.out' })
                        .fromTo(ripple, { scale: 0, opacity: .9 }, { scale: 1.6, opacity: 0, duration: .9, ease: 'power2.out' }, '-=.45')
                        .add(() => {
                            gsap.fromTo(ripple, { scale: .4, opacity: .7 }, { scale: 1.7, opacity: 0, duration: 2.2, repeat: -1, repeatDelay: 1.4, ease: 'power2.out' });
                        });
                }
            });
        });

        // --- footer: confetti fireworks + heartbeat ---
        const fwCanvas = document.getElementById('fireworks-canvas');
        let fwTimer = null, fw = null;
        if (typeof confetti === 'function' && fwCanvas && !RM) {
            fw = confetti.create(fwCanvas, { resize: true, useWorker: true });
        }
        ScrollTrigger.create({
            trigger: '#footer', start: 'top 75%', end: 'bottom top',
            onEnter: startFw, onEnterBack: startFw,
            onLeave: stopFw, onLeaveBack: stopFw
        });
        function burst() {
            if (!fw || document.hidden || isLite()) return;
            fw({
                particleCount: 45 + Math.random() * 40,
                spread: 60 + Math.random() * 60,
                startVelocity: 28, gravity: .8, decay: .92, scalar: .9, ticks: 130,
                shapes: ['circle', 'star'],
                origin: { x: .15 + Math.random() * .7, y: .15 + Math.random() * .35 },
                colors: ['#d4af37', '#e8cf7a', '#f3e6bd', '#b14a68', '#ffffff']
            });
        }
        function startFw() { if (!fwTimer && fw) { burst(); fwTimer = setInterval(burst, 1700); } }
        function stopFw() { clearInterval(fwTimer); fwTimer = null; }

        gsap.to('#footer-heart', { scale: 1.3, duration: .5, yoyo: true, repeat: -1, ease: 'sine.inOut' });

        // --- scroll progress bar ---
        gsap.to('#scroll-progress', {
            scaleX: 1, ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: .3 }
        });

        // --- dot nav ---
        const dotNav = document.getElementById('dot-nav');
        dotNav.classList.add('active');
        const navLinks = dotNav.querySelectorAll('a');
        navLinks.forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                scrollToSection(a.getAttribute('href'));
            });
        });
        gsap.utils.toArray('.section').forEach(sec => {
            ScrollTrigger.create({
                trigger: sec, start: 'top 50%', end: 'bottom 50%',
                onToggle: self => {
                    if (!self.isActive) return;
                    navLinks.forEach(a => a.classList.toggle('current', a.dataset.section === sec.id));
                }
            });
        });

        // --- 3D tilt (desktop) ---
        if (!TOUCH && !RM) {
            document.querySelectorAll('[data-tilt]').forEach(elm => {
                const rx = gsap.quickTo(elm, 'rotationX', { duration: .5, ease: 'power3.out' });
                const ry = gsap.quickTo(elm, 'rotationY', { duration: .5, ease: 'power3.out' });
                elm.addEventListener('mousemove', e => {
                    const r = elm.getBoundingClientRect();
                    ry(((e.clientX - r.left) / r.width - .5) * 8);
                    rx(-((e.clientY - r.top) / r.height - .5) * 8);
                });
                elm.addEventListener('mouseleave', () => { rx(0); ry(0); });
            });
        }

        // --- perf: everything that loops forever sleeps while its section
        //     is outside the viewport ---
        gateAmbient('#hero', () => [document.getElementById('garland-svg')]);
        gateAmbient('#couple', () => [
            document.getElementById('vine-svg'),
            document.querySelector('#couple-heart svg'),
            ...document.querySelectorAll('.card-emblem svg')
        ]);
        gateAmbient('#countdown', () => [...document.querySelectorAll('#countdown .lights-svg .bulb')]);
        gateAmbient('#venue', () => [...document.querySelectorAll('#venue .lights-svg .bulb')]);
        gateAmbient('#footer', () => [
            footerMandala,
            document.getElementById('footer-heart')
        ]);

        ScrollTrigger.refresh();
        window.addEventListener('load', () => ScrollTrigger.refresh());
    }

    // ============================================================
    // CUSTOM CURSOR (desktop)
    // ============================================================
    if (!TOUCH && !RM) {
        const dotEl = document.getElementById('cursor-dot');
        const ringEl = document.getElementById('cursor-ring');
        const dx = gsap.quickTo(dotEl, 'x', { duration: .08, ease: 'power2.out' });
        const dy = gsap.quickTo(dotEl, 'y', { duration: .08, ease: 'power2.out' });
        const rx = gsap.quickTo(ringEl, 'x', { duration: .35, ease: 'power2.out' });
        const ry = gsap.quickTo(ringEl, 'y', { duration: .35, ease: 'power2.out' });
        let shown = false;
        gsap.set([dotEl, ringEl], { xPercent: -50, yPercent: -50 });
        addEventListener('mousemove', e => {
            if (!shown) { shown = true; gsap.to([dotEl, ringEl], { opacity: 1, duration: .4 }); }
            dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
        });
        document.addEventListener('mouseover', e => {
            ringEl.classList.toggle('cursor-hover', !!e.target.closest('a, button, [data-tilt]'));
        });
    }

    // ============================================================
    // VISIBILITY — pause music in background tabs
    // ============================================================
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (musicPlaying) bgMusic.pause();
        } else if (musicPlaying) {
            bgMusic.play().catch(() => {});
        }
    });

});
