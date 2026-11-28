/* Tilted Card, adapted for the existing catalog links. Inspired by React Bits. */
(() => {
    'use strict';
    const cards = [...document.querySelectorAll('.radar-grid .library-card')];
    if (!cards.length) return;
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const states = cards.map((link) => {
        const art = link.querySelector('.library-art');
        const glare = document.createElement('span');
        glare.className = 'upcoming-tilt-glare';
        glare.setAttribute('aria-hidden', 'true');
        art.append(glare);
        art.classList.add('upcoming-tilt-art');
        link.classList.add('upcoming-tilt');
        return { link, art, x: 0, y: 0, lift: 0, tx: 0, ty: 0, targetLift: 0 };
    });
    let frame = 0,
        last = 0;
    function reset() {
        cancelAnimationFrame(frame);
        frame = 0;
        for (const s of states) {
            s.x = s.y = s.lift = s.tx = s.ty = s.targetLift = 0;
            s.art.style.removeProperty('transform');
            s.art.style.removeProperty('--tilt-light');
            s.link.classList.remove('is-tilting');
        }
    }
    function paint(now) {
        frame = 0;
        if (motion.matches || !pointer.matches || document.hidden) return reset();
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const ease = 1 - Math.exp(-16 * dt);
        let moving = false;
        for (const s of states) {
            s.x += (s.tx - s.x) * ease;
            s.y += (s.ty - s.y) * ease;
            s.lift += (s.targetLift - s.lift) * ease;
            const remaining =
                Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) + Math.abs(s.lift - s.targetLift);
            moving ||= remaining > 0.003;
            if (!s.targetLift && remaining < 0.003) {
                s.art.style.removeProperty('transform');
                s.art.style.removeProperty('--tilt-light');
                s.link.classList.remove('is-tilting');
                continue;
            }
            s.art.style.transform =
                'perspective(850px) rotateX(' +
                s.x.toFixed(3) +
                'deg) rotateY(' +
                s.y.toFixed(3) +
                'deg) scale(' +
                (1 + s.lift * 0.035).toFixed(4) +
                ')';
            s.art.style.setProperty('--tilt-light', String(s.lift * 0.42));
        }
        if (moving) frame = requestAnimationFrame(paint);
    }
    function wake() {
        if (!frame) {
            last = performance.now();
            frame = requestAnimationFrame(paint);
        }
    }
    for (const s of states) {
        s.link.addEventListener(
            'pointermove',
            (event) => {
                if (motion.matches || !pointer.matches || event.pointerType === 'touch') return;
                const r = s.link.getBoundingClientRect(),
                    x = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)),
                    y = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
                s.tx = (0.5 - y) * 14;
                s.ty = (x - 0.5) * 18;
                s.targetLift = 1;
                s.art.style.setProperty('--tilt-x', x * 100 + '%');
                s.art.style.setProperty('--tilt-y', y * 100 + '%');
                s.link.classList.add('is-tilting');
                wake();
            },
            { passive: true }
        );
        s.link.addEventListener('pointerleave', () => {
            s.tx = s.ty = s.targetLift = 0;
            wake();
        });
        s.link.addEventListener('blur', () => {
            s.tx = s.ty = s.targetLift = 0;
            wake();
        });
    }
    motion.addEventListener('change', reset);
    pointer.addEventListener('change', reset);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) reset();
    });
    window.addEventListener('pagehide', reset);
})();
