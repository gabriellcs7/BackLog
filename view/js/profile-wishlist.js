(() => {
    'use strict';
    const account = window.BacklogAccount,
        ui = window.BacklogUI;
    const link = document.querySelector('#wishlist-link');
    const covers = document.querySelector('#wishlist-covers');
    const count = document.querySelector('#wishlist-count');
    const feedback = document.querySelector('#wishlist-feedback');
    let generation = 0,
        profileId;

    async function render(id) {
        profileId = id;
        const ticket = ++generation;
        link.href = ui.href('view/want-to-play.html?' + new URLSearchParams({ id }));
        covers.replaceChildren();
        count.textContent = '';
        feedback.textContent = 'Loading games…';
        try {
            const games = await window.BacklogCommunity.wantToPlay(id);
            if (ticket !== generation) return;
            count.textContent = String(games.length);
            count.setAttribute('aria-label', games.length + ' games');
            for (const game of games.slice(0, 5)) {
                const image = ui.element('img');
                image.src = ui.href('imagens/capas/' + game.cover);
                image.alt = '';
                image.loading = 'lazy';
                covers.append(image);
            }
            feedback.textContent = games.length ? '' : 'No games on this wishlist yet.';
        } catch (error) {
            if (ticket === generation) feedback.textContent = 'Could not load this wishlist.';
        }
    }

    window.addEventListener('backlog-change', () => {
        if (profileId && profileId === (account.user?.id || 'local')) render(profileId);
    });
    window.BacklogProfileWishlist = { render };
})();
