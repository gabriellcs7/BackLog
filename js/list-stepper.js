/* A three-step view over the original list form and its existing save handler. */
(() => {
    'use strict';
    const dialog = document.getElementById('list-dialog'),
        form = document.getElementById('list-form');
    if (!dialog || !form) return;
    const ui = window.BacklogUI,
        el = ui.element,
        t = (text) => window.BacklogI18n?.t(text) || text;
    const $ = (id) => document.getElementById(id),
        panels = [...form.querySelectorAll('[data-list-panel]')];
    const nav = form.querySelector('.list-stepper-nav'),
        steps = [...nav.querySelectorAll('button')];
    const back = $('list-stepper-back'),
        next = $('list-stepper-next'),
        save = $('list-stepper-save');
    let step = 0,
        farthest = 0,
        activeOwner = null;
    const owner = () => window.BacklogAccount.user?.id || 'local';
    const busy = () => save.disabled;
    dialog.classList.add('has-list-stepper');
    nav.hidden = false;
    form.noValidate = true;
    function summary() {
        const host = $('list-stepper-summary');
        host.replaceChildren();
        const name = el('h3', '', $('list-name').value.trim()),
            description = el('p', '', $('list-description').value);
        name.dataset.noTranslate = description.dataset.noTranslate = '';
        name.tabIndex = -1;
        const count = $('list-order').children.length,
            meta = el('div', 'list-stepper-summary-meta');
        for (const text of [
            count + ' ' + t(count === 1 ? 'game' : 'games'),
            t($('list-ranked').checked ? 'Ranked' : 'Unranked'),
            t($('list-public').checked ? 'Public' : 'Private'),
        ])
            meta.append(el('span', '', text));
        host.append(name);
        if (description.textContent.trim()) host.append(description);
        host.append(meta, window.BacklogListTags.chips(window.BacklogListTags.editor.get()));
        $('list-stepper-empty').hidden = count > 0;
    }
    function controls() {
        back.hidden = step === 0;
        back.disabled = busy();
        next.hidden = step === 2;
        next.disabled = busy();
        save.hidden = step !== 2;
        for (const [index, button] of steps.entries()) {
            button.disabled = busy() || index > farthest;
            button.classList.toggle('active', index === step);
            button.classList.toggle('done', index < step);
            if (index === step) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        }
    }
    function show(index, focus = true) {
        step = index;
        farthest = Math.max(farthest, index);
        panels.forEach((panel, i) => {
            panel.hidden = i !== step;
            panel.classList.toggle('is-entering', i === step);
        });
        if (step === 2) summary();
        controls();
        dialog.scrollTop = 0;
        if (focus)
            (step === 0
                ? $('list-name')
                : step === 1
                  ? $('list-search')
                  : $('list-stepper-summary').querySelector('h3')
            )?.focus({ preventScroll: true });
    }
    function validDetails() {
        const name = $('list-name'),
            description = $('list-description');
        if (!name.value.trim() || name.value.trim().length > 80 || description.value.length > 500) {
            show(0);
            $('list-feedback').textContent = t(
                'Add a list name (up to 80 characters) and a description of up to 500 characters.'
            );
            name.focus();
            return false;
        }
        try {
            window.BacklogListTags.editor.get();
        } catch (error) {
            show(0);
            $('list-feedback').textContent = error.message;
            $('list-tags-input').focus();
            return false;
        }
        return true;
    }
    function advance() {
        if (!busy() && validDetails()) {
            $('list-feedback').textContent = '';
            show(Math.min(2, step + 1));
        }
    }
    form.addEventListener('input', () => {
        if (!busy()) $('list-feedback').textContent = '';
    });
    next.addEventListener('click', advance);
    back.addEventListener('click', () => {
        if (!busy()) show(Math.max(0, step - 1));
    });
    steps.forEach((button, index) =>
        button.addEventListener('click', () => {
            if (!busy() && validDetails()) show(index);
        })
    );
    form.addEventListener(
        'submit',
        (event) => {
            if (busy() || !validDetails() || step !== 2) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (!busy() && step !== 0 && step !== 2) advance();
                else if (!busy() && step === 0 && $('list-name').value.trim()) advance();
            }
        },
        { capture: true }
    );
    new MutationObserver(controls).observe(save, {
        attributes: true,
        attributeFilter: ['disabled'],
    });
    new MutationObserver(() => {
        if (step === 2 && dialog.open) summary();
    }).observe($('list-order'), { childList: true });
    window.addEventListener('backlog-language-change', () => {
        if (step === 2 && dialog.open) summary();
    });
    window.addEventListener('backlog-account-change', () => {
        if (dialog.open && owner() !== activeOwner) dialog.close();
    });
    window.BacklogListStepper = {
        reset() {
            step = farthest = 0;
            activeOwner = owner();
            show(0, false);
        },
    };
    show(0, false);
})();
