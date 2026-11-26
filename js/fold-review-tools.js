/* Reuses the editor's existing buttons and selection/serialization logic. */
(() => {
    'use strict';
    const toolbar = document.querySelector('.rich-review-toolbar');
    if (!toolbar) return;
    const original = [...toolbar.querySelectorAll('button')],
        groups = [],
        t = (s) => window.BacklogI18n?.t(s) || s;
    let serial = 0;
    function close(group, focus = false) {
        group.tray.hidden = true;
        group.trigger.setAttribute('aria-expanded', 'false');
        group.wrap.classList.remove('is-open');
        if (focus) group.trigger.focus({ preventScroll: true });
    }
    function make(label, glyph, commands) {
        const wrap = document.createElement('div');
        wrap.className = 'fold-review-group';
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'rich-review-tool fold-review-trigger';
        const tray = document.createElement('div');
        tray.className = 'fold-review-tray';
        tray.id = 'review-tools-' + ++serial;
        tray.hidden = true;
        trigger.setAttribute('aria-controls', tray.id);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.textContent = glyph;
        trigger.title = trigger.getAttribute('aria-label') || t(label);
        trigger.setAttribute('aria-label', t(label));
        trigger.dataset.noTranslate = '';
        wrap.append(trigger, tray);
        const choices = original.filter((b) =>
            commands.includes(b.dataset.command + ':' + b.dataset.argument)
        );
        for (const b of choices) {
            tray.append(b);
            b.addEventListener('click', () => {
                trigger.textContent = b.textContent;
                close(group);
            });
        }
        const group = { wrap, trigger, tray, label };
        groups.push(group);
        trigger.addEventListener('pointerdown', (event) => event.preventDefault());
        trigger.addEventListener('click', () => {
            const open = tray.hidden;
            groups.forEach((g) => close(g));
            if (!open) return;
            tray.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            wrap.classList.add('is-open');
            if (
                !window.BacklogMotion?.matches &&
                document.documentElement.dataset.presentationMotion === 'full'
            )
                tray.animate(
                    [
                        { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                        { opacity: 1, clipPath: 'inset(0)' },
                    ],
                    { duration: 220, easing: 'ease-out' }
                );
            choices[0]?.focus({ preventScroll: true });
        });
        return wrap;
    }
    const inline = make('Text formatting', 'Aa', [
            'bold:',
            'italic:',
            'formatBlock:h3',
            'formatBlock:blockquote',
        ]),
        lists = make('List formatting', '≡', ['insertUnorderedList:', 'insertOrderedList:']);
    toolbar.replaceChildren(
        inline,
        lists,
        ...original.filter((b) => ['link', 'removeFormat'].includes(b.dataset.command))
    );
    toolbar.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const group = groups.find((g) => !g.tray.hidden);
            if (group) {
                event.preventDefault();
                event.stopPropagation();
                close(group, true);
            }
            return;
        }
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const visible = [...toolbar.querySelectorAll('button:not(:disabled)')].filter(
                (b) => !b.closest('[hidden]')
            ),
            index = visible.indexOf(document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? visible.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + visible.length) %
                    visible.length;
        visible[next]?.focus();
    });
    document.addEventListener('pointerdown', (event) => {
        if (!toolbar.contains(event.target)) groups.forEach((g) => close(g));
    });
    toolbar.addEventListener('focusout', () =>
        setTimeout(() => {
            if (!toolbar.contains(document.activeElement)) groups.forEach((g) => close(g));
        }, 0)
    );
    function state() {
        for (const g of groups) {
            g.trigger.disabled = Boolean(toolbar.closest('form')?.inert);
            if (g.trigger.disabled) close(g);
        }
    }
    new MutationObserver(state).observe(toolbar.closest('form'), {
        attributes: true,
        attributeFilter: ['inert', 'hidden'],
    });
    window.addEventListener('backlog-language-change', () =>
        groups.forEach((g) => {
            g.trigger.setAttribute('aria-label', t(g.label));
            g.trigger.title = t(g.label);
        })
    );
    state();
})();
