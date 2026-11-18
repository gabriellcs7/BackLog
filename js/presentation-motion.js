/* Preferência explícita para as apresentações, respeitando o dispositivo por padrão. */
(() => {
    'use strict';
    const key = 'backlog:presentation-motion';
    const modes = new Set(['auto', 'full', 'reduced']);
    const device = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = new EventTarget();
    const select = document.querySelector('#presentation-motion');
    const feedback = document.querySelector('#presentation-motion-status');
    function storedMode() {
        try { const value = localStorage.getItem(key); return modes.has(value) ? value : 'auto'; }
        catch { return 'auto'; }
    }
    let mode = storedMode();
    Object.defineProperty(motion, 'matches', {
        get: () => mode === 'reduced' || (mode === 'auto' && device.matches)
    });
    function apply() {
        document.documentElement.dataset.presentationMotion = motion.matches ? 'reduced' : 'full';
        if (select) select.value = mode;
        if (feedback) feedback.textContent = mode === 'auto'
            ? (device.matches ? 'Your device requests reduced motion. Choose Full animations to enable the 3D presentations.' : 'Using your device setting. Animations are on.')
            : (motion.matches ? 'Reduced motion is on.' : 'Full animations are on.');
        motion.dispatchEvent(new Event('change'));
    }
    select?.addEventListener('change', () => {
        if (!modes.has(select.value)) return;
        mode = select.value;
        let saved = true;
        try { if (mode === 'auto') localStorage.removeItem(key); else localStorage.setItem(key, mode); }
        catch { saved = false; }
        apply();
        if (!saved && feedback) feedback.textContent += ' This choice applies to this page only.';
    });
    if (device.addEventListener) device.addEventListener('change', apply);
    else device.addListener(apply);
    window.addEventListener('storage', event => {
        if (event.key === key || event.key === null) { mode = storedMode(); apply(); }
    });
    window.BacklogMotion = motion;
    apply();
    document.querySelector('.presentation-motion-controls')?.removeAttribute('hidden');
})();
