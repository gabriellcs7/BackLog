(() => {
    'use strict';
    const account = window.BacklogAccount,
        ui = window.BacklogUI,
        api = window.BacklogCommonGames,
        target = new URLSearchParams(location.search).get('id'),
        grid = document.querySelector('#common-games-grid'),
        feedback = document.querySelector('#common-games-feedback'),
        count = document.querySelector('#common-games-count'),
        search = document.querySelector('#common-games-search'),
        title = document.querySelector('#common-games-title');
    const t = (s) => window.BacklogI18n?.t(s) || s;
    let version = 0,
        data = null,
        profile = null;
    const normalize = (s) =>
        s
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    function draw() {
        if (!data || !profile) return;
        const query = normalize(search.value.trim()),
            items = data.items.filter((item) => normalize(item.game.title).includes(query));
        grid.replaceChildren(...items.map((item) => api.card(item, profile, data)));
        count.textContent = items.length + ' / ' + data.items.length + ' ' + t('shared games');
        feedback.textContent = items.length
            ? ''
            : t(data.items.length ? 'No games match your search.' : 'No games in common yet.');
    }
    async function load() {
        const ticket = ++version;
        grid.replaceChildren();
        data = profile = null;
        search.disabled = true;
        feedback.replaceChildren();
        count.textContent = '';
        await account.ready;
        if (ticket !== version) return;
        if (!account.user) {
            feedback.append(document.createTextNode(t('Sign in to compare your games.') + ' '));
            const link = ui.element('a', 'player-link', t('Sign in ↗'));
            link.href = ui.href('view/profile.html#account');
            feedback.append(link);
            return;
        }
        feedback.textContent = t('Finding your shared games…');
        try {
            if (!target || target === account.user.id)
                throw Error('Choose another player to compare games.');
            const [player, result] = await Promise.all([
                account.getProfile(target),
                api.load(target),
            ]);
            if (ticket !== version) return;
            if (!player.profile) throw Error('Profile not found.');
            profile = player.profile;
            data = result;
            title.textContent = t('Games in common');
            document.querySelector('#common-player-name').textContent = profile.display_name;
            const back = document.querySelector('#common-profile-link');
            back.href = ui.href(
                'view/profile.html?id=' + encodeURIComponent(target) + '#profile-common-games'
            );
            search.disabled = false;
            draw();
        } catch (error) {
            if (ticket === version) {
                feedback.textContent = t(
                    error.message || 'Could not compare games. Please try again.'
                );
                const retry = ui.element('button', 'social-button', t('Try again'));
                retry.type = 'button';
                retry.addEventListener('click', load);
                feedback.append(document.createTextNode(' '), retry);
            }
        }
    }
    search.addEventListener('input', draw);
    account.ready.then(load);
    window.addEventListener('backlog-account-change', load);
    window.addEventListener('backlog-change', () => {
        if (!account.loading) load();
    });
    window.addEventListener('backlog-review-change', load);
    window.addEventListener('backlog-language-change', () => {
        if (data) draw();
    });
})();
