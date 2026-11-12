(() => {
    'use strict';
    const account = window.BacklogAccount;
    const ui = window.BacklogUI;
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const entryId = params.get('entry');
    const heading = document.querySelector('#single-review-heading');
    const content = document.querySelector('#single-review-content');
    const feedback = document.querySelector('#single-review-feedback');
    const back = document.querySelector('#single-review-back');
    let version = 0;

    async function load() {
        const ticket = ++version;
        await account.ready;
        feedback.textContent = 'Loading review…';
        heading.replaceChildren();
        content.replaceChildren();
        try {
            let review, gameId;
            if (id) {
                if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('Review not found.');
                review = await window.BacklogCommunity.review(id);
                gameId = review?.game_id;
            } else if (entryId) {
                review = (await window.BacklogDiary.entries()).find(entry => entry.id === entryId);
                gameId = review?.gameId;
            } else {
                gameId = params.get('game');
                review = window.BacklogReviews.getDevice(gameId);
            }
            if (ticket !== version) return;
            const item = ui.game(gameId);
            if (!review || !item) throw new Error('Review not found or no longer available.');
            const gameUrl = 'game.html?id=' + encodeURIComponent(item.id);
            back.href = entryId && !id ? 'diary.html' : gameUrl;
            back.textContent = entryId && !id ? '← Diary' : '← Game page';
            const header = ui.element('header', 'single-review-heading');
            const cover = ui.element('img');
            cover.src = '../imagens/capas/' + item.cover;
            cover.alt = '';
            const copy = ui.element('div');
            copy.append(ui.element('h1', '', item.title), ui.element('p', 'social-small', id ? 'Community review' : 'Your review'));
            header.append(cover, copy);
            heading.append(header);
            if (id) {
                content.append(window.BacklogReviewCard(review, true));
                if (review.user_id === account.user?.id) {
                    const edit = ui.element('a', 'social-button', 'Edit on game page');
                    edit.href = gameUrl + '#your-review';
                    content.append(edit);
                }
            } else {
                const article = ui.element('article', 'community-review');
                const rating = review.rating === null ? 'Written review' : review.rating + ' / 5 ★';
                article.append(ui.element('p', 'social-rating', rating), ui.element('p', 'community-review-text', review.text || 'Rated this game.'));
                content.append(article);
            }
            document.title = item.title + ' · Review · BackLog';
            feedback.textContent = '';
        } catch (error) {
            if (ticket === version) feedback.textContent = error.message || 'Could not load this review.';
        }
    }

    account.ready.then(load);
    window.addEventListener('backlog-account-change', () => {
        if (!account.loading) load();
    });
})();
