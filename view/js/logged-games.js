(() => {
    'use strict';
    const account = window.BacklogAccount;
    const ui = window.BacklogUI;
    const target = new URLSearchParams(location.search).get('id');
    const grid = document.querySelector('#logged-games-grid');
    const title = document.querySelector('#logged-games-title');
    const count = document.querySelector('#logged-games-count');
    const feedback = document.querySelector('#logged-games-feedback');
    const profileLink = document.querySelector('#logged-profile-link');
    let version = 0;

    async function load() {
        const ticket = ++version;
        await account.ready;
        const id = target || account.user?.id || 'local';
        profileLink.href = id === 'local' ? 'profile.html' : 'profile.html?id=' + encodeURIComponent(id);
        grid.replaceChildren();
        feedback.textContent = '';
        count.textContent = 'Loading games…';
        try {
            let games;
            if (id === 'local') {
                games = window.BacklogGames.filter(game => {
                    const status = window.Backlog.getStatus(game.id);
                    return window.BacklogReviews.getDevice(game.id) ||
                        (status && status.id !== 'want-to-play');
                });
            } else {
                if (id === account.user?.id) await window.Backlog.statusReady;
                const [player, rows] = await Promise.all([
                    account.getProfile(id), window.BacklogCommunity.loggedGames(id)
                ]);
                if (ticket !== version) return;
                if (!player.profile) throw new Error('Profile not found.');
                title.textContent = player.profile.display_name + '’s logged games';
                games = rows.map(row => ui.game(row.game_id)).filter(Boolean);
            }
            if (ticket !== version) return;
            games.sort((a, b) => a.title.localeCompare(b.title));
            count.textContent = games.length + (games.length === 1 ? ' game' : ' games');
            grid.replaceChildren(...games.map(game => ui.gameCard(game.id)));
            if (!games.length) grid.append(ui.element('p', 'social-empty', 'No logged games yet.'));
        } catch (error) {
            if (ticket !== version) return;
            count.textContent = '';
            feedback.textContent = error.message || 'Could not load logged games.';
        }
    }

    account.ready.then(load);
    window.addEventListener('backlog-account-change', () => {
        if (!account.loading) load();
    });
})();
