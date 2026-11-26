/* Filtros múltiplos: o select nativo guarda os valores e continua sendo a alternativa. */
(() => {
    'use strict';
    const controls = [];
    let active = null,
        serial = 0;
    const el = (tag, cls = '', text) => {
        const n = document.createElement(tag);
        n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    };
    for (const select of document.querySelectorAll('select[data-multi-filter]')) {
        const name = select.dataset.multiFilter,
            options = [...select.options].filter((option) => option.value !== 'all'),
            wrap = el('div', 'multi-filter'),
            trigger = el('button', 'multi-filter-trigger'),
            chips = el('div', 'multi-filter-chips'),
            panel = el('div', 'multi-filter-panel');
        trigger.type = 'button';
        trigger.setAttribute('aria-label', name);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-haspopup', 'dialog');
        panel.id = 'multi-filter-' + ++serial;
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', name + ' filters');
        trigger.setAttribute('aria-controls', panel.id);
        chips.setAttribute('aria-label', 'Selected ' + name.toLowerCase());
        const search = el('input', 'multi-filter-search');
        search.type = 'search';
        search.placeholder = 'Find an option…';
        search.setAttribute('aria-label', 'Find ' + name.toLowerCase());
        const rows = el('div', 'multi-filter-options'),
            empty = el('p', 'social-small', 'No matching options.');
        empty.hidden = true;
        const choices = options.map((option) => {
            const row = el('label', 'multi-filter-option'),
                check = el('input');
            check.type = 'checkbox';
            check.value = option.value;
            check.checked = option.selected;
            row.append(check, el('span', '', option.textContent.trim()));
            rows.append(row);
            check.addEventListener('change', () => {
                option.selected = check.checked;
                const all = select.querySelector('option[value="all"]');
                if (all) all.selected = false;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                sync();
            });
            return { row, check, option };
        });
        const footer = el('div', 'multi-filter-footer'),
            clear = el('button', '', 'Clear all'),
            done = el('button', '', 'Done');
        clear.type = done.type = 'button';
        footer.append(clear, done);
        panel.append(search, rows, empty, footer);
        select.before(wrap);
        wrap.append(select, trigger, chips, panel);
        select.hidden = true;
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');
        function position() {
            const box = trigger.getBoundingClientRect();
            panel.style.width = Math.min(Math.max(box.width, 250), innerWidth - 24) + 'px';
            panel.style.maxHeight = Math.max(150, Math.min(430, innerHeight - 24)) + 'px';
            panel.style.left =
                Math.max(12, Math.min(innerWidth - panel.offsetWidth - 12, box.left)) + 'px';
            panel.style.top =
                (box.bottom + panel.offsetHeight + 8 < innerHeight
                    ? box.bottom + 8
                    : Math.max(12, box.top - panel.offsetHeight - 8)) + 'px';
        }
        function close(focus = false) {
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (active === control) active = null;
            if (focus) trigger.focus();
        }
        function open() {
            active?.close();
            active = control;
            search.value = '';
            choices.forEach(({ row }) => (row.hidden = false));
            empty.hidden = true;
            panel.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            sync();
            position();
            search.focus({ preventScroll: true });
        }
        function sync() {
            const selected = options.filter((option) => option.selected);
            trigger.textContent = selected.length
                ? selected.length + ' selected'
                : 'All ' + name.toLowerCase();
            trigger.append(el('span', 'multi-filter-chevron', '⌄'));
            chips.replaceChildren();
            for (const option of selected) {
                const chip = el('span', 'multi-filter-chip'),
                    remove = el('button', '', '×');
                remove.type = 'button';
                remove.setAttribute(
                    'aria-label',
                    'Remove ' + option.textContent.trim() + ' filter'
                );
                chip.append(el('span', '', option.textContent.trim()), remove);
                chips.append(chip);
                remove.addEventListener('click', () => {
                    option.selected = false;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    sync();
                    trigger.focus();
                });
            }
            chips.hidden = !selected.length;
            choices.forEach(({ check, option }) => (check.checked = option.selected));
            clear.disabled = !selected.length;
        }
        const control = { sync, close };
        controls.push(control);
        trigger.addEventListener('click', () => (panel.hidden ? open() : close()));
        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                open();
            }
        });
        done.addEventListener('click', () => close(true));
        clear.addEventListener('click', () => {
            [...select.options].forEach((option) => (option.selected = false));
            select.dispatchEvent(new Event('change', { bubbles: true }));
            sync();
        });
        select.addEventListener('change', sync);
        search.addEventListener('input', () => {
            const query = search.value.toLowerCase();
            let visible = 0;
            choices.forEach(({ row, option }) => {
                row.hidden = !option.textContent.toLowerCase().includes(query);
                if (!row.hidden) visible++;
            });
            empty.hidden = Boolean(visible);
        });
        for (const label of select.labels || [])
            label.addEventListener('click', (event) => {
                event.preventDefault();
                trigger.focus();
            });
        document.addEventListener('pointerdown', (event) => {
            if (active === control && !wrap.contains(event.target)) close();
        });
        document.addEventListener('focusin', (event) => {
            if (active === control && !wrap.contains(event.target)) close();
        });
        panel.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                close(true);
            }
        });
        window.addEventListener('resize', () => close());
        window.addEventListener(
            'scroll',
            () => {
                if (active === control) position();
            },
            { passive: true }
        );
        sync();
    }
    window.BacklogMultiSelect = { sync: () => controls.forEach((control) => control.sync()) };
})();
