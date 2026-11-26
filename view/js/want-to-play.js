(() => {
    'use strict';
    const account = window.BacklogAccount,
        ui = window.BacklogUI;
    const target = new URLSearchParams(location.search).get('id');
    const title = document.querySelector('#wanted-games-title');
    const grid = document.querySelector('#wanted-games-grid');
    const count = document.querySelector('#wanted-games-count');
    const feedback = document.querySelector('#wanted-games-feedback');
    const back = document.querySelector('#logged-profile-link');
    let generation = 0;

    async function render() {
        const ticket = ++generation;
        await account.ready;
        const id = target || account.user?.id || 'local';
        grid.replaceChildren();
        feedback.textContent = '';
        title.textContent = 'Want to play';
        count.textContent = 'Loading games…';
        try {
            const [games, player] = await Promise.all([
                window.BacklogCommunity.wantToPlay(id),
                id === 'local' ? null : account.getProfile(id),
            ]);
            if (ticket !== generation) return;
            if (id !== 'local' && !player?.profile) throw new Error('Profile not found.');
            back.href = ui.href(
                'view/profile.html' +
                    (id === 'local' ? '' : '?id=' + encodeURIComponent(id)) +
                    '#wishlist-title'
            );
            if (player) title.textContent = player.profile.display_name + '’s Want to play';
            document.title = title.textContent + ' · BackLog';
            count.textContent = games.length + (games.length === 1 ? ' game' : ' games');
            grid.replaceChildren(...games.map((game) => ui.gameCard(game.id)));
            if (!games.length)
                grid.append(ui.element('p', 'social-empty', 'No games on this wishlist yet.'));
        } catch (error) {
            if (ticket !== generation) return;
            count.textContent = '';
            feedback.textContent = error.message || 'Could not load this wishlist.';
        }
    }

    account.ready.then(render);
    window.addEventListener('backlog-account-change', () => {
        if (!account.loading) render();
    });
    window.addEventListener('backlog-change', () => {
        if (!target || target === (account.user?.id || 'local')) render();
    });
})();
