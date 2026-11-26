/* Página completa da franquia, sem o limite da prévia. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        games = window.BacklogGames,
        id = new URLSearchParams(location.search).get('id'),
        current = ui.game(id),
        grid = document.getElementById('saga-page-games');
    if (!current?.franchise) {
        document.getElementById('saga-page-count').textContent = 'Saga not found.';
        return;
    }
    const title = document.getElementById('saga-page-title');
    title.textContent = current.franchise;
    title.dataset.noTranslate = '';
    document.title = current.franchise + ' · BackLog';
    document.getElementById('saga-back').href = ui.href(
        'view/game.html?id=' + encodeURIComponent(current.id)
    );
    const entries = games
        .filter((g) => g.franchise === current.franchise)
        .sort(
            (a, b) =>
                (parseInt(a.year) || 9999) - (parseInt(b.year) || 9999) ||
                a.title.localeCompare(b.title)
        );
    document.getElementById('saga-page-count').textContent = String(entries.length);
    for (const game of entries) {
        const card = ui.gameCard(game.id);
        card.append(ui.element('p', '', String(game.year || '')));
        grid.append(card);
    }
})();
