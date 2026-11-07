/* Editor e visualização da avaliação pessoal do jogo. */
(() => {
    'use strict';
    const id = new URLSearchParams(location.search).get('id');
    const game = window.BacklogGames.find(game => game.id === id) || window.BacklogGames[0];
    const reviews = window.BacklogReviews;
    const form = document.querySelector('#review-form');
    const text = document.querySelector('#review-text');
    const radios = [...form.querySelectorAll('[name="review-rating"]')];
    const savedPanel = document.querySelector('#review-saved');
    const confirmation = document.querySelector('#review-delete-confirm');
    const feedback = document.querySelector('#review-feedback');
    const cancel = document.querySelector('#cancel-review');
    let dirty = false;
    const rating = () => {
        const checked = radios.find(radio => radio.checked);
        return checked ? Number(checked.value) : null;
    };
    function updateInputs() {
        const value = rating();
        document.querySelector('#review-rating-value').textContent = value === null ? 'Not rated' : `${value} / 5`;
        document.querySelector('#clear-rating').hidden = value === null;
        document.querySelector('#review-counter').textContent = `${text.value.length.toLocaleString('en-US')} / 3,000`;
        radios.forEach(radio => radio.parentElement.classList.toggle('is-filled', value !== null && (Number(radio.value) > 0 ? Number(radio.value) <= value : value === 0)));
    }
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
        radios.forEach(radio => { radio.checked = review?.rating != null && Number(radio.value) === review.rating; });
        if (review) {
            document.querySelector('#review-saved-rating').textContent = review.rating === null ? 'Written review' : `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}  ${review.rating} / 5`;
            const savedText = document.querySelector('#review-saved-text');
            savedText.textContent = review.text;
            savedText.hidden = !review.text;
            const date = document.querySelector('#review-date');
            date.dateTime = review.updatedAt;
            date.textContent = 'Updated ' + new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(review.updatedAt));
        }
        updateInputs();
        updateSummary();
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
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (rating() === null && !text.value.trim()) {
            feedback.textContent = 'Choose a rating or write a review before saving.';
            radios[0].focus();
            return;
        }
        try {
            reviews.save(game.id, rating(), text.value);
            render();
            feedback.textContent = 'Your review has been saved.';
            document.querySelector('#edit-review').focus();
        } catch {
            feedback.textContent = 'Could not save your review. Allow storage in this browser and try again.';
        }
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
    document.querySelector('#confirm-delete-review').addEventListener('click', () => {
        try {
            reviews.remove(game.id);
            render();
            feedback.textContent = 'Your rating and review have been deleted.';
            radios[0].focus();
        } catch { feedback.textContent = 'Could not delete your review. Please try again.'; }
    });
    window.addEventListener('storage', event => {
        if (event.key === null || event.key === `backlog:review:${game.id}`) {
            updateSummary();
            if (!dirty) render();
        }
    });
    window.addEventListener('pageshow', () => { if (!dirty) render(); });
    render();
})();
