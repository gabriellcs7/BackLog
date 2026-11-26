/* Rename only the owner's list, preserving its latest contents and settings. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount;
    const t = (text) => window.BacklogI18n?.t(text) || text;
    function mount(title, profileId, listId) {
        const el = ui.element,
            wrapper = el('div', 'inline-list-name');
        title.before(wrapper);
        wrapper.append(title);
        const edit = el('button', 'inline-list-name-edit');
        edit.type = 'button';
        edit.hidden = true;
        edit.setAttribute('aria-label', t('Rename list'));
        edit.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/></svg>';
        const form = el('form', 'inline-list-name-form');
        form.hidden = true;
        const label = el('label', '', t('List name')),
            input = el('input');
        input.type = 'text';
        input.maxLength = 80;
        input.required = true;
        input.id = 'inline-list-name-input';
        label.htmlFor = input.id;
        label.append(input);
        const actions = el('div', 'social-actions'),
            save = el('button', 'social-button social-button-primary', t('Save name'));
        save.type = 'submit';
        const cancel = el('button', 'social-button', t('Cancel'));
        cancel.type = 'button';
        actions.append(save, cancel);
        form.append(label, actions);
        const message = el('p', 'social-feedback inline-list-name-feedback');
        message.id = 'inline-list-name-feedback';
        message.setAttribute('role', 'status');
        input.setAttribute('aria-describedby', message.id);
        wrapper.append(edit, form, message);
        let current = null,
            busy = false;
        const owner = () => account.user?.id || 'local';
        const canEdit = () =>
            profileId === owner() &&
            !account.loading &&
            !account.error &&
            account.getState().lists.some((list) => list.id === listId);
        function close(focus = false) {
            form.hidden = true;
            title.hidden = false;
            edit.hidden = !current || !canEdit();
            if (focus && !edit.hidden) edit.focus();
        }
        function open() {
            if (busy || !current || !canEdit()) return;
            const list = account.getState().lists.find((list) => list.id === listId);
            input.value = list.name;
            message.textContent = '';
            title.hidden = true;
            edit.hidden = true;
            form.hidden = false;
            input.focus();
            input.select();
        }
        edit.addEventListener('click', open);
        title.addEventListener('click', open);
        cancel.addEventListener('click', () => {
            if (!busy) {
                message.textContent = '';
                close(true);
            }
        });
        form.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                if (!busy) {
                    message.textContent = '';
                    close(true);
                }
            }
        });
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (busy || !canEdit()) return;
            const name = input.value.trim();
            if (!name || name.length > 80) {
                message.textContent = t('Use 1 to 80 characters for the list name.');
                input.focus();
                return;
            }
            const latest = account.getState().lists.find((list) => list.id === listId),
                savedOwner = owner();
            if (name === latest.name) {
                close(true);
                return;
            }
            busy = true;
            input.disabled = save.disabled = cancel.disabled = true;
            message.textContent = t('Saving name…');
            try {
                await account.saveList({ ...latest, name });
                if (owner() !== savedOwner || !canEdit()) return;
                current = account.getState().lists.find((list) => list.id === listId);
                title.textContent = current.name;
                document.title = current.name + ' · BackLog';
                close(true);
                message.textContent = t('List renamed.');
            } catch (error) {
                if (owner() !== savedOwner || !canEdit()) return;
                form.hidden = false;
                title.hidden = true;
                edit.hidden = true;
                input.value = name;
                message.textContent = t(
                    error.message || 'Could not rename this list. Please try again.'
                );
            } finally {
                busy = false;
                input.disabled = save.disabled = cancel.disabled = false;
            }
        });
        window.addEventListener('backlog-language-change', () => {
            edit.setAttribute('aria-label', t('Rename list'));
            save.textContent = t('Save name');
            cancel.textContent = t('Cancel');
        });
        return {
            reset() {
                current = null;
                close();
                title.classList.remove('is-editable');
                message.textContent = '';
            },
            setList(list) {
                current = list;
                edit.hidden = !canEdit();
                title.classList.toggle('is-editable', canEdit());
            },
        };
    }
    window.BacklogInlineListName = { mount };
})();
