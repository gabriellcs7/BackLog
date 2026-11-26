/* Túnel em perspectiva: a rolagem da página substitui a captura local da roda. */
(() => {
    'use strict';
    const section = document.querySelector('.game-tunnel');
    if (!section) return;
    const stage = section.querySelector('.tunnel-stage');
    const heading = section.querySelector('.tunnel-heading');
    const progressBar = section.querySelector('.tunnel-progress > span');
    const cards = [...section.querySelectorAll('.tunnel-card')];
    const reduce = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const travel = { value: 0, target: 0, speed: 0 };
    const pointerX = { value: 0, target: 0, speed: 0 };
    const pointerY = { value: 0, target: 0, speed: 0 };
    const layout = cards.map((card, index) => {
        const angle = (index * 137.5 * Math.PI) / 180;
        return {
            card,
            x: Math.cos(angle),
            y: Math.sin(angle),
            radiusX: 0.28 + (index % 3) * 0.08,
            radiusY: 0.26 + (index % 2) * 0.09,
            rotation: (index % 2 ? -1 : 1) * (3 + (index % 5) * 2),
        };
    });
    let width = 0,
        height = 0,
        frame = 0,
        previous = 0,
        visible = false;

    function spring(state, dt, stiffness, damping, mass = 1) {
        // Pequenos passos mantêm a mola estável após pausas ou em telas lentas.
        const steps = Math.ceil(dt / 0.008),
            step = dt / steps;
        for (let i = 0; i < steps; i++) {
            state.speed +=
                (((state.target - state.value) * stiffness - state.speed * damping) / mass) * step;
            state.value += state.speed * step;
        }
        return Math.abs(state.target - state.value) > 0.0001 || Math.abs(state.speed) > 0.0001;
    }
    function paint() {
        const mobile = width < 768;
        const progress = 0.08 + clamp(travel.value) * 0.87;
        layout.forEach(({ card, x, y, radiusX, radiusY, rotation }, index) => {
            const start = (index / cards.length) * 0.45;
            const local = clamp((progress - start) / 0.55);
            const z = (mobile ? -1200 : -1700) + local * (mobile ? 1550 : 2200);
            const opacity = Math.min(clamp(local / 0.18), clamp((0.98 - local) / 0.16));
            const pan = mobile ? 20 : 45;
            const dx = x * width * radiusX - pointerX.value * pan;
            const dy = y * height * radiusY - pointerY.value * pan;
            card.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), ${z}px) rotateZ(${rotation}deg)`;
            card.style.opacity = opacity;
            // As capas próximas ficam à frente das distantes, independentemente do índice.
            card.style.zIndex = Math.round(local * 100);
            card.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
        });
        const titleOpacity = Math.min(clamp(progress / 0.12), clamp((1 - progress) / 0.15));
        heading.style.transform = `scale(${0.7 + progress * 0.65})`;
        heading.style.opacity = titleOpacity;
        progressBar.style.transform = `scaleX(${clamp(travel.value)})`;
    }
    function animate(time) {
        frame = 0;
        const dt = Math.min((time - (previous || time - 16)) / 1000, 0.064);
        previous = time;
        const moving = [
            spring(travel, dt, 80, 30),
            spring(pointerX, dt, 60, 25, 0.5),
            spring(pointerY, dt, 60, 25, 0.5),
        ].some(Boolean);
        paint();
        if (moving && visible) frame = requestAnimationFrame(animate);
        else previous = 0;
    }
    function schedule() {
        if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(animate);
    }
    function updateTravel() {
        if (reduce.matches) return;
        const rect = section.getBoundingClientRect();
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        travel.target = clamp((top - rect.top) / Math.max(1, rect.height - height));
        schedule();
    }
    function resize() {
        width = stage.clientWidth;
        height = stage.clientHeight;
        updateTravel();
        if (!reduce.matches) paint();
    }
    function configure() {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        section.classList.toggle('tunnel-enabled', !reduce.matches);
        if (reduce.matches) {
            cards.forEach((card) => card.removeAttribute('style'));
            heading.removeAttribute('style');
            progressBar.removeAttribute('style');
        } else {
            resize();
            travel.value = travel.target;
            travel.speed = 0;
            paint();
            schedule();
        }
    }
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
            updateTravel();
            schedule();
        } else {
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
        }
    }).observe(section);
    new ResizeObserver(resize).observe(stage);
    window.addEventListener('scroll', updateTravel, { passive: true });
    stage.addEventListener(
        'pointermove',
        (event) => {
            if (!finePointer.matches || event.pointerType === 'touch' || reduce.matches) return;
            const rect = stage.getBoundingClientRect();
            pointerX.target = ((event.clientX - rect.left) / width) * 2 - 1;
            pointerY.target = ((event.clientY - rect.top) / height) * 2 - 1;
            schedule();
        },
        { passive: true }
    );
    stage.addEventListener('pointerleave', () => {
        pointerX.target = pointerY.target = 0;
        schedule();
    });
    reduce.addEventListener('change', configure);
    configure();
})();
