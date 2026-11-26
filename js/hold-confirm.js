/* Hold applies only to the final buttons in the existing delete dialogs. */
(() => {
    'use strict';
    const controllers = [],
        t = (s) => window.BacklogI18n?.t(s) || s,
        owner = () => window.BacklogAccount?.user?.id || 'local';
    for (const [id, label] of [
        ['confirm-delete-list', 'Hold to delete list'],
        ['confirm-remove-entry', 'Hold to remove entry'],
    ]) {
        const button = document.getElementById(id);
        if (!button) continue;
        const dialog = button.closest('dialog'),
            copy = document.createElement('span');
        copy.className = 'hold-confirm-label';
        button.replaceChildren(copy);
        button.classList.add('hold-confirm');
        button.dataset.noTranslate = '';
        button.setAttribute(
            'aria-description',
            t('Hold for a moment to confirm. Release early to cancel.')
        );
        let holding = false,
            allowed = false,
            timer,
            frame,
            start,
            who,
            kind = null,
            completed = false;
        function localize() {
            copy.textContent = t(
                completed ? 'Confirming…' : holding ? 'Release early to cancel' : label
            );
            button.setAttribute(
                'aria-description',
                t('Hold for a moment to confirm. Release early to cancel.')
            );
        }
        function cancel() {
            holding = false;
            kind = null;
            completed = false;
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            button.style.setProperty('--hold-progress', '0');
            button.classList.remove('is-holding');
            localize();
        }
        function tick() {
            if (!holding) return;
            button.style.setProperty(
                '--hold-progress',
                Math.min(1, (performance.now() - start) / 1200)
            );
            frame = requestAnimationFrame(tick);
        }
        function begin(nextKind) {
            if (holding || button.disabled || !dialog?.open) return;
            cancel();
            who = owner();
            kind = nextKind;
            holding = true;
            start = performance.now();
            button.classList.add('is-holding');
            localize();
            tick();
            timer = setTimeout(() => {
                if (!holding || owner() !== who || !dialog.open || button.disabled) {
                    cancel();
                    return;
                }
                holding = false;
                completed = true;
                cancelAnimationFrame(frame);
                button.style.setProperty('--hold-progress', '1');
                localize();
                allowed = true;
                try {
                    button.click();
                } finally {
                    allowed = false;
                }
            }, 1200);
        }
        button.addEventListener(
            'click',
            (event) => {
                if (allowed) return;
                if (event.isTrusted && event.detail === 0 && !holding) {
                    return;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
            },
            true
        );
        button.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            button.focus({ preventScroll: true });
            begin('pointer');
            if (holding) button.setPointerCapture(event.pointerId);
        });
        button.addEventListener('pointermove', (event) => {
            if (!holding || kind !== 'pointer') return;
            const b = button.getBoundingClientRect();
            if (
                event.clientX < b.left ||
                event.clientX > b.right ||
                event.clientY < b.top ||
                event.clientY > b.bottom
            )
                cancel();
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
            button.addEventListener(name, () => {
                if (holding && kind === 'pointer') cancel();
            });
        button.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cancel();
                return;
            }
            if (![' ', 'Enter'].includes(event.key)) return;
            event.preventDefault();
            if (!event.repeat) begin(event.key);
        });
        button.addEventListener('keyup', (event) => {
            if ([' ', 'Enter'].includes(event.key)) {
                event.preventDefault();
                if (holding) cancel();
            }
        });
        button.addEventListener('blur', () => {
            if (holding) cancel();
        });
        new MutationObserver(() => {
            if (!dialog.open) cancel();
            else if (button.disabled && holding) cancel();
            else if (!button.disabled && completed) cancel();
        }).observe(dialog, {
            attributes: true,
            subtree: true,
            attributeFilter: ['open', 'disabled'],
        });
        controllers.push(cancel);
        window.addEventListener('backlog-language-change', localize);
        localize();
    }
    window.addEventListener('backlog-account-change', () =>
        controllers.forEach((cancel) => cancel())
    );
    window.addEventListener('blur', () => controllers.forEach((cancel) => cancel()));
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) controllers.forEach((cancel) => cancel());
    });
})();
