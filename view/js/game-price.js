(() => {
    const id = new URLSearchParams(location.search).get('id'),
        game = window.BacklogUI.game(id) || window.BacklogGames[0],
        host = document.getElementById('game-price');
    if (host) host.append(window.BacklogPrices.create(game.id, true));
})();
