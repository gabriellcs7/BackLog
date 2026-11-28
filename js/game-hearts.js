/* Personal game appreciation is not the review's community like counter. */
(() => {
    'use strict';
    const t = (value) => window.BacklogI18n?.t(value) || value;
    function append(node, review) {
        node.querySelectorAll('.review-game-heart').forEach((item) => item.remove());
        if (review?.gameLiked !== true && review?.game_liked !== true) return;
        const badge = document.createElement('span');
        badge.className = 'review-game-heart';
        badge.dataset.noTranslate = '';
        badge.setAttribute('role', 'img');
        badge.setAttribute('aria-label', t('This player liked this game.'));
        badge.title = t('This player liked this game.');
        badge.innerHTML =
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21 3.4 12.8C-3 6.4 6.4-1 12 5.5 17.6-1 27 6.4 20.6 12.8Z"/></svg>';
        node.append(badge);
    }
    window.addEventListener('backlog-language-change', () =>
        document.querySelectorAll('.review-game-heart').forEach((node) => {
            node.title = t('This player liked this game.');
            node.setAttribute('aria-label', node.title);
        })
    );
    window.BacklogGameHearts = Object.freeze({ append });
})();
