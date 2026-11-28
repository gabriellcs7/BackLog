/* Adaptação local do Marquee 01 enviado: reviews reais, sem dependências React. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount,
        api = window.BacklogCommunity,
        el = ui.element;
    const root = document.querySelector('#community-feed'),
        controls = document.querySelector('#refresh-community')?.parentElement;
    if (!root || !controls) return;
    const pause = el('button', 'social-button social-button-quiet', 'Pause animation');
    pause.id = 'pause-game-reviews';
    pause.type = 'button';
    pause.hidden = true;
    controls.append(pause);
    let rows = [],
        paused = false,
        hovered = false,
        focused = false,
        visible = true;
    const device = matchMedia('(prefers-reduced-motion:reduce)'),
        pending = new Set();
    const reduced = () => window.BacklogMotion?.matches ?? device.matches;
    function configure() {
        const still = paused || reduced() || rows.length < 3;
        root.classList.toggle('is-static', still);
        root.classList.toggle('is-paused', hovered || focused || document.hidden || !visible);
        pause.hidden = rows.length < 3 || reduced();
        pause.textContent = paused ? 'Resume animation' : 'Pause animation';
        pause.setAttribute('aria-pressed', String(paused));
    }
    function card(review, duplicate = false) {
        const article = el('article', 'game-review-marquee-card community-review');
        if (!duplicate) article.id = 'review-' + review.id;
        const header = el('div', 'game-review-marquee-author'),
            identity = el('div', 'game-review-marquee-identity');
        const profile = {
            id: review.user_id,
            display_name: review.display_name,
            avatar_path: review.avatar_path,
        };
        identity.append(
            ui.profileLink(profile),
            el('time', 'social-small', ui.date(review.updated_at))
        );
        identity.querySelector('time').dateTime = review.updated_at;
        const portrait = el('a', 'game-review-marquee-avatar');
        portrait.href = ui.href('view/profile.html?id=' + encodeURIComponent(review.user_id));
        portrait.setAttribute('aria-label', 'View profile of ' + review.display_name);
        portrait.append(ui.avatar(profile));
        header.append(portrait, identity);
        const destination = ui.reviewHref('id', review.id),
            body = el(
                'a',
                'game-review-marquee-body',
                review.text || 'A rating shared by this player.'
            );
        body.href = destination;
        const score = el('div', 'game-review-marquee-rating');
        if (review.rating != null)
            score.append(ui.ratingStars(Number(review.rating), review.game_id));
        else score.textContent = 'Written review';
        window.BacklogGameHearts.append(score, review);
        const actions = el('div', 'game-review-marquee-actions'),
            likes = el('button', 'game-review-marquee-like review-like'),
            comments = el('a', 'game-review-marquee-comments', '↳ ' + (review.comment_count || 0));
        likes.type = 'button';
        likes.dataset.marqueeLike = review.id;
        comments.href = destination;
        comments.setAttribute(
            'aria-label',
            'Read ' +
                (review.comment_count || 0) +
                ' comments on the review by ' +
                review.display_name
        );
        const open = el('a', 'game-review-marquee-open', 'Read review ↗');
        open.href = destination;
        const feedback = el('p', 'game-review-marquee-feedback');
        feedback.setAttribute('role', 'status');
        function sync() {
            if (!article.isConnected) return;
            root.querySelectorAll('[data-marquee-like]').forEach((button) => {
                if (button.dataset.marqueeLike !== review.id) return;
                button.textContent = (review.liked ? '♥' : '♡') + ' ' + (review.like_count || 0);
                button.setAttribute('aria-pressed', String(Boolean(review.liked)));
                button.disabled =
                    pending.has(review.id) || !account.user || account.user.id === review.user_id;
                button.title = !account.user
                    ? 'Sign in to like a review'
                    : account.user.id === review.user_id
                      ? 'This is your review'
                      : review.liked
                        ? 'Remove your like'
                        : 'Like this review';
                button.setAttribute(
                    'aria-label',
                    (review.liked ? 'Unlike' : 'Like') +
                        ' review by ' +
                        review.display_name +
                        ' · ' +
                        (review.like_count || 0) +
                        ' likes'
                );
            });
        }
        likes.addEventListener('click', async () => {
            if (pending.has(review.id)) return;
            pending.add(review.id);
            feedback.textContent = '';
            sync();
            const owner = account.user?.id;
            try {
                const liked = !review.liked,
                    count = await api.like(review.id, liked);
                if (account.user?.id !== owner) return;
                review.liked = liked;
                review.like_count = count;
            } catch (error) {
                feedback.textContent = error.message || 'Could not update your like. Try again.';
            } finally {
                pending.delete(review.id);
                sync();
            }
        });
        // Prepara o botão antes de o card ser anexado; sync mantém as cópias consistentes.
        likes.textContent = (review.liked ? '♥' : '♡') + ' ' + (review.like_count || 0);
        likes.setAttribute('aria-pressed', String(Boolean(review.liked)));
        likes.disabled = !account.user || account.user.id === review.user_id;
        likes.setAttribute(
            'aria-label',
            (review.liked ? 'Unlike' : 'Like') +
                ' review by ' +
                review.display_name +
                ' · ' +
                (review.like_count || 0) +
                ' likes'
        );
        actions.append(likes, comments, open);
        article.append(header, score, body, actions, feedback);
        if (duplicate) {
            article.setAttribute('aria-hidden', 'true');
            article.querySelectorAll('a,button').forEach((control) => (control.tabIndex = -1));
            article.addEventListener('mousedown', (event) => event.preventDefault());
        }
        return article;
    }
    function clear() {
        rows = [];
        root.classList.remove('game-review-marquee', 'is-static', 'is-paused');
        pause.hidden = true;
    }
    function render(reviews) {
        clear();
        root.replaceChildren();
        rows = [...new Map(reviews.map((review) => [review.id, review])).values()];
        if (!rows.length) return;
        root.classList.add('game-review-marquee');
        const chunks =
            rows.length >= 6
                ? [
                      rows.slice(0, Math.ceil(rows.length / 2)),
                      rows.slice(Math.ceil(rows.length / 2)),
                  ]
                : [rows];
        chunks.forEach((chunk, index) => {
            const lane = el('div', 'game-review-marquee-lane' + (index ? ' reverse' : '')),
                track = el('div', 'game-review-marquee-track');
            track.style.setProperty('--marquee-duration', Math.max(24, chunk.length * 8) + 's');
            for (let repeat = 0; repeat < (rows.length >= 3 ? 2 : 1); repeat++) {
                const group = el('div', 'game-review-marquee-group');
                if (repeat) group.setAttribute('aria-hidden', 'true');
                chunk.forEach((review) => group.append(card(review, Boolean(repeat))));
                track.append(group);
            }
            lane.append(track);
            root.append(lane);
        });
        configure();
    }
    pause.addEventListener('click', () => {
        paused = !paused;
        configure();
    });
    root.addEventListener('pointerenter', () => {
        hovered = true;
        configure();
    });
    root.addEventListener('pointerleave', () => {
        hovered = false;
        configure();
    });
    // Ao navegar por teclado, todos os cards originais ficam visíveis e acessíveis.
    root.addEventListener('focusin', (event) => {
        focused = true;
        if (event.target.matches(':focus-visible')) {
            paused = true;
        }
        configure();
    });
    root.addEventListener('focusout', () => {
        queueMicrotask(() => {
            focused = root.contains(document.activeElement);
            configure();
        });
    });
    device.addEventListener('change', configure);
    document.addEventListener('visibilitychange', configure);
    if ('IntersectionObserver' in window)
        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            configure();
        }).observe(root);
    document.addEventListener('DOMContentLoaded', () => {
        window.BacklogMotion?.addEventListener('change', configure);
        configure();
    });
    window.BacklogGameReviewMarquee = { render, clear };
})();
