(() => {
    'use strict';
    const account = window.BacklogAccount,
        api = window.BacklogCommunity,
        ui = window.BacklogUI,
        $ = (id) => document.getElementById(id);
    let version = 0,
        current = null;
    async function localData(player) {
        const year = new Date().getFullYear(),
            logged = new Set(),
            annual = new Set(),
            recent = [];
        const reviewCounts = new Map();
        for (const entry of await window.BacklogDiary.entries()) {
            if (Number(entry.reviewedOn.slice(0, 4)) === year) annual.add(entry.gameId);
            if (entry.text.trim())
                reviewCounts.set(entry.gameId, (reviewCounts.get(entry.gameId) || 0) + 1);
        }
        for (const item of window.BacklogGames) {
            const review = window.BacklogReviews.getDevice(item.id),
                status = window.Backlog.getStatus(item.id),
                date = localStorage.getItem('backlog:status-date:local:' + item.id);
            if (status?.id === 'want-to-play') {
                if (review) logged.add(item.id);
                continue;
            }
            if (review) logged.add(item.id);
            if (status && status.id !== 'want-to-play') logged.add(item.id);
            if (
                status &&
                status.id !== 'want-to-play' &&
                date &&
                new Date(date).getFullYear() === year
            )
                annual.add(item.id);
            if (status?.id === 'playing') continue;
            let latest = review
                ? {
                      game_id: item.id,
                      kind: 'rating',
                      rating: review.rating,
                      review_number: review.text.trim() ? reviewCounts.get(item.id) : null,
                      created_at: review.updatedAt,
                  }
                : null;
            if (status && date && (!latest || date > latest.created_at))
                latest = {
                    game_id: item.id,
                    kind: 'status',
                    status: status.id,
                    rating: review?.rating,
                    created_at: date,
                };
            if (latest) recent.push(latest);
        }
        return {
            metrics: {
                played_this_year: annual.size,
                list_count: player.lists.length,
                logged_games: logged.size,
            },
            recent: recent.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4),
        };
    }
    async function render(player, own) {
        current = { player, own };
        const ticket = ++version,
            year = new Date().getFullYear();
        $('metrics-feedback').textContent = '';
        $('recent-feedback').textContent = '';
        try {
            let data;
            if (player.profile.id === 'local') data = await localData(player);
            else {
                if (own) await window.Backlog.statusReady;
                const id = player.profile.id;
                const [metrics, recent, scores] = await Promise.all([
                    api.metrics(id, year),
                    api.recent(id),
                    api.gameRatings(id).catch(() => []),
                ]);
                const ratings = new Map(scores.map((row) => [row.game_id, row.rating]));
                data = {
                    metrics,
                    recent: recent.map((entry) =>
                        entry.kind === 'status'
                            ? { ...entry, rating: ratings.get(entry.game_id) }
                            : entry
                    ),
                };
            }
            if (ticket !== version) return;
            $('profile-metrics').replaceChildren();
            const diaryUrl = new URL(ui.href('view/diary.html'));
            diaryUrl.searchParams.set('year', year);
            if (player.profile.id !== 'local') diaryUrl.searchParams.set('id', player.profile.id);
            const diaryLink = ui.element('a', 'profile-stat'),
                listLink = ui.element('a', 'profile-stat'),
                loggedLink = ui.element('a', 'profile-stat');
            diaryLink.href = diaryUrl.href;
            listLink.href = '#profile-list-section';
            const loggedUrl = new URL(ui.href('view/logged-games.html'));
            loggedUrl.searchParams.set('id', player.profile.id);
            loggedLink.href = loggedUrl.href;
            const stats = [
                [diaryLink, data.metrics.played_this_year, 'Played in ' + year],
                [listLink, data.metrics.list_count, own ? 'Lists' : 'Public lists'],
                [loggedLink, data.metrics.logged_games, 'Games logged'],
            ];
            $('profile-stats-year').textContent = year;
            const icons = [
                    '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 5 2 2 4-4"/>',
                    '<rect x="4" y="4" width="5" height="5" rx="1"/><path d="M13 6h7M13 8h5"/><rect x="4" y="14" width="5" height="5" rx="1"/><path d="M13 16h7M13 18h5"/>',
                    '<path d="M8 7h8c3 0 5 9 4 11-1 2-4-1-5-3H9c-1 2-4 5-5 3C3 16 5 7 8 7Z"/><path d="M8 10v4m-2-2h4m5-1h.01m2 2h.01"/>',
                ],
                captions = ['YOUR YEAR', 'YOUR CURATION', 'YOUR JOURNEY'];
            for (const [index, [control, value, label]] of stats.entries()) {
                const top = ui.element('span', 'profile-stat-top'),
                    icon = ui.element('span', 'profile-stat-icon'),
                    arrow = ui.element('span', 'profile-stat-arrow', '↗');
                top.setAttribute('aria-hidden', 'true');
                // Formas SVG locais e fixas; nenhum conteúdo de usuário é inserido como HTML.
                icon.innerHTML =
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                    icons[index] +
                    '</svg>';
                top.append(icon, arrow);
                const caption = ui.element('span', 'profile-stat-kicker', captions[index]);
                caption.setAttribute('aria-hidden', 'true');
                control.append(
                    top,
                    ui.element('strong', '', value),
                    ui.element('span', 'profile-stat-caption', label),
                    caption
                );
                $('profile-metrics').append(control);
            }
            const grid = $('profile-recent-games');
            grid.replaceChildren();
            for (const entry of data.recent.slice(0, 4)) {
                const item = ui.game(entry.game_id);
                if (!item) continue;
                const card = ui.gameCard(item.id);
                card.classList.add('favorite-slot', 'recent-game-card');
                if (entry.review_id) card.href = ui.reviewHref('id', entry.review_id);
                else if (entry.kind === 'rating' && player.profile.id === 'local')
                    card.href = ui.reviewHref('game', item.id);
                const label =
                    entry.kind === 'rating'
                        ? 'Reviewed'
                        : window.Backlog.statusOptions.find((s) => s.id === entry.status)?.label ||
                          'Updated collection';
                const meta = ui.element('div', 'recent-game-meta');
                if (entry.kind === 'status' || entry.rating == null)
                    meta.append(ui.element('span', 'recent-game-label', label));
                if (entry.rating != null) meta.append(ui.ratingStars(entry.rating, entry.game_id));
                const date = ui.element('time', 'social-small', ui.date(entry.created_at));
                date.dateTime = entry.created_at;
                meta.append(date);
                card.append(meta);
                if (entry.review_number > 1)
                    card.append(
                        ui.element('p', 'recent-game-label', ui.reviewOrdinal(entry.review_number))
                    );
                grid.append(card);
            }
            if (!grid.children.length)
                grid.append(
                    ui.element(
                        'p',
                        'social-empty',
                        'No recent activity yet. Rate a game or set a status to get started.'
                    )
                );
        } catch (error) {
            if (ticket === version) {
                $('profile-metrics').replaceChildren();
                $('profile-recent-games').replaceChildren();
                $('metrics-feedback').textContent = 'Could not load statistics. ' + error.message;
                $('recent-feedback').textContent =
                    'Recent activity is unavailable. Please try again.';
            }
        }
    }
    window.addEventListener('backlog-change', () => {
        if (current) render(current.own ? account.getState() : current.player, current.own);
    });
    window.addEventListener('backlog-review-change', () => {
        if (current) render(current.own ? account.getState() : current.player, current.own);
    });
    window.BacklogProfileActivity = { render };
})();
