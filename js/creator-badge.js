/* Local, lazy 3D badge. The photo and links also work without WebGL. */
(() => {
    'use strict';
    const host = document.querySelector('#creator-badge');
    if (!host) return;
    const base = new URL('.', document.currentScript.src);
    const stage = host.querySelector('.creator-badge-stage');
    const scene = host.querySelector('.creator-badge-scene');
    const fallback = host.querySelector('.creator-badge-static');
    const flipButton = host.querySelector('[data-badge-flip]');
    const resetButton = host.querySelector('[data-badge-reset]');
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const t = (text) => window.BacklogI18n?.t(text) || text;
    let engine = null,
        textures = null,
        pending = null,
        visible = false,
        token = 0,
        back = false,
        unavailable = false;
    function image(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = new URL(url, base).href;
        });
    }
    function surface() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1440;
        return [canvas, canvas.getContext('2d')];
    }
    function round(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
    }
    async function buildTextures() {
        const [photo, logo] = await Promise.all([
            image('../imagens/projeto/gabriel-creator.webp'),
            image('../imagens/logo_transparente.png'),
        ]);
        const [front, ctx] = surface();
        ctx.fillStyle = '#171c12';
        ctx.fillRect(0, 0, 1024, 1440);
        ctx.strokeStyle = '#424b25';
        ctx.lineWidth = 3;
        round(ctx, 38, 38, 948, 1364, 38);
        ctx.stroke();
        const logoWidth = 620,
            logoHeight = (logo.height / logo.width) * logoWidth;
        ctx.drawImage(logo, 202, 115, logoWidth, logoHeight);
        ctx.save();
        round(ctx, 108, 280, 808, 760, 28);
        ctx.clip();
        // The uploaded photo remains intact. This is the photo window of the card layout.
        const sw = photo.width,
            sh = (sw * 760) / 808;
        const sx = (photo.width - sw) * 0.65,
            sy = (photo.height - sh) * 0.5;
        ctx.drawImage(photo, sx, sy, sw, sh, 108, 302, 808, 674);
        ctx.restore();
        ctx.fillStyle = '#ffd21f';
        ctx.font = 'bold 25px Arial';
        ctx.fillText('CREATOR / DEVELOPER', 110, 1098);
        ctx.fillStyle = '#f3f4e9';
        ctx.font = 'bold 75px Arial';
        ctx.fillText('Gabriel', 108, 1188);
        ctx.fillStyle = '#b2bba2';
        ctx.font = '30px Arial';
        ctx.fillText('@codergabriel', 110, 1238);
        ctx.strokeStyle = '#424b25';
        ctx.beginPath();
        ctx.moveTo(110, 1262);
        ctx.lineTo(914, 1262);
        ctx.stroke();
        ctx.fillStyle = '#ffd21f';
        round(ctx, 108, 1290, 808, 66, 16);
        ctx.fill();
        ctx.fillStyle = '#222710';
        ctx.font = '27px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('github.com/gabriellcs7', 512, 1333);
        const [reverse, r] = surface();
        r.fillStyle = '#ffd21f';
        r.fillRect(0, 0, 1024, 1440);
        r.strokeStyle = '#30320e';
        r.lineWidth = 3;
        round(r, 38, 38, 948, 1364, 38);
        r.stroke();
        r.fillStyle = '#171c12';
        r.textAlign = 'center';
        r.font = 'bold 80px Arial';
        r.fillText('Games + code.', 512, 600);
        r.font = '34px Arial';
        r.fillText('A personal project.', 512, 690);
        r.fillText('One commit at a time.', 512, 745);
        r.font = 'bold 32px Arial';
        r.fillText('BACKLOG', 512, 1235);
        r.font = '28px Arial';
        r.fillText('@codergabriel', 512, 1290);
        return { front: front.toDataURL('image/png'), back: reverse.toDataURL('image/png') };
    }
    function showStatic() {
        if (!textures) return;
        const img = document.createElement('img');
        img.src = back ? textures.back : textures.front;
        img.alt = t('Creator badge with Gabriel’s photo.');
        fallback.dataset.texture = '';
        fallback.replaceChildren(img);
    }
    function stop() {
        token++;
        engine?.destroy();
        engine = null;
        host.classList.remove('has-3d-badge');
    }
    async function start() {
        if (!visible || engine || unavailable || motion.matches || document.hidden) return;
        const current = ++token;
        try {
            textures = await (pending ||= buildTextures());
            showStatic();
            const { createLanyard } = await import(
                new URL('components/creator-lanyard.js?v=20261127-1', base)
            );
            if (current !== token || motion.matches || !visible || document.hidden) return;
            engine = createLanyard(scene, { frontImage: textures.front, backImage: textures.back });
            if (!engine) {
                unavailable = true;
                return;
            }
            back = false;
            host.classList.add('has-3d-badge');
            scene.querySelector('canvas')?.addEventListener(
                'webglcontextlost',
                (event) => {
                    event.preventDefault();
                    unavailable = true;
                    stop();
                    showStatic();
                },
                { once: true }
            );
        } catch {
            if (current !== token) return;
            unavailable = true;
            stop();
        }
    }
    flipButton.addEventListener('click', () => {
        if (engine) engine.flip();
        else {
            back = !back;
            showStatic();
        }
    });
    resetButton.addEventListener('click', () => {
        stop();
        back = false;
        showStatic();
        start();
    });
    const observer = new IntersectionObserver(
        ([entry]) => {
            visible = entry.isIntersecting;
            if (visible) {
                if (!pending) {
                    pending = buildTextures().then((value) => {
                        textures = value;
                        showStatic();
                        return value;
                    });
                    pending.catch(() => {
                        pending = null;
                    });
                }
                start();
            }
        },
        { rootMargin: '160px' }
    );
    observer.observe(stage);
    motion.addEventListener('change', () => {
        if (motion.matches) {
            stop();
            back = false;
            showStatic();
        } else start();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) start();
    });
    window.addEventListener('backlog-language-change', showStatic);
    window.addEventListener('pagehide', () => {
        stop();
        observer.disconnect();
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            observer.observe(stage);
            start();
        }
    });
})();
