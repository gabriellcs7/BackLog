/* Global Specular Button treatment, using native SVG instead of one GPU context per control. */
(() => {
    'use strict';
    const selector =
        'button,summary,[role="button"],[role="tab"],a[class*="button"],[data-specular]';
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const ns = 'http://www.w3.org/2000/svg',
        states = new Map();
    let frame = 0,
        pointer = null,
        serial = 0,
        touchTimer = 0;
    function svg(tag, attrs) {
        const node = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
        return node;
    }
    function enhance(button) {
        if (button.matches('input,select,textarea,[data-no-specular]')) return;
        const old = states.get(button);
        if (old?.layer.parentNode === button) return;
        const id = 'specular-rim-' + ++serial,
            layer = svg('svg', {
                class: 'specular-rim',
                'aria-hidden': 'true',
                focusable: 'false',
                preserveAspectRatio: 'none',
            }),
            defs = svg('defs', {}),
            gradient = svg('radialGradient', { id, gradientUnits: 'userSpaceOnUse', r: 95 });
        for (const [offset, opacity] of [
            ['0', '1'],
            ['.28', '.95'],
            ['1', '0'],
        ])
            gradient.append(
                svg('stop', { offset, 'stop-color': '#ffe46b', 'stop-opacity': opacity })
            );
        const rim = svg('rect', {
            x: 1,
            y: 1,
            fill: 'none',
            stroke: 'url(#' + id + ')',
            'stroke-width': 1.8,
        });
        defs.append(gradient);
        layer.append(defs, rim);
        button.classList.add('has-specular-rim');
        button.append(layer);
        states.set(button, { layer, gradient, rim });
    }
    function scan(root) {
        if (!(root instanceof Element) && root !== document) return;
        if (root.matches?.(selector)) enhance(root);
        root.querySelectorAll(selector).forEach(enhance);
    }
    function paint() {
        frame = 0;
        const reduced = motion.matches;
        const visible = [];
        for (const [button, state] of states) {
            if (!button.isConnected) {
                states.delete(button);
                continue;
            }
            if (!button.getClientRects().length || button.disabled) {
                state.layer.style.opacity = '0';
                continue;
            }
            const r = button.getBoundingClientRect();
            if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
            visible.push({
                button,
                state,
                r,
                radius: parseFloat(getComputedStyle(button).borderRadius) || 8,
                focus: button.matches(':focus-visible'),
            });
        }
        for (const { button, state: s, r, radius, focus } of visible) {
            const over =
                pointer &&
                pointer.x >= r.left &&
                pointer.x <= r.right &&
                pointer.y >= r.top &&
                pointer.y <= r.bottom;
            const active = (over || focus) && !reduced;
            s.layer.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
            s.rim.setAttribute('width', Math.max(0, r.width - 2));
            s.rim.setAttribute('height', Math.max(0, r.height - 2));
            s.rim.setAttribute('rx', Math.min(radius, r.height / 2));
            s.gradient.setAttribute(
                'cx',
                over && !reduced ? pointer.x - r.left : Math.min(24, r.width * 0.22)
            );
            s.gradient.setAttribute('cy', over && !reduced ? pointer.y - r.top : 1);
            s.gradient.setAttribute('r', Math.max(55, Math.min(130, r.width * 0.65)));
            s.layer.style.opacity = active ? '1' : '.5';
            button.classList.toggle('is-specular-active', Boolean(active));
        }
    }
    function wake() {
        if (!frame) frame = requestAnimationFrame(paint);
    }
    scan(document);
    wake();
    new MutationObserver((records) => {
        for (const record of records) {
            if (record.target instanceof Element && record.target.matches(selector))
                enhance(record.target);
            for (const node of record.addedNodes) scan(node);
        }
        wake();
    }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener(
        'pointermove',
        (event) => {
            if (event.pointerType === 'touch') return;
            pointer = { x: event.clientX, y: event.clientY };
            wake();
        },
        { passive: true }
    );
    document.addEventListener(
        'pointerdown',
        (event) => {
            pointer = { x: event.clientX, y: event.clientY };
            wake();
            if (event.pointerType === 'touch') {
                clearTimeout(touchTimer);
                touchTimer = setTimeout(() => {
                    pointer = null;
                    wake();
                }, 650);
            }
        },
        { passive: true }
    );
    document.documentElement.addEventListener('pointerleave', () => {
        pointer = null;
        wake();
    });
    document.addEventListener('focusin', wake);
    document.addEventListener('focusout', wake);
    document.addEventListener('scroll', wake, { passive: true, capture: true });
    window.addEventListener('resize', wake);
    motion.addEventListener('change', wake);
    window.addEventListener('backlog-preferences-change', wake);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
        } else wake();
    });
    window.addEventListener('pagehide', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        clearTimeout(touchTimer);
    });
    window.addEventListener('pageshow', wake);
})();
