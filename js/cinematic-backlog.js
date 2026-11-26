/* Sequência cinematográfica controlada pela rolagem natural da página. */
(() => {
    'use strict';
    const section = document.querySelector('.cinematic-backlog');
    if (!section) return;
    const stage = section.querySelector('.cinematic-stage');
    const intro = section.querySelector('.cinematic-intro');
    const grid = section.querySelector('.cinematic-grid');
    const panel = section.querySelector('.cinematic-panel');
    const device = section.querySelector('.cinematic-device-wrap');
    const phone = section.querySelector('.cinematic-phone');
    const copy = section.querySelector('.cinematic-copy');
    const brand = section.querySelector('.cinematic-brand');
    const cta = section.querySelector('.cinematic-cta');
    const widgets = [...section.querySelectorAll('.cinematic-widget')];
    const badges = [...section.querySelectorAll('.cinematic-badge')];
    const counter = section.querySelector('.cinematic-counter');
    const ring = section.querySelector('.cinematic-ring');
    const bar = section.querySelector('.cinematic-progress > span');
    const reduced = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const total = window.BacklogGames?.length || 100;
    counter.textContent = total;
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const phase = (value, start, end) => {
        const t = clamp((value - start) / (end - start));
        return t * t * (3 - 2 * t);
    };
    let height = 0,
        top = 80,
        progress = 0,
        target = 0;
    let frame = 0,
        previous = 0,
        visible = false,
        introduced = false;
    let mouseX = 0,
        mouseY = 0,
        tiltX = 0,
        tiltY = 0;
    let lightX = '50%',
        lightY = '50%';
    let introAnimations = [];

    function paint() {
        const rise = phase(progress, 0.035, 0.23);
        const expand = phase(progress, 0.23, 0.35);
        const appear = phase(progress, 0.31, 0.48);
        const exit = phase(progress, 0.69, 0.79);
        const pullback = phase(progress, 0.77, 0.87);
        const leave = phase(progress, 0.9, 1);
        const introFade = phase(progress, 0.015, 0.19);
        intro.style.transform = `scale(${1 + introFade * 0.15})`;
        intro.style.filter = `blur(${introFade * 20}px)`;
        intro.style.opacity = (1 - introFade * 0.8) * (1 - phase(progress, 0.62, 0.68));
        grid.style.opacity = 1 - introFade * 0.6;
        panel.style.width = `${85 + expand * 15 - pullback * 15}%`;
        panel.style.height = `${85 + expand * 15 - pullback * 15}%`;
        panel.style.borderRadius = `${(1 - expand + pullback) * (innerWidth < 768 ? 32 : 40)}px`;
        panel.style.transform = `translate(-50%,-50%) translateY(${(1 - rise) * (height + 200) - leave * (height + 300)}px)`;
        panel.style.setProperty('--light-x', lightX);
        panel.style.setProperty('--light-y', lightY);
        device.style.opacity = appear * (1 - exit);
        device.style.transform = `translate3d(0,${(1 - appear) * 300 - exit * 40}px,${-500 * (1 - appear) - exit * 200}px) rotateX(${50 * (1 - appear)}deg) rotateY(${-30 * (1 - appear)}deg) scale(${0.6 + appear * 0.4 - exit * 0.1})`;
        phone.style.transform = `rotateY(${tiltX * 12}deg) rotateX(${-tiltY * 12}deg)`;
        widgets.forEach((widget, index) => {
            const reveal = phase(progress, 0.39 + index * 0.025, 0.51 + index * 0.025);
            widget.style.opacity = reveal;
            widget.style.transform = `translateY(${(1 - reveal) * 40}px) scale(${0.95 + reveal * 0.05})`;
        });
        const metric = phase(progress, 0.42, 0.59);
        counter.textContent = Math.round(total * metric);
        ring.style.strokeDashoffset = 239 * (1 - metric * 0.85);
        badges.forEach((badge, index) => {
            const reveal = phase(progress, 0.44 + index * 0.035, 0.57 + index * 0.035);
            badge.style.opacity = reveal * (1 - exit);
            badge.style.transform = `translateY(${(1 - reveal) * 100 - exit * 40}px) scale(${0.7 + reveal * 0.3}) rotate(${-10 * (1 - reveal)}deg)`;
        });
        [copy, brand].forEach((element, index) => {
            const reveal = phase(progress, 0.46 + index * 0.02, 0.59 + index * 0.02);
            element.style.opacity = reveal * (1 - exit);
            element.style.transform = `translateX(${(1 - reveal) * (index ? 50 : -50)}px) translateY(${-exit * 40}px)`;
        });
        const finalReveal = phase(progress, 0.77, 0.88);
        cta.style.opacity = finalReveal;
        cta.style.transform = `scale(${0.8 + finalReveal * 0.2})`;
        cta.style.filter = `blur(${(1 - finalReveal) * 30}px)`;
        cta.inert = finalReveal < 0.9 || leave < 0.8;
        bar.style.transform = `scaleX(${clamp(progress)})`;
    }
    function animate(time) {
        frame = 0;
        const dt = Math.min((time - (previous || time - 16)) / 1000, 0.064);
        previous = time;
        const step = 1 - Math.exp(-dt * 9);
        progress += (target - progress) * step;
        tiltX += (mouseX - tiltX) * step;
        tiltY += (mouseY - tiltY) * step;
        paint();
        if (
            Math.abs(target - progress) + Math.abs(mouseX - tiltX) + Math.abs(mouseY - tiltY) >
            0.0001
        )
            schedule();
        else previous = 0;
    }
    function schedule() {
        if (visible && !reduced.matches && !frame) frame = requestAnimationFrame(animate);
    }
    function update() {
        if (reduced.matches) return;
        const rect = section.getBoundingClientRect();
        target = clamp((top - rect.top) / Math.max(1, rect.height - height));
        schedule();
    }
    function resize() {
        height = stage.clientHeight;
        top = parseFloat(getComputedStyle(stage).top) || 0;
        if (!reduced.matches) {
            const mobile = stage.clientWidth < 768;
            const scale = Math.max(
                0.3,
                Math.min(mobile ? 0.66 : 1, (height - (mobile ? 230 : 110)) / 580)
            );
            stage.style.setProperty('--phone-scale', scale);
            stage.style.setProperty('--phone-height', `${580 * scale}px`);
            update();
            paint();
        }
    }
    function introduce() {
        if (!visible || introduced || reduced.matches || target > 0.02) return;
        introduced = true;
        const lines = intro.querySelectorAll('h2>span');
        introAnimations = [...lines].map((line, index) =>
            line.animate(
                [
                    {
                        opacity: 0,
                        transform: 'translateY(45px) scale(.9)',
                        filter: 'blur(16px)',
                        clipPath: index ? 'inset(0 100% 0 0)' : 'inset(0)',
                    },
                    {
                        opacity: 1,
                        transform: 'translateY(0) scale(1)',
                        filter: 'blur(0)',
                        clipPath: 'inset(0)',
                    },
                ],
                {
                    duration: index ? 1400 : 1500,
                    delay: index * 300,
                    easing: 'cubic-bezier(.16,1,.3,1)',
                    fill: 'backwards',
                }
            )
        );
    }
    function configure() {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        introAnimations.forEach((animation) => animation.cancel());
        section.classList.toggle('cinematic-enabled', !reduced.matches);
        if (reduced.matches) {
            [
                intro,
                grid,
                panel,
                device,
                phone,
                copy,
                brand,
                cta,
                ring,
                bar,
                ...widgets,
                ...badges,
            ].forEach((element) => element.removeAttribute('style'));
            stage.removeAttribute('style');
            counter.textContent = total;
            cta.inert = false;
        } else {
            resize();
            progress = target;
            paint();
            introduce();
            schedule();
        }
    }
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
            update();
            introduce();
            schedule();
        } else {
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
        }
    }).observe(section);
    new ResizeObserver(resize).observe(stage);
    window.addEventListener('scroll', update, { passive: true });
    stage.addEventListener(
        'pointermove',
        (event) => {
            if (!finePointer.matches || event.pointerType === 'touch' || reduced.matches) return;
            const rect = stage.getBoundingClientRect(),
                cardRect = panel.getBoundingClientRect();
            lightX = `${event.clientX - cardRect.left}px`;
            lightY = `${event.clientY - cardRect.top}px`;
            mouseX = clamp((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseY = clamp((event.clientY - rect.top) / rect.height) * 2 - 1;
            schedule();
        },
        { passive: true }
    );
    stage.addEventListener('pointerleave', () => {
        mouseX = mouseY = 0;
        lightX = lightY = '50%';
        schedule();
    });
    reduced.addEventListener('change', configure);
    configure();
})();
