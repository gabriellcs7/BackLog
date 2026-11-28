/* Specular Button: a native SVG rim light, keeping the original controls and colors. */
(() => {
    'use strict';
    const selector =
        '.button-primary,.cinematic-button-primary,#share-game,#share-list,.review-share,[data-specular]';
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const ns = 'http://www.w3.org/2000/svg',
        states = new Map();
    let frame = 0,
        pointer = null,
        serial = 0;
    function svg(tag, attrs) {
        const n = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
        return n;
    }
    function state(button) {
        if (states.has(button)) {
            const old = states.get(button);
            if (old.layer.parentNode === button) return old;
            states.delete(button);
        }
        const id = 'specular-rim-' + ++serial,
            layer = svg('svg', {
                class: 'specular-rim',
                'aria-hidden': 'true',
                focusable: 'false',
            }),
            defs = svg('defs', {}),
            gradient = svg('radialGradient', { id, gradientUnits: 'userSpaceOnUse', r: 100 });
        for (const [offset, opacity] of [
            ['0', '1'],
            ['.35', '.8'],
            ['1', '0'],
        ])
            gradient.append(
                svg('stop', {
                    offset,
                    'stop-color': button.matches('.button-primary,.cinematic-button-primary')
                        ? '#fffbea'
                        : '#ffd21f',
                    'stop-opacity': opacity,
                })
            );
        const rim = svg('rect', {
            x: 1,
            y: 1,
            fill: 'none',
            stroke: 'url(#' + id + ')',
            'stroke-width': 1.6,
        });
        defs.append(gradient);
        layer.append(defs, rim);
        button.append(layer);
        button.classList.add('has-specular-rim');
        const value = { layer, gradient, rim };
        states.set(button, value);
        return value;
    }
    function clear() {
        for (const [button, s] of states) {
            s.layer.style.opacity = '0';
            if (!button.isConnected) {
                states.delete(button);
            }
        }
    }
    function paint() {
        frame = 0;
        if (
            motion.matches ||
            window.BacklogPreferences?.get().cardGlow === false ||
            document.hidden
        )
            return clear();
        for (const button of document.querySelectorAll(selector)) {
            if (button.disabled || !button.getClientRects().length) continue;
            const r = button.getBoundingClientRect(),
                distance = pointer
                    ? Math.hypot(
                          Math.max(r.left - pointer.x, 0, pointer.x - r.right),
                          Math.max(r.top - pointer.y, 0, pointer.y - r.bottom)
                      )
                    : Infinity;
            const focused = button.matches(':focus-visible');
            if (distance > 120 && !focused) {
                const old = states.get(button);
                if (old) old.layer.style.opacity = '0';
                continue;
            }
            const s = state(button),
                style = getComputedStyle(button);
            s.layer.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
            s.rim.setAttribute('width', Math.max(0, r.width - 2));
            s.rim.setAttribute('height', Math.max(0, r.height - 2));
            s.rim.setAttribute('rx', parseFloat(style.borderRadius) || 10);
            s.gradient.setAttribute('cx', focused && !pointer ? 15 : pointer.x - r.left);
            s.gradient.setAttribute('cy', focused && !pointer ? 5 : pointer.y - r.top);
            s.layer.style.opacity = String(Math.max(0.15, 1 - distance / 150));
            if (focused) s.layer.style.opacity = '1';
        }
    }
    function wake() {
        if (!frame) frame = requestAnimationFrame(paint);
    }
    document.addEventListener(
        'pointermove',
        (e) => {
            if (e.pointerType === 'touch') return;
            pointer = { x: e.clientX, y: e.clientY };
            wake();
        },
        { passive: true }
    );
    document.addEventListener('focusin', wake);
    document.addEventListener('focusout', wake);
    document.documentElement.addEventListener('pointerleave', () => {
        pointer = null;
        clear();
    });
    motion.addEventListener('change', () => {
        clear();
        wake();
    });
    window.addEventListener('backlog-preferences-change', () => {
        clear();
        wake();
    });
    document.addEventListener('visibilitychange', clear);
    window.addEventListener('pagehide', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        clear();
    });
})();
