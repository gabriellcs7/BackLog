/* Avaliação pessoal por jogo; independente dos status da coleção. */
(() => {
    'use strict';
    const limit = 3000;
    const validGame = id => window.BacklogGames.some(game => game.id === id);
    const validRating = rating => rating === null || (Number.isFinite(rating) && Number.isInteger(rating * 2) && rating >= 0 && rating <= 5);
    function get(id) {
        if (!validGame(id)) return null;
        try {
            const value = JSON.parse(localStorage.getItem('backlog:review:' + id));
            if (!value || !validRating(value.rating) || typeof value.text !== 'string' || value.text.length > limit ||
                (value.rating === null && !value.text.trim()) || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) return null;
            return { rating: value.rating, text: value.text, updatedAt: value.updatedAt };
        } catch { return null; }
    }
    function save(id, rating, text) {
        if (!validGame(id) || !validRating(rating) || typeof text !== 'string' || text.length > limit) throw new Error('Invalid review.');
        const cleaned = text.trim();
        if (rating === null && !cleaned) throw new Error('Choose a rating or write a review.');
        const value = { rating, text: cleaned, updatedAt: new Date().toISOString() };
        localStorage.setItem('backlog:review:' + id, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('backlog-review-change', { detail: { id } }));
        return value;
    }
    function remove(id) {
        if (!validGame(id)) throw new Error('Invalid game.');
        localStorage.removeItem('backlog:review:' + id);
        window.dispatchEvent(new CustomEvent('backlog-review-change', { detail: { id } }));
    }
    window.BacklogReviews = Object.freeze({ get, save, remove, limit });
})();
