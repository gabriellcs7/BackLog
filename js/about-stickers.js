/* Preserve the home link while adding a peel effect to the About navigation logo. */
(() => {
    'use strict';
    const base = new URL('.', document.currentScript.src),
        brand = document.querySelector('.site-header .brand');
    if (!brand?.querySelector('img')) return;
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    let loader = null;
    const targets = [{ host: brand, image: brand.querySelector('img') }].map((value) => ({
        ...value,
        engine: null,
        root: null,
        visible: false,
        version: 0,
        width: 0,
    }));
    brand.classList.add('about-sticker-brand');
    function stop(t) {
        t.version++;
        t.engine?.destroy();
        t.engine = null;
        t.root?.remove();
        t.root = null;
        t.host.classList.remove('has-peel-sticker');
    }
    async function start(t) {
        if (t.engine || !t.visible || motion.matches) return;
        const version = ++t.version;
        try {
            const { createStickerPeel } = await (loader ||= import(
                new URL('components/sticker-peel.js?v=20261128-1', base)
            ));
            if (version !== t.version || motion.matches || !t.visible) return;
            const root = document.createElement('div'),
                canvas = document.createElement('canvas'),
                hit = document.createElement('div');
            root.className = 'sticker-peel';
            root.setAttribute('aria-hidden', 'true');
            canvas.className = 'sticker-peel-canvas';
            hit.className = 'sticker-peel-hit';
            root.append(canvas, hit);
            t.host.append(root);
            t.root = root;
            t.width = t.image.clientWidth;
            t.engine = createStickerPeel(root, canvas, hit, {
                imageSrc: t.image.src,
                width: t.width,
                rotate: 0,
                hoverPeel: 0.13,
                activePeel: 0.13,
                draggable: false,
                hoverOnly: true,
                swing: 0,
                lighting: 0.2,
                shadow: 0.15,
                onReady: () => {
                    if (version === t.version) t.host.classList.add('has-peel-sticker');
                },
            });
            if (!t.engine) {
                root.remove();
                t.root = null;
            }
        } catch {
            if (version === t.version) stop(t);
        }
    }
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const t = targets.find((t) => t.host === entry.target);
                t.visible = entry.isIntersecting;
                if (t.visible) start(t);
            }
        },
        { rootMargin: '100px' }
    );
    for (const t of targets) observer.observe(t.host);
    let resizeFrame = 0;
    const resize = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            for (const t of targets) {
                const width = t.image.clientWidth;
                if (t.engine && Math.abs(width - t.width) > 2) {
                    stop(t);
                    start(t);
                }
            }
        });
    });
    for (const t of targets) resize.observe(t.host);
    motion.addEventListener('change', () => {
        for (const t of targets) {
            if (motion.matches) stop(t);
            else start(t);
        }
    });
    window.addEventListener('pagehide', () => {
        for (const t of targets) stop(t);
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) for (const t of targets) start(t);
    });
})();
