/* Shared games come from the same public logged-games endpoint as profile history. */
(() => {
    'use strict';
    const account = window.BacklogAccount,
        api = window.BacklogCommunity,
        ui = window.BacklogUI;
    const t = (text) => window.BacklogI18n?.t(text) || text;
    const validScore = (value) =>
        value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0.5 &&
        Number(value) <= 5
            ? Number(value)
            : null;
    async function load(profileId) {
        const owner = account.user?.id;
        await account.ready;
        if (!owner || account.user?.id !== owner) throw Error('Sign in to compare your games.');
        if (profileId === owner) throw Error('Choose another player to compare games.');
        await window.Backlog.statusReady;
        if (account.user?.id !== owner) throw Error('Your account changed. Please try again.');
        const [mine, theirs, myScores, theirScores] = await Promise.all([
            api.loggedGames(owner),
            api.loggedGames(profileId),
            api.gameRatings(owner).catch(() => null),
            api.gameRatings(profileId).catch(() => null),
        ]);
        if (account.user?.id !== owner) throw Error('Your account changed. Please try again.');
        const ids = new Set(theirs.map((row) => row.game_id)),
            ownIds = new Set(mine.map((row) => row.game_id));
        const scores = (rows) =>
            new Map((rows || []).map((row) => [row.game_id, validScore(row.rating)]));
        const a = scores(myScores),
            b = scores(theirScores);
        return {
            items: window.BacklogGames.filter((g) => ownIds.has(g.id) && ids.has(g.id))
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((game) => ({
                    game,
                    mine: a.get(game.id) ?? null,
                    theirs: b.get(game.id) ?? null,
                })),
            myScoresAvailable: myScores !== null,
            theirScoresAvailable: theirScores !== null,
        };
    }
    function card(entry, profile, data) {
        const card = ui.gameCard(entry.game.id);
        card.classList.add('common-game-card');
        const scores = ui.element('div', 'common-game-scores');
        scores.dataset.noTranslate = '';
        for (const [name, score, available] of [
            [t('You'), entry.mine, data.myScoresAvailable],
            [profile.display_name, entry.theirs, data.theirScoresAvailable],
        ]) {
            const line = ui.element('div', 'common-game-score'),
                label = ui.element('span', 'common-game-person', name);
            label.title = name;
            line.append(label);
            if (available && score !== null) line.append(ui.ratingStars(score, entry.game.id));
            else
                line.append(
                    ui.element(
                        'span',
                        'common-game-unrated',
                        t(available ? 'Not rated' : 'Unavailable')
                    )
                );
            scores.append(line);
        }
        card.append(scores);
        return card;
    }
    window.BacklogCommonGames = { load, card };
})();
