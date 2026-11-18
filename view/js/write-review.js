(() => {
    'use strict';
    const id = new URLSearchParams(location.search).get('id');
    const game = window.BacklogGames.find(item => item.id === id) || window.BacklogGames[0];
    const href = 'game.html?id=' + encodeURIComponent(game.id);
    document.querySelector('#editor-game-link').href = href;
    document.querySelector('#editor-back').href = href;
    const cover = document.querySelector('#editor-cover');
    cover.src = '../imagens/capas/' + game.cover;
    cover.alt = game.title + ' cover';
    document.querySelector('#editor-title').textContent = game.title;
    document.querySelector('#editor-meta').textContent = game.year + ' · ' + game.studio;
    document.title = 'Your review · ' + game.title + ' · BackLog';
})();
