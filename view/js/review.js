/* Editor e visualização da avaliação pessoal do jogo. */
(() => {
    'use strict';
    const id = new URLSearchParams(location.search).get('id');
    const game = window.BacklogGames.find(game => game.id === id) || window.BacklogGames[0];
    const reviews = window.BacklogReviews;
    const form = document.querySelector('#review-form');
    const text = document.querySelector('#review-text');
    const diaryDate = document.querySelector('#review-played-date');
    diaryDate.max = window.BacklogDiary.today();
    const radios = [...form.querySelectorAll('[name="review-rating"]')];
    const savedPanel = document.querySelector('#review-saved');
    const confirmation = document.querySelector('#review-delete-confirm');
    const feedback = document.querySelector('#review-feedback');
    const cancel = document.querySelector('#cancel-review');
    let dirty = false;
    let owner = window.BacklogAccount?.user?.id || 'local';
    const rating = () => {
        const checked = radios.find(radio => radio.checked);
        return checked ? Number(checked.value) : null;
    };
    function updateInputs(preview) {
        const value = typeof preview === 'number' ? preview : rating();
        document.querySelector('#review-rating-value').textContent = value === null ? 'Not rated' : `${value} / 5`;
        document.querySelector('#clear-rating').hidden = value === null;
        document.querySelector('#review-counter').textContent = `${text.value.length.toLocaleString('en-US')} / 3,000`;
        radios[0].parentElement.classList.toggle('is-filled', value === 0);
        form.querySelectorAll('.rating-star-choice').forEach(star => {
            const fill = value === null ? 0 : Math.max(0, Math.min(1, value - Number(star.dataset.star) + 1));
            star.style.setProperty('--star-fill', (fill * 100) + '%');
        });
    }
    // Native radios keep keyboard/touch selection; hovering only previews a score.
    form.querySelectorAll('.rating-half').forEach(half => {
        half.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'touch') updateInputs(Number(half.querySelector('input').value));
        });
    });
    form.querySelector('.rating-choices').addEventListener('pointerleave', () => updateInputs());
    function updateSummary() {
        const review = reviews.get(game.id);
        const preview = document.querySelector('.rating-preview');
        preview.querySelector('strong').textContent = review?.rating != null ? `${review.rating} / 5` : 'Not rated yet';
        preview.querySelector('div > span').textContent = review?.rating != null ? 'Your rating' : 'Add your rating below';
        preview.querySelector('.rating-star').textContent = review?.rating > 0 ? '★' : '☆';
    }
    function render() {
        const review = reviews.get(game.id);
        dirty = false;
        savedPanel.hidden = !review;
        form.hidden = Boolean(review);
        confirmation.hidden = true;
        cancel.hidden = !review;
        text.value = review?.text || '';
        diaryDate.value = review?.reviewedOn || window.BacklogDiary.today();
        radios.forEach(radio => { radio.checked = review?.rating != null && Number(radio.value) === review.rating; });
        if (review) {
            const savedRating = document.querySelector('#review-saved-rating');
            savedRating.replaceChildren();
            if (review.rating === null) {
                savedRating.textContent = 'Written review';
                savedRating.removeAttribute('aria-label');
            } else {
                savedRating.setAttribute('aria-label', review.rating + ' out of 5 stars');
                const stars = document.createElement('span');
                stars.className = 'review-stars';
                stars.setAttribute('aria-hidden', 'true');
                for (let index = 0; index < 5; index++) {
                    const star = document.createElement('span');
                    star.className = 'rating-star-shape';
                    star.textContent = '★';
                    star.style.setProperty('--star-fill', (Math.max(0, Math.min(1, review.rating - index)) * 100) + '%');
                    stars.append(star);
                }
                const score = document.createElement('span');
                score.textContent = review.rating + ' / 5';
                savedRating.append(stars, score);
            }
            const savedText = document.querySelector('#review-saved-text');
            savedText.textContent = review.text;
            savedText.hidden = !review.text;
            const date = document.querySelector('#review-date');
            date.dateTime = review.reviewedOn || review.updatedAt;
            date.textContent = 'Logged ' + new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date((review.reviewedOn || window.BacklogDiary.dateFromTimestamp(review.updatedAt)) + 'T12:00:00'));
        }
        updateInputs();
        updateSummary();
        const account = window.BacklogAccount;
        form.inert = Boolean(account?.loading);
        document.querySelector('.review-private').textContent = account?.user ? 'PUBLIC REVIEW' : 'ONLY YOU';
        document.querySelector('#review-note').textContent = account?.user ? 'Saving publishes this review on your profile and this game.' : 'Saved only in this browser.';
        document.querySelector('#use-device-review').hidden = !account?.user || Boolean(review) || !reviews.getDevice(game.id);
        document.querySelector('#review-delete-confirm > p').textContent = account?.user ? 'Delete your public review, diary entries, likes and comments?' : 'Delete your rating, review and diary entries for this game?';
    }
    form.addEventListener('input', () => {
        dirty = true;
        feedback.textContent = 'Unsaved changes.';
        updateInputs();
    });
    document.querySelector('#clear-rating').addEventListener('click', () => {
        radios.forEach(radio => { radio.checked = false; });
        dirty = true;
        feedback.textContent = 'Unsaved changes.';
        updateInputs();
        radios[0].focus();
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (rating() === null && !text.value.trim()) {
            feedback.textContent = 'Choose a rating or write a review before saving.';
            radios[0].focus();
            return;
        }
        try {
            form.inert = true;
            const saved = await reviews.save(game.id, rating(), text.value, diaryDate.value);
            render();
            feedback.textContent = saved.statusWarning ? 'Review saved to your diary. Could not update your collection in this browser.' : window.BacklogAccount?.user ? 'Your public review has been saved to your diary.' : 'Your review has been saved to your diary.';
            document.querySelector('#edit-review').focus();
        } catch {
            feedback.textContent = 'Could not save your review. Check your connection or browser storage and try again.';
        } finally { form.inert = false; }
    });
    document.querySelector('#edit-review').addEventListener('click', () => {
        render();
        form.hidden = false;
        savedPanel.hidden = true;
        feedback.textContent = '';
        text.focus();
    });
    cancel.addEventListener('click', () => {
        render();
        feedback.textContent = 'Changes discarded.';
        document.querySelector('#edit-review').focus();
    });
    document.querySelector('#delete-review').addEventListener('click', () => {
        confirmation.hidden = false;
        document.querySelector('#keep-review').focus();
    });
    document.querySelector('#keep-review').addEventListener('click', () => {
        confirmation.hidden = true;
        document.querySelector('#delete-review').focus();
    });
    document.querySelector('#confirm-delete-review').addEventListener('click', async event => {
        try {
            event.currentTarget.disabled = true;
            await reviews.remove(game.id);
            render();
            feedback.textContent = 'Your rating and review have been deleted.';
            radios[0].focus();
        } catch { feedback.textContent = 'Could not delete your review. Please try again.'; }
        finally { document.querySelector('#confirm-delete-review').disabled = false; }
    });
    document.querySelector('#use-device-review').addEventListener('click', () => {
        const draft = reviews.getDevice(game.id);
        if (!draft) return;
        text.value = draft.text;
        diaryDate.value = draft.reviewedOn || window.BacklogDiary.today();
        radios.forEach(radio => { radio.checked = draft.rating !== null && Number(radio.value) === draft.rating; });
        dirty = true;
        updateInputs();
        feedback.textContent = 'Device review loaded as a draft. Save review to publish it.';
        text.focus();
    });
    window.addEventListener('backlog-account-change', () => {
        const nextOwner = window.BacklogAccount?.user?.id || 'local';
        if (owner !== nextOwner) { dirty = false; owner = nextOwner; feedback.textContent = ''; }
        if (!dirty) render(); else updateSummary();
    });
    window.BacklogAccount?.ready.then(() => { if (!dirty) render(); });
    window.addEventListener('backlog-diary-change', () => { if (!dirty) render(); });
    window.addEventListener('storage', event => {
        if (event.key === null || event.key === `backlog:review:${game.id}`) {
            updateSummary();
            if (!dirty) render();
        }
    });
    window.addEventListener('pageshow', () => { if (!dirty) render(); });
    render();
})();
