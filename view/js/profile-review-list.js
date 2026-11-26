(() => {
    'use strict';
    const ui = window.BacklogUI,
        { element: el, game } = ui;
    function profileReviewCard(review) {
        const item = game(review.game_id);
        if (!item) return null;
        const card = el('a', 'profile-review-card');
        card.href = ui.reviewHref(review.id ? 'id' : 'game', review.id || item.id);
        const image = el('img');
        image.src = '../imagens/capas/' + item.cover;
        image.alt = '';
        image.loading = 'lazy';
        const copy = el('div');
        const rating = review.rating === null ? 'Written review' : review.rating + ' / 5 ★';
        const likes = Number(review.like_count || 0);
        const score = el('span', 'social-rating');
        if (review.rating === null) score.append(document.createTextNode('Written review'));
        else score.append(ui.ratingStars(Number(review.rating), item.id));
        score.append(
            document.createTextNode(' · ' + likes + ' ' + (likes === 1 ? 'like' : 'likes'))
        );
        copy.append(
            el('h3', '', item.title),
            score,
            el('p', '', review.text || 'Rated this game.')
        );
        card.append(image, copy);
        return card;
    }

    async function get(profileId, offset, limit) {
        if (profileId !== 'local')
            return window.BacklogCommunity.profileReviews(profileId, offset, limit);
        return window.BacklogGames.map((item) => {
            const review = window.BacklogReviews.getDevice(item.id);
            return review ? { ...review, game_id: item.id } : null;
        })
            .filter(Boolean)
            .sort(
                (a, b) =>
                    b.updatedAt.localeCompare(a.updatedAt) || a.game_id.localeCompare(b.game_id)
            )
            .slice(offset, offset + limit);
    }
    window.BacklogProfileReviews = { get, card: profileReviewCard };
})();
