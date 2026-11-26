/* Números finais continuam acessíveis durante a contagem visual. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        seen = new WeakSet(),
        active = new Map();
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion:reduce)');
    const format = new Intl.NumberFormat('en');
    function finish(node) {
        const state = active.get(node);
        if (!state) return;
        cancelAnimationFrame(state.frame);
        state.visual.textContent = format.format(state.value);
        active.delete(node);
    }
    function start(node) {
        const value = Number(node.textContent.replace(/,/g, ''));
        if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) return;
        const accessible = ui.element('span', 'visually-hidden', format.format(value)),
            visual = ui.element('span', 'number-ticker-visual', format.format(value));
        visual.setAttribute('aria-hidden', 'true');
        node.classList.add('number-ticker');
        node.replaceChildren(accessible, visual);
        if (motion.matches || !value) return;
        const state = { value, visual, frame: 0 },
            begin = performance.now();
        active.set(node, state);
        function tick(now) {
            if (!node.isConnected || document.hidden || motion.matches) {
                finish(node);
                return;
            }
            const progress = Math.min(1, (now - begin) / 700);
            visual.textContent = format.format(Math.round(value * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) state.frame = requestAnimationFrame(tick);
            else finish(node);
        }
        state.frame = requestAnimationFrame(tick);
    }
    const observer =
        'IntersectionObserver' in window
            ? new IntersectionObserver(
                  (entries) => {
                      for (const entry of entries)
                          if (entry.isIntersecting) {
                              observer.unobserve(entry.target);
                              start(entry.target);
                          }
                  },
                  { threshold: 0.3 }
              )
            : null;
    function watch(node) {
        if (seen.has(node)) return;
        seen.add(node);
        if (observer) observer.observe(node);
        else start(node);
    }
    function scan(root) {
        if (root.matches?.('.profile-stat strong')) watch(root);
        root.querySelectorAll?.('.profile-stat strong').forEach(watch);
    }
    scan(document);
    new MutationObserver((records) => {
        for (const record of records)
            for (const node of record.addedNodes) if (node instanceof Element) scan(node);
    }).observe(document.body, { childList: true, subtree: true });
    function stop() {
        for (const node of active.keys()) finish(node);
    }
    motion.addEventListener?.('change', () => {
        if (motion.matches) stop();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
    });
})();
