/* Conquistas do BackLog calculadas com os dados atuais visíveis do perfil. */
(() => {
    'use strict';
    const account = window.BacklogAccount,
        api = window.BacklogCommunity,
        ui = window.BacklogUI,
        anchor = document.querySelector('.profile-content');
    if (!anchor) return;
    const host = ui.element('div', 'profile-milestones-host');
    host.hidden = true;
    anchor.after(host);
    let current = null,
        counts = null,
        version = 0,
        timer = null;
    const known = (id) => Boolean(ui.game(id)),
        rated = (r) => r.rating != null && Number(r.rating) >= 0.5 && Number(r.rating) <= 5;
    async function load(player, own) {
        if (player.profile.id === 'local' || own) {
            if (own) await window.Backlog.statusReady;
            const logged = new Set(),
                written = new Set();
            let ratings = 0,
                completed = 0;
            for (const game of window.BacklogGames) {
                const review =
                        player.profile.id === 'local'
                            ? window.BacklogReviews.getDevice(game.id)
                            : account.getReview(game.id),
                    status = window.Backlog.getStatus(game.id)?.id;
                if (review) {
                    logged.add(game.id);
                    if (rated(review)) ratings++;
                    if (review.text?.trim()) written.add(game.id);
                }
                if (status && status !== 'want-to-play') logged.add(game.id);
                if (['completed', 'platinum'].includes(status)) completed++;
            }
            return {
                ratings,
                written: written.size,
                completed,
                logged: logged.size,
                lists: player.lists.filter((list) => list.is_public === true).length,
            };
        }
        const id = player.profile.id,
            rows = [],
            readRows = (async () => {
                for (let offset = 0; ; offset += 100) {
                    const batch = await api.publicDiary(id, null, offset);
                    rows.push(...batch);
                    if (batch.length < 100) break;
                }
            })();
        const [, logged] = await Promise.all([readRows, api.loggedGames(id)]),
            byGame = new Map();
        for (const row of rows)
            if (known(row.game_id) && !byGame.has(row.game_id)) byGame.set(row.game_id, row);
        const unique = [...byGame.values()];
        return {
            ratings: unique.filter(rated).length,
            written: unique.filter((row) => Number(row.review_number) > 0).length,
            completed: unique.filter((row) => ['completed', 'platinum'].includes(row.status))
                .length,
            logged: new Set(logged.filter((row) => known(row.game_id)).map((row) => row.game_id))
                .size,
            lists: player.lists.filter((list) => list.is_public === true).length,
        };
    }
    async function render(player, own) {
        current = { player, own };
        const ticket = ++version;
        host.hidden = false;
        counts = null;
        host.replaceChildren(ui.loadingCards('Loading…', 1));
        try {
            const next = await load(player, own);
            if (ticket !== version) return;
            counts = next;
            window.BacklogAchievements.render(host, counts);
        } catch {
            if (ticket !== version) return;
            window.BacklogAchievements.error(host);
            const retry = ui.element('button', 'social-button social-button-quiet', 'Try again');
            retry.type = 'button';
            retry.addEventListener('click', () => render(current.player, current.own));
            host.querySelector('section').append(retry);
        }
    }
    window.addEventListener('backlog-language-change', () => {
        if (counts) window.BacklogAchievements.render(host, counts);
    });
    window.addEventListener('backlog-change', () => {
        if (current?.own) {
            clearTimeout(timer);
            timer = setTimeout(() => render(account.getState(), true), 40);
        }
    });
    window.addEventListener('backlog-account-change', () => {
        ++version;
        clearTimeout(timer);
        current = null;
        counts = null;
        host.hidden = true;
        host.replaceChildren();
    });
    window.BacklogProfileMilestones = { render };
})();
