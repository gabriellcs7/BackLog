/* Avaliações pessoais e diário, com notas de meia a cinco estrelas. */
(() => {
    'use strict';
    const limit = 3000,
        diary = window.BacklogDiary;
    const validGame = (id) => window.BacklogGames.some((game) => game.id === id);
    const validRating = (rating) =>
        rating === null ||
        (Number.isFinite(rating) && Number.isInteger(rating * 2) && rating >= 0.5 && rating <= 5);
    function getDevice(id) {
        return diary.getDeviceReview(id);
    }
    function get(id) {
        return window.BacklogAccount?.user ? window.BacklogAccount.getReview(id) : getDevice(id);
    }
    async function completedSave(id, value, owner) {
        let statusWarning = false;
        try {
            await window.Backlog?.statusReady;
            if ((window.BacklogAccount?.user?.id || null) !== owner)
                throw new Error('Your account changed. Please reload.');
            if (window.Backlog && !window.Backlog.getStatus(id))
                await window.Backlog.setStatus(id, 'played');
        } catch {
            statusWarning = true;
        }
        window.dispatchEvent(new CustomEvent('backlog-review-change', { detail: { id } }));
        return { ...value, statusWarning };
    }
    function save(id, rating, text, date = diary.today(), spoiler) {
        if (
            !validGame(id) ||
            !validRating(rating) ||
            typeof text !== 'string' ||
            text.length > limit
        )
            throw new Error('Invalid review.');
        if (!diary.validDate(date)) throw new Error('Choose today or an earlier date.');
        const cleaned =
            spoiler === undefined
                ? text.trim()
                : window.BacklogReviewText.withSpoiler(text, spoiler);
        if (cleaned.length > limit)
            throw new Error('Your review and spoiler warning must fit within 3,000 characters.');
        if (rating === null && !(window.BacklogReviewText?.unwrap(cleaned) ?? cleaned).trim())
            throw new Error('Choose a rating or write a review.');
        const owner = window.BacklogAccount?.user?.id || null;
        if (owner)
            return window.BacklogAccount.saveReview(id, rating, cleaned, date).then((value) =>
                completedSave(id, value, owner)
            );
        return completedSave(id, diary.saveDevice(id, rating, cleaned, date), owner);
    }
    function remove(id) {
        if (!validGame(id)) throw new Error('Invalid game.');
        if (window.BacklogAccount?.user) return window.BacklogAccount.removeReview(id);
        localStorage.removeItem('backlog:review:' + id);
        window.dispatchEvent(new CustomEvent('backlog-review-change', { detail: { id } }));
        window.dispatchEvent(new Event('backlog-diary-change'));
    }
    window.BacklogReviews = Object.freeze({ get, getDevice, save, remove, limit });
})();
