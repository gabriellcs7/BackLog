/* Prévia compacta de seguidores, com dados reais e acesso ao diálogo existente. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        bar =
            document.getElementById('profile-counts') ||
            document.querySelector('.profile-social-bar');
    if (!ui || !bar) return;
    const el = ui.element,
        t = (s) => window.BacklogI18n?.t(s) || s,
        host = el('div', 'follower-stack-host');
    host.id = 'follower-avatar-preview';
    host.hidden = true;
    bar.append(host);
    let current = null;
    function clear() {
        current = null;
        host.hidden = true;
        host.replaceChildren();
    }
    function render(profiles, total) {
        const unique = [
            ...new Map(
                profiles.filter((p) => typeof p.id === 'string').map((p) => [p.id, p])
            ).values(),
        ].slice(0, 5);
        current = { profiles: unique, total };
        host.replaceChildren();
        host.hidden = !unique.length;
        if (!unique.length) return;
        const button = el('button', 'follower-stack');
        button.type = 'button';
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', 'connections-dialog');
        button.setAttribute(
            'aria-label',
            t('View followers') +
                ' · ' +
                new Intl.NumberFormat(window.BacklogI18n?.locale || 'en').format(total)
        );
        const avatars = el('span', 'follower-stack-avatars');
        avatars.setAttribute('aria-hidden', 'true');
        unique.forEach((profile, i) => {
            const slot = el('span', 'follower-stack-person');
            slot.style.setProperty('--avatar-index', i);
            slot.dataset.noTranslate = '';
            slot.append(
                ui.avatar(profile),
                el('span', 'follower-stack-tooltip', profile.display_name || 'Player')
            );
            avatars.append(slot);
        });
        const rest = Math.max(0, Number(total) - unique.length);
        if (rest) avatars.append(el('span', 'follower-stack-more', '+' + rest));
        const copy = el('span', 'follower-stack-copy');
        copy.append(
            el('small', '', t('Follower preview')),
            el('strong', '', t('View followers') + ' ↗')
        );
        button.append(avatars, copy);
        button.addEventListener('click', () => document.getElementById('show-followers').click());
        host.append(button);
    }
    function error() {
        clear();
        host.hidden = false;
        const status = el('p', 'social-small', t('Could not load follower preview.'));
        status.setAttribute('role', 'status');
        host.append(status);
    }
    window.addEventListener('backlog-language-change', () => {
        if (current) render(current.profiles, current.total);
    });
    window.BacklogFollowerStack = { render, clear, error };
})();
