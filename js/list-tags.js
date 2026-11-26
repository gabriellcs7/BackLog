/* Etiquetas de listas: no máximo oito, com entrada por teclado e chips animados. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        t = (s) => window.BacklogI18n?.t(s) || s;
    function clean(value) {
        const found = new Set();
        return (Array.isArray(value) ? value : [])
            .filter((s) => typeof s === 'string')
            .map((s) => s.trim())
            .filter(
                (s) =>
                    s &&
                    s.length <= 24 &&
                    !/[\r\n\t]/.test(s) &&
                    !found.has(s.toLowerCase()) &&
                    found.add(s.toLowerCase())
            )
            .slice(0, 8);
    }
    function chips(tags) {
        const node = ui.element('div', 'list-tag-chips');
        node.dataset.noTranslate = '';
        for (const tag of clean(tags)) node.append(ui.element('span', 'list-tag', tag));
        return node;
    }
    function input(field) {
        let tags = [],
            selected = -1;
        const shell = ui.element('div', 'tag-input-shell'),
            list = ui.element('div', 'tag-input-chips'),
            status = ui.element('p', 'social-small tag-input-status');
        status.setAttribute('role', 'status');
        field.before(shell);
        shell.append(list, field);
        shell.after(status);
        const reduced = () =>
            window.BacklogMotion?.matches ?? matchMedia('(prefers-reduced-motion:reduce)').matches;
        function draw() {
            list.replaceChildren();
            for (const [i, tag] of tags.entries()) {
                const b = ui.element('button', 'tag-input-token');
                b.type = 'button';
                b.dataset.noTranslate = '';
                b.dataset.tag = tag;
                b.append(document.createTextNode(tag), ui.element('span', '', '×'));
                b.lastChild.setAttribute('aria-hidden', 'true');
                b.setAttribute('aria-label', t('Remove tag') + ': ' + tag);
                b.addEventListener('click', () => remove(tag));
                b.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const next = i + (e.key === 'ArrowLeft' ? -1 : 1);
                        if (next >= 0 && next < tags.length) list.children[next].focus();
                        else field.focus();
                    } else if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();
                        remove(tag);
                    } else if (e.key === 'Escape') field.focus();
                });
                list.append(b);
            }
            field.placeholder = t(tags.length >= 8 ? 'Maximum 8 tags' : 'Add a tag…');
        }
        function remove(tag) {
            const node = [...list.children].find((n) => n.dataset.tag === tag);
            if (!node || node.disabled) return;
            node.disabled = true;
            tags = tags.filter((t) => t !== tag);
            const done = () => {
                draw();
                field.focus();
                status.textContent = '';
            };
            if (!reduced() && node) {
                node.animate(
                    [
                        { opacity: 1, transform: 'scale(1)' },
                        { opacity: 0, transform: 'scale(.8)' },
                    ],
                    { duration: 140 }
                ).finished.then(done, done);
            } else done();
        }
        function add(value, strict = false) {
            const label = value.trim();
            if (!label) return true;
            let message = '';
            if (label.length > 24 || /[\r\n\t]/.test(label))
                message = 'Use tags of up to 24 characters.';
            else if (tags.some((s) => s.toLowerCase() === label.toLowerCase()))
                message = 'This tag is already added.';
            else if (tags.length >= 8) message = 'You can add up to 8 tags.';
            if (message) {
                status.textContent = t(message);
                if (!reduced())
                    shell.animate(
                        [
                            { transform: 'translateX(0)' },
                            { transform: 'translateX(-3px)' },
                            { transform: 'translateX(3px)' },
                            { transform: 'none' },
                        ],
                        { duration: 180 }
                    );
                if (strict) throw Error(t(message));
                return false;
            }
            tags.push(label);
            draw();
            if (!reduced())
                list.lastChild.animate(
                    [
                        { opacity: 0, transform: 'scale(.85)' },
                        { opacity: 1, transform: 'none' },
                    ],
                    { duration: 180 }
                );
            status.textContent = '';
            return true;
        }
        field.addEventListener('keydown', (e) => {
            if (e.isComposing) return;
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                if (add(field.value)) field.value = '';
            } else if (e.key === 'Backspace' && !field.value && tags.length) {
                e.preventDefault();
                list.lastChild.focus();
            } else if (e.key === 'ArrowLeft' && field.selectionStart === 0 && tags.length) {
                e.preventDefault();
                list.lastChild.focus();
            }
        });
        field.addEventListener('paste', (e) => {
            const value = e.clipboardData.getData('text/plain');
            if (!/[,\n]/.test(value)) return;
            e.preventDefault();
            for (const part of value.split(/[,\n]+/)) add(part);
            field.value = '';
        });
        const api = {
            set(values) {
                tags = clean(values);
                field.value = '';
                status.textContent = '';
                draw();
            },
            get() {
                if (field.value.trim()) {
                    add(field.value, true);
                    field.value = '';
                }
                return [...tags];
            },
            add,
        };
        draw();
        return api;
    }
    const field = document.getElementById('list-tags-input');
    const editor = field ? input(field) : null;
    window.BacklogListTags = { clean, chips, editor };
})();
