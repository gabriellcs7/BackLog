/* The About logo stays a normal home link; only the larger sticker can be dragged. */
(() => {
    'use strict';
    const base = new URL('.', document.currentScript.src),
        brand = document.querySelector('.site-header .brand'),
        board = document.querySelector('#about-sticker-board');
    if (!board || !brand) return;
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    let loader = null;
    const targets = [
        { host: brand, image: brand.querySelector('img'), logo: true },
        { host: board, image: board.querySelector('img'), logo: false },
    ].map((value) => ({
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
            t.width = t.logo ? t.image.clientWidth : Math.min(245, t.host.clientWidth * 0.68);
            t.engine = createStickerPeel(root, canvas, hit, {
                imageSrc: t.image.src,
                width: t.width,
                rotate: t.logo ? 0 : (-9 * Math.PI) / 180,
                hoverPeel: t.logo ? 0.13 : 0.22,
                activePeel: t.logo ? 0.13 : 0.42,
                draggable: !t.logo,
                hoverOnly: t.logo,
                swing: t.logo ? 0 : 0.7,
                lighting: t.logo ? 0.2 : 0.5,
                shadow: t.logo ? 0.15 : 0.6,
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
                const width = t.logo
                    ? t.image.clientWidth
                    : Math.min(245, t.host.clientWidth * 0.68);
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
    document.querySelector('[data-reset-sticker]').addEventListener('click', () => {
        const t = targets[1];
        stop(t);
        start(t);
    });
    window.addEventListener('pagehide', () => {
        for (const t of targets) stop(t);
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) for (const t of targets) start(t);
    });
})();
