(() => {
    'use strict';
    const account = window.BacklogAccount;
    const ui = window.BacklogUI;
    const params = new URLSearchParams(location.search);
    const target = params.get('id');
    const filter = params.get('rating');
    const selectedRating = filter !== null && /^(?:[0-4](?:\.5)?|5)$/.test(filter) ? Number(filter) : null;
    const grid = document.querySelector('#logged-games-grid');
    const title = document.querySelector('#logged-games-title');
    const count = document.querySelector('#logged-games-count');
    const feedback = document.querySelector('#logged-games-feedback');
    const profileLink = document.querySelector('#logged-profile-link');
    let version = 0;

    function cardWithRating(game, rating) {
        const card = ui.gameCard(game.id);
        if (rating == null) return card;
        card.append(ui.ratingStars(rating,game.id));
        return card;
    }

    async function load() {
        const ticket = ++version;
        await account.ready;
        const id = target || account.user?.id || 'local';
        title.textContent = 'Games logged';
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
                    const status = window.Backlog.getStatus(game.id,null);
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
                if (scoreRows === null && selectedRating !== null) throw new Error('Could not load star ratings.');
                if (scoreRows === null) feedback.textContent = 'Could not load star ratings.';
                else for (const row of scoreRows) ratings.set(row.game_id, row.rating);
            }
            if (ticket !== version) return;
            if (selectedRating !== null) {
                title.textContent += ' · ' + selectedRating + ' / 5 ★';
                games = games.filter(game => ratings.has(game.id) && Number(ratings.get(game.id)) === selectedRating);
            }
            games.sort((a, b) => a.title.localeCompare(b.title));
            count.textContent = games.length + (games.length === 1 ? ' game' : ' games');
            grid.replaceChildren(...games.map(game => cardWithRating(game, ratings.get(game.id))));
            if (!games.length) grid.append(ui.element('p', 'social-empty', selectedRating === null ? 'No logged games yet.' : 'No games with this rating.'));
        } catch (error) {
            if (ticket !== version) return;
            count.textContent = '';
            feedback.textContent = error.message || 'Could not load logged games.';
        }
    }

    function refreshOwn(){
        if(!account.loading&&(!target||target==='local'||target===account.user?.id))load();
    }
    window.addEventListener('backlog-change',refreshOwn);
    window.addEventListener('backlog-review-change',refreshOwn);
    window.addEventListener('storage',event=>{
        if(event.key===null||event.key.startsWith('backlog:review:')||event.key.startsWith('backlog:status:')||/^backlog:[^:]+$/.test(event.key))refreshOwn();
    });
    account.ready.then(load);
    window.addEventListener('backlog-account-change', () => {
        if (!account.loading) load();
    });
})();
