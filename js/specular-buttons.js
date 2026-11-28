/* Specular Button: original React Bits lighting, shared across native controls. */
(() => {
    'use strict';
    const base = new URL('.', document.currentScript.src),
        selector = 'button,summary,[role="button"],[role="tab"],a[class*="button"],[data-specular]',
        states = new Map();
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const statusColors = {
        played: '#78d985',
        playing: '#70a7ff',
        completed: '#b7e476',
        platinum: '#c4a1ff',
        dropped: '#ff8a80',
        'want-to-play': '#ffd21f',
    };
    let api = null,
        renderer = null,
        frame = 0,
        last = 0,
        pointer = null,
        touchTimer = 0;
    function eligible(button) {
        if (
            button.matches('input,select,textarea,[data-no-specular]') ||
            button.closest('.nav-search,form[role="search"]')
        )
            return false;
        if (button.matches('.filter-tab')) return button.getAttribute('aria-pressed') === 'true';
        return true;
    }
    function color(button, state, style) {
        const explicit = style.getPropertyValue('--specular-accent').trim();
        if (explicit) return explicit;
        if (
            button.matches(
                '.review-game-heart-toggle,.review-like,.social-danger,.review-delete,[data-danger]'
            )
        )
            return '#ff786f';
        if (statusColors[button.dataset.status]) return statusColors[button.dataset.status];
        if (button.matches('.button-primary,.cinematic-button-primary,.filter-tab'))
            return '#ffd21f';
        const channels = (style.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
        if (
            channels.length === 3 &&
            Math.max(...channels) - Math.min(...channels) > 55 &&
            Math.max(...channels) > 100
        )
            return style.color;
        return state.originalAccent || '#dce6be';
    }
    function enhance(button) {
        if (!eligible(button)) {
            const old = states.get(button);
            if (old) {
                old.canvas.remove();
                button.classList.remove('has-specular-rim', 'has-specular-light');
                button.style.removeProperty('--specular-color');
                states.delete(button);
            }
            return;
        }
        const old = states.get(button);
        if (old?.canvas.parentNode === button) return;
        button
            .querySelectorAll(':scope > .specular-rim,:scope > .specular-light')
            .forEach((node) => node.remove());
        button.classList.remove('has-specular-light');
        const canvas = document.createElement('canvas');
        canvas.className = 'specular-light';
        canvas.setAttribute('aria-hidden', 'true');
        const style = getComputedStyle(button),
            state = {
                canvas,
                spot: 0,
                level: 0.35,
                press: 0,
                ready: false,
                dirty: true,
                key: '',
                originalAccent: null,
            };
        const accent = color(button, state, style);
        state.originalAccent = accent;
        button.style.setProperty('--specular-color', accent);
        button.dataset.specularColor = accent;
        button.classList.add('has-specular-rim');
        button.append(canvas);
        states.set(button, state);
    }
    function scan(root) {
        if (!(root instanceof Element) && root !== document) return;
        if (root.matches?.(selector)) enhance(root);
        root.querySelectorAll(selector).forEach(enhance);
    }
    function paint(now) {
        frame = 0;
        if (document.hidden) {
            last = 0;
            return;
        }
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        let moving = false;
        const controls = [];
        for (const [button, state] of states) {
            if (!button.isConnected) {
                states.delete(button);
                continue;
            }
            if (!button.getClientRects().length) {
                state.canvas.hidden = true;
                continue;
            }
            const rect = button.getBoundingClientRect();
            if (
                rect.bottom < 0 ||
                rect.top > innerHeight ||
                rect.right < 0 ||
                rect.left > innerWidth ||
                !rect.width ||
                !rect.height
            ) {
                state.canvas.hidden = true;
                continue;
            }
            const style = getComputedStyle(button);
            controls.push({
                button,
                state,
                rect,
                radius: parseFloat(style.borderRadius) || 12,
                accent: color(button, state, style),
                focus: button.matches(':focus-visible'),
            });
        }
        for (const { button, state: s, rect, radius, accent, focus } of controls) {
            if (button.dataset.specularColor !== accent) {
                button.dataset.specularColor = accent;
                button.style.setProperty('--specular-color', accent);
                s.dirty = true;
            }
            if (!api || !renderer) continue;
            s.canvas.hidden = false;
            const rest = api.restSpot(rect.width, rect.height, radius),
                target =
                    !motion.matches && !button.disabled
                        ? api.aim(
                              rect,
                              radius,
                              pointer || (focus ? { x: rect.left + 15, y: rect.top + 5 } : null)
                          )
                        : null;
            if (!s.ready) {
                s.spot = rest;
                s.ready = true;
            }
            let diff = (target && target.near > 0 ? target.spot : rest) - s.spot;
            diff -= Math.round(diff);
            const level = button.disabled ? 0 : 0.35 + 0.65 * (target?.near || 0);
            const changed =
                Math.abs(diff) > 0.0002 || Math.abs(s.level - level) > 0.001 || s.press > 0.002;
            if (motion.matches) {
                s.spot = rest;
                s.level = level;
                s.press = 0;
            } else {
                s.spot = (((s.spot + diff * (1 - Math.exp(-dt * 8))) % 1) + 1) % 1;
                s.level += (level - s.level) * (1 - Math.exp(-dt * 7));
                s.press *= Math.exp(-dt * 5);
            }
            const padLeft = Math.min(24, Math.max(0, rect.left - 2)),
                padRight = Math.min(24, Math.max(0, innerWidth - rect.right - 2));
            const key = [
                rect.width,
                rect.height,
                radius,
                accent,
                button.disabled,
                padLeft,
                padRight,
            ].join('|');
            if (s.dirty || key !== s.key || changed) {
                const baseColor =
                    accent === '#ffd21f' ? '#65703e' : accent === '#ff786f' ? '#70413e' : '#596344';
                s.canvas.style.setProperty('--specular-left', -padLeft + 'px');
                s.canvas.style.setProperty(
                    '--specular-width',
                    rect.width + padLeft + padRight + 'px'
                );
                const drawn = renderer.draw(
                    s.canvas,
                    { width: rect.width, height: rect.height, radius, padLeft, padRight },
                    s,
                    accent,
                    baseColor
                );
                if (drawn && !button.classList.contains('has-specular-light'))
                    button.classList.add('has-specular-light');
                s.key = key;
                s.dirty = false;
            }
            moving ||= !motion.matches && changed;
        }
        if (moving) frame = requestAnimationFrame(paint);
        else last = 0;
    }
    function wake() {
        if (!frame) frame = requestAnimationFrame(paint);
    }
    scan(document);
    wake();
    import(new URL('components/specular-light.js?v=20261128-exact-3', base))
        .then((value) => {
            api = value;
            renderer = api.createSpecularRenderer();
            for (const s of states.values()) s.dirty = true;
            wake();
        })
        .catch(() => {});
    new MutationObserver((records) => {
        for (const record of records) {
            if (record.target instanceof Element && record.target.matches(selector))
                enhance(record.target);
            for (const node of record.addedNodes) scan(node);
        }
        wake();
    }).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-pressed', 'aria-selected', 'disabled', 'data-status'],
    });
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
            const s = states.get(event.target.closest(selector));
            if (s && !motion.matches) s.press = 1;
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
    document.addEventListener('scroll', wake, { capture: true, passive: true });
    window.addEventListener('resize', () => {
        for (const s of states.values()) s.dirty = true;
        wake();
    });
    motion.addEventListener('change', () => {
        for (const s of states.values()) s.dirty = true;
        wake();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
            last = 0;
        } else wake();
    });
    window.addEventListener('pagehide', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        clearTimeout(touchTimer);
        renderer?.destroy();
        renderer = null;
        last = 0;
    });
    window.addEventListener('pageshow', () => {
        if (api && !renderer) {
            renderer = api.createSpecularRenderer();
            for (const state of states.values()) {
                state.dirty = true;
                state.ready = false;
            }
        }
        wake();
    });
})();
