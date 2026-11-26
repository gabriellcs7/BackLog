(() => {
    'use strict';
    const account = window.BacklogAccount,
        ui = window.BacklogUI;
    const grid = document.querySelector('#profile-playing');
    const feedback = document.querySelector('#profile-playing-feedback');
    let generation = 0,
        profileId;

    async function render(id) {
        profileId = id;
        const ticket = ++generation;
        try {
            const games = await window.BacklogCommunity.currentlyPlaying(id);
            if (ticket !== generation) return;
            grid.replaceChildren(...games.map((game) => ui.gameCard(game.id)));
            feedback.textContent = games.length ? '' : 'No games currently playing.';
        } catch {
            if (ticket !== generation) return;
            grid.replaceChildren();
            feedback.textContent = 'Could not load currently playing games.';
        }
    }

    window.addEventListener('backlog-change', () => {
        if (profileId === (account.user?.id || 'local')) render(profileId);
    });
    window.BacklogProfilePlaying = { render };
})();
