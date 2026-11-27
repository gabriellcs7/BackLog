/* Real list actions, gated by the same profile/list load as the page. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount;
    const t = (value) => window.BacklogI18n?.t(value) || value;
    function mount({ share, profileId, listId, feedback }) {
        const el = ui.element,
            toolbar = el('div', 'list-action-toolbar');
        toolbar.dataset.noTranslate = '';
        toolbar.setAttribute('role', 'toolbar');
        const edit = el('a', 'list-action-item');
        const copy = el('button', 'list-action-item');
        const download = el('button', 'list-action-item');
        copy.type = download.type = 'button';
        share.classList.remove('social-button');
        share.classList.add('list-action-item');
        const items = [
            [edit, 'edit', 'Edit list'],
            [share, 'share', 'Share list'],
            [copy, 'copy', 'Copy link'],
            [download, 'download', 'Export list'],
        ];
        for (const [button, icon, label] of items) {
            const caption = el('span', 'list-action-label');
            caption.append(el('span', '', t(label)));
            button.replaceChildren(window.BacklogIcons.icon(icon), caption);
            toolbar.append(button);
        }
        document.querySelector('.logged-games-heading').append(toolbar);
        const fallback = el('input', 'list-copy-fallback');
        fallback.type = 'text';
        fallback.readOnly = true;
        fallback.hidden = true;
        fallback.setAttribute('aria-label', t('Page address'));
        document.querySelector('.list-page-tools').append(fallback);
        let current = null;
        function localize() {
            toolbar.setAttribute('aria-label', t('List actions'));
            for (const [button, , label] of items) {
                button.setAttribute('aria-label', t(label));
                button.querySelector('.list-action-label span').textContent = t(label);
            }
            fallback.setAttribute('aria-label', t('Page address'));
        }
        copy.addEventListener('click', async () => {
            if (!current) return;
            const selected = current;
            try {
                await navigator.clipboard.writeText(location.href);
                if (current !== selected) return;
                fallback.hidden = true;
                feedback.textContent = t(
                    selected.is_public
                        ? 'Link copied!'
                        : 'Private list: only you can open this link.'
                );
            } catch {
                if (current !== selected) return;
                fallback.hidden = false;
                fallback.value = location.href;
                fallback.focus();
                fallback.select();
                feedback.textContent = t('Copy the selected link.');
            }
        });
        download.addEventListener('click', () => {
            if (!current) return;
            const payload = {
                name: current.name,
                description: current.description || '',
                tags: current.tags || [],
                ranked: current.is_ranked === true,
                games: current.gameIds.map((id, index) => ({
                    id,
                    title: ui.game(id)?.title || id,
                    ...(current.is_ranked ? { rank: index + 1 } : {}),
                })),
            };
            const url = URL.createObjectURL(
                new Blob([JSON.stringify(payload, null, 4) + '\n'], {
                    type: 'application/json;charset=utf-8',
                })
            );
            const a = el('a');
            a.href = url;
            a.download =
                (current.name
                    .normalize('NFKD')
                    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
                    .slice(0, 60) || 'backlog-list') + '.json';
            document.body.append(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            feedback.textContent = t('List exported.');
        });
        toolbar.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            const visible = items.map(([b]) => b).filter((b) => !b.hidden && !b.disabled);
            if (!visible.length) return;
            event.preventDefault();
            const index = visible.indexOf(document.activeElement);
            const next =
                event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? visible.length - 1
                      : (index + (event.key === 'ArrowRight' ? 1 : -1) + visible.length) %
                        visible.length;
            visible[next].focus();
        });
        function reset() {
            current = null;
            share.disabled = copy.disabled = download.disabled = true;
            edit.hidden = true;
            edit.removeAttribute('href');
            fallback.hidden = true;
            fallback.value = '';
        }
        window.addEventListener('backlog-language-change', localize);
        localize();
        reset();
        return {
            reset,
            setList(list) {
                current = list;
                copy.disabled = download.disabled = false;
                const own =
                    profileId === (account.user?.id || 'local') &&
                    !account.loading &&
                    !account.error;
                edit.hidden = !own;
                if (own)
                    edit.href = ui.href(
                        'view/profile.html?' + new URLSearchParams({ 'edit-list': listId })
                    );
            },
        };
    }
    window.BacklogListActions = { mount };
})();
