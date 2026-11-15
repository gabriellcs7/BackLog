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

    function cardWithRating(game, rating) {
        const card = ui.gameCard(game.id);
        if (rating == null) return card;
        const stars = ui.element('span', 'logged-game-rating', '★★★★★');
        stars.setAttribute('role', 'img');
        stars.setAttribute('aria-label', rating + ' out of 5 stars');
        stars.title = rating + ' / 5';
        stars.style.setProperty('--rating-fill', (Number(rating) * 20) + '%');
        card.append(stars);
        return card;
    }

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
            const ratings = new Map();
            if (id === 'local') {
                games = window.BacklogGames.filter(game => {
                    const review = window.BacklogReviews.getDevice(game.id);
                    if (review?.rating != null) ratings.set(game.id, review.rating);
                    const status = window.Backlog.getStatus(game.id);
                    return review || (status && status.id !== 'want-to-play');
                });
            } else {
                if (id === account.user?.id) await window.Backlog.statusReady;
                const [player, rows, scoreRows] = await Promise.all([
                    account.getProfile(id), window.BacklogCommunity.loggedGames(id),
                    window.BacklogCommunity.gameRatings(id).catch(() => null)
                ]);
                if (ticket !== version) return;
                if (!player.profile) throw new Error('Profile not found.');
                title.textContent = player.profile.display_name + '\'s logged games';
                games = rows.map(row => ui.game(row.game_id)).filter(Boolean);
                if (scoreRows === null) feedback.textContent = 'Could not load star ratings.';
                else for (const row of scoreRows) ratings.set(row.game_id, row.rating);
            }
            if (ticket !== version) return;
            games.sort((a, b) => a.title.localeCompare(b.title));
            count.textContent = games.length + (games.length === 1 ? ' game' : ' games');
            grid.replaceChildren(...games.map(game => cardWithRating(game, ratings.get(game.id))));
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
