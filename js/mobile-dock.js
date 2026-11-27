/* Mobile-only navigation. Real links preserve normal browser navigation. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount,
        icons = window.BacklogIcons;
    const navbar = document.querySelector('.navbar');
    if (!ui || !icons || !navbar) return;
    const el = ui.element,
        t = (value) => window.BacklogI18n?.t(value) || value;
    const media = matchMedia('(max-width: 800px)');
    const dock = el('nav', 'mobile-site-dock');
    dock.dataset.noTranslate = '';
    const definitions = [
        ['profile', 'Profile', 'view/profile.html'],
        ['activity', 'Activity', 'view/activity.html'],
        ['games', 'Games', 'view/pagina_jogos.html'],
        ['backlog', 'My backlog', 'view/pagina_jogos.html?saved=1'],
        ['diary', 'Diary', 'view/diary.html'],
    ];
    const links = definitions.map(([id, name, path]) => {
        const link = el('a', 'mobile-dock-link');
        link.href = ui.href(path);
        link.dataset.dockPage = id;
        const label = el('span', 'mobile-dock-label', t(name));
        label.setAttribute('aria-hidden', 'true');
        link.append(icons.icon(id), label);
        dock.append(link);
        return link;
    });
    document.body.append(dock);
    let accountControl = null,
        accountMarker = null;

    function activePage() {
        const file = location.pathname.split('/').pop();
        const params = new URLSearchParams(location.search);
        const owner = account?.user?.id || 'local';
        const viewed = params.get(file === 'list.html' ? 'profile' : 'id');
        const own = !viewed || viewed === owner;
        if (file === 'pagina_jogos.html') return params.get('saved') === '1' ? 'backlog' : 'games';
        if (['game.html', 'saga.html', 'discover.html', 'write-review.html'].includes(file))
            return 'games';
        if (file === 'activity.html') return 'activity';
        if (file === 'diary.html') return own ? 'diary' : '';
        if (
            [
                'profile.html',
                'profile-lists.html',
                'profile-reviews.html',
                'logged-games.html',
                'want-to-play.html',
                'statistics.html',
                'list.html',
            ].includes(file)
        )
            return own ? 'profile' : '';
        return '';
    }

    function editing() {
        const focused = document.activeElement;
        return (
            focused &&
            !focused.readOnly &&
            (focused.matches('textarea, [contenteditable="true"]') ||
                focused.matches(
                    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="hidden"])'
                ))
        );
    }
    function updateEditing() {
        document.documentElement.classList.toggle(
            'mobile-dock-editing',
            Boolean(media.matches && editing())
        );
    }

    function render() {
        const mobile = media.matches;
        const active = activePage();
        dock.hidden = !mobile;
        document.documentElement.classList.toggle('mobile-dock-ready', mobile);
        dock.setAttribute('aria-label', t('Mobile navigation'));
        links.forEach((link, index) => {
            const name = t(definitions[index][1]);
            link.setAttribute('aria-label', name);
            link.querySelector('span').textContent = name;
            if (definitions[index][0] === active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        // Keep the existing account dropdown (including Settings) available up top.
        accountControl ||= document.querySelector('.nav-account-control');
        if (accountControl && !accountMarker) {
            accountMarker = document.createComment('account-control-desktop-position');
            accountControl.before(accountMarker);
        }
        if (accountControl && mobile && accountControl.parentElement !== navbar) {
            navbar.insertBefore(
                accountControl,
                navbar.querySelector('.notification-bell, .menu-toggle')
            );
        } else if (
            accountControl &&
            !mobile &&
            accountMarker?.parentNode &&
            accountControl.previousSibling !== accountMarker
        ) {
            accountMarker.after(accountControl);
        }
        if (mobile) {
            document.getElementById('navigation')?.classList.remove('is-open');
            document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
        }
        updateEditing();
    }
    dock.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = links.indexOf(document.activeElement);
        links[
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? links.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length
        ].focus();
    });
    media.addEventListener('change', render);
    document.addEventListener('focusin', () => queueMicrotask(updateEditing));
    document.addEventListener('focusout', () => queueMicrotask(updateEditing));
    window.visualViewport?.addEventListener('resize', updateEditing);
    window.addEventListener('backlog-account-change', render);
    window.addEventListener('backlog-language-change', render);
    window.addEventListener('popstate', render);
    account?.ready.then(render);
    render();
})();
