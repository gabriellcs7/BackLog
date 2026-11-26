(() => {
    'use strict';
    const el = window.BacklogUI.element,
        t = (s) => window.BacklogI18n?.t(s) || s,
        section = document.querySelector('.settings-shortcuts');
    if (!section) return;
    const open = el('button', 'social-button settings-shortcut-open');
    open.type = 'button';
    section.append(open);
    const dialog = el('dialog', 'component-dialog');
    dialog.dataset.noTranslate = '';
    dialog.setAttribute('aria-labelledby', 'shortcuts-title');
    const heading = el('div', 'component-dialog-heading'),
        title = el('h2');
    title.id = 'shortcuts-title';
    const close = el('button', 'component-dialog-close', '×');
    close.type = 'button';
    close.dataset.componentClose = '';
    heading.append(title, close);
    const intro = el('p', 'component-dialog-intro'),
        label = el('label', 'visually-hidden'),
        input = el('input');
    input.type = 'search';
    input.id = 'shortcut-search';
    input.maxLength = 80;
    label.htmlFor = input.id;
    const rows = el('div'),
        empty = el('p', 'social-empty');
    empty.setAttribute('role', 'status');
    const foot = el('div', 'component-dialog-footer');
    dialog.append(heading, intro, label, input, rows, empty, foot);
    document.body.append(dialog);
    const lifecycle = window.BacklogComponentDialog.mount(dialog);
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    const shortcuts = [
        ['Navigation', 'Open search', ['/']],
        ['Navigation', 'Open search from anywhere', [mac ? '⌘' : 'Ctrl', 'K']],
        ['Dialogs', 'Close dialogs', ['Esc']],
        ['Gallery', 'Previous / next image', ['←', '→']],
    ];
    function render() {
        title.textContent = t('Keyboard shortcuts');
        open.textContent = t('Browse keyboard shortcuts');
        close.setAttribute('aria-label', t('Close'));
        intro.textContent = t('Find a shortcut for what you want to do.');
        label.textContent = t('Find a shortcut');
        input.placeholder = t('Find a shortcut…');
        foot.textContent = t('Gallery arrow keys change images when zoom is off.');
        rows.replaceChildren();
        let group = '';
        const q = input.value.trim().toLocaleLowerCase(),
            matches = shortcuts.filter((s) =>
                (t(s[0]) + ' ' + t(s[1]) + ' ' + s[2].join(' ')).toLocaleLowerCase().includes(q)
            );
        for (const [category, text, keys] of matches) {
            if (group !== category) {
                group = category;
                rows.append(el('h3', 'shortcut-group', t(category)));
            }
            const row = el('div', 'shortcut-row'),
                keywrap = el('span', 'shortcut-keys');
            keys.forEach((key) => keywrap.append(el('kbd', '', key)));
            row.append(el('span', '', t(text)), keywrap);
            rows.append(row);
        }
        empty.hidden = Boolean(matches.length);
        empty.textContent = t('No shortcuts found.');
    }
    open.addEventListener('click', () => {
        input.value = '';
        render();
        lifecycle.open(open);
        input.focus();
    });
    input.addEventListener('input', render);
    window.addEventListener('backlog-language-change', render);
    render();
})();
