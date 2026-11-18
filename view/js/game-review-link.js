(() => {
    'use strict';
    const id = new URLSearchParams(location.search).get('id');
    const game = window.BacklogGames.find(item => item.id === id) || window.BacklogGames[0];
    const destination = 'write-review.html?id=' + encodeURIComponent(game.id);
    const link = document.querySelector('#write-review-link');
    link.href = destination;
    document.querySelector('#review-tab').href = destination;

    function render() {
        const review = window.BacklogReviews.get(game.id);
        link.firstChild.textContent = review ? 'Your rating & review ' : 'Rate or review ';
        const preview = document.querySelector('.rating-preview');
        preview.querySelector('strong').textContent = review?.rating != null ? review.rating + ' / 5' : 'Not rated yet';
        preview.querySelector('div > span').textContent = review?.rating != null ? 'Your rating' : 'Rate or review this game';
        preview.querySelector('.rating-star').textContent = review?.rating > 0 ? '★' : '☆';
    }
    function openLegacyEditor() {
        if (location.hash === '#your-review') location.replace(destination);
    }
    window.addEventListener('hashchange', openLegacyEditor);
    openLegacyEditor();
    for (const event of ['backlog-account-change', 'backlog-review-change', 'pageshow', 'storage']) {
        window.addEventListener(event, render);
    }
    window.BacklogAccount.ready.then(render);
    render();
})();
