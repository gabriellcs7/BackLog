/* Only the owner can choose which single list appears on their profile. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount,
        t = (s) => window.BacklogI18n?.t(s) || s;
    function control(list, profileId, selectedId) {
        if (profileId !== (account.user?.id || 'local')) return null;
        const b = ui.element('button', 'social-button featured-list-control');
        b.type = 'button';
        b.dataset.featuredList = list.id;
        b.dataset.noTranslate = '';
        const selected = list.id === selectedId;
        b.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m16 3 5 5-4 2-3 6-2-2-7 7m3-13 6-3Z"/></svg>';
        b.append(
            document.createTextNode(t(selected ? 'Featured on profile' : 'Feature on profile'))
        );
        b.setAttribute('aria-pressed', String(selected));
        b.setAttribute(
            'aria-label',
            t(selected ? 'Unpin list' : 'Feature on profile') + ': ' + list.name
        );
        b.disabled = account.loading;
        b.addEventListener('click', async () => {
            const feedback = document.querySelector('#all-lists-feedback');
            b.disabled = true;
            if (feedback) feedback.textContent = t('Saving…');
            try {
                await account.saveFeaturedList(selected ? null : list.id);
                if (feedback) feedback.textContent = t('Featured list saved.');
                requestAnimationFrame(() =>
                    document
                        .querySelector('[data-featured-list="' + CSS.escape(list.id) + '"]')
                        ?.focus({ preventScroll: true })
                );
            } catch (error) {
                if (feedback) feedback.textContent = t(error.message);
                b.disabled = false;
            }
        });
        return b;
    }
    window.BacklogFeaturedList = { control };
})();
