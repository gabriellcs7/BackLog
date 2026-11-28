(() => {
    'use strict';
    const account = window.BacklogAccount;
    const check = (result) => {
        if (result.error)
            throw new Error(result.error.message || 'Could not connect. Please try again.');
        return result.data;
    };
    async function client(required = false) {
        await account.ready;
        if (!account.client) throw new Error('Community reviews are not connected yet.');
        if (required && !account.user) throw new Error('Sign in to join the conversation.');
        return account.client;
    }
    async function withGameHearts(rows) {
        const ids = rows.map(row => row.id).filter(id => typeof id === 'string');
        if (!ids.length || !account.client) return rows;
        try {
            const result = await account.client.from('reviews').select('id,game_liked').in('id', ids);
            if (result.error) return rows;
            const hearts = new Map((result.data || []).map(row => [row.id, row.game_liked === true]));
            return rows.map(row => ({...row, game_liked: hearts.get(row.id) === true}));
        } catch { return rows; }
    }
    window.BacklogCommunity = Object.freeze({
        async feed(gameId, offset = 0) {
            const api = await client();
            let result = await api.rpc('review_feed_v2', { game_key: gameId, page_offset: offset });
            if (result.error?.code === 'PGRST202')
                result = await api.rpc('review_feed', { game_key: gameId, page_offset: offset });
            return withGameHearts(check(result) || []);
        },

        async ratingDistribution(gameId) {
            const api = await client(),
                counts = Array(10).fill(0);
            let total = 0,
                sum = 0,
                offset = 0;
            const size = 1000;
            // Uma avaliação por conta/jogo; paginação evita o limite padrão do banco.
            while (true) {
                const rows =
                    check(
                        await api
                            .from('reviews')
                            .select('rating,user_id')
                            .eq('game_id', gameId)
                            .not('rating', 'is', null)
                            .order('user_id')
                            .range(offset, offset + size - 1)
                    ) || [];
                for (const row of rows) {
                    const value = Number(row.rating);
                    if (
                        row.rating == null ||
                        value < 0.5 ||
                        value > 5 ||
                        !Number.isInteger(value * 2)
                    )
                        continue;
                    counts[value * 2 - 1]++;
                    total++;
                    sum += value;
                }
                if (rows.length < size) break;
                offset += rows.length;
            }
            return { counts, total, average: total ? sum / total : null };
        },
        async catalogPopularity() {
            const api = await client(),
                known = new Set(window.BacklogGames.map((game) => game.id)),
                byGame = new Map();
            const size = 1000;
            let offset = 0;
            while (true) {
                const rows =
                    check(
                        await api
                            .from('reviews')
                            .select('game_id,user_id,rating,text')
                            .order('game_id')
                            .order('user_id')
                            .range(offset, offset + size - 1)
                    ) || [];
                for (const row of rows) {
                    if (!known.has(row.game_id) || !row.user_id) continue;
                    const score = Number(row.rating),
                        rated =
                            row.rating != null &&
                            score >= 0.5 &&
                            score <= 5 &&
                            Number.isInteger(score * 2);
                    if (!rated && !String(row.text || '').trim()) continue;
                    if (!byGame.has(row.game_id)) byGame.set(row.game_id, new Map());
                    byGame.get(row.game_id).set(row.user_id, rated ? score : null);
                }
                if (rows.length < size) break;
                offset += rows.length;
            }
            return [...byGame]
                .map(([game_id, people]) => {
                    const ratings = [...people.values()].filter((value) => value != null);
                    return {
                        game_id,
                        player_count: people.size,
                        average: ratings.length
                            ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length
                            : null,
                    };
                })
                .sort(
                    (a, b) =>
                        b.player_count - a.player_count ||
                        (b.average || 0) - (a.average || 0) ||
                        window.BacklogGames.find((g) => g.id === a.game_id).title.localeCompare(
                            window.BacklogGames.find((g) => g.id === b.game_id).title
                        )
                );
        },
        async searchPlayers(query, offset = 0) {
            return (
                check(
                    await (
                        await client()
                    ).rpc('search_players', { search_term: query, page_offset: offset })
                ) || []
            );
        },
        async activity(offset = 0, filter = 'all') {
            const api = await client(true),
                params = { page_offset: offset, feed_filter: filter };
            let result = await api.rpc('activity_feed_v2', params);
            if (result.error?.code === 'PGRST202') result = await api.rpc('activity_feed', params);
            return check(result) || [];
        },
        async metrics(id, year) {
            return (check(
                await (
                    await client()
                ).rpc('profile_metrics', { profile_key: id, calendar_year: year })
            ) || [])[0];
        },
        async wantToPlay(id) {
            if (id === 'local')
                return window.BacklogGames.filter(
                    (game) => window.Backlog.getStatus(game.id, null)?.id === 'want-to-play'
                );
            const api = await client();
            if (id === account.user?.id) await window.Backlog.statusReady;
            const rows =
                check(
                    await api
                        .from('game_statuses')
                        .select('game_id')
                        .eq('user_id', id)
                        .eq('status', 'want-to-play')
                        .order('updated_at', { ascending: false })
                        .order('game_id')
                ) || [];
            return rows
                .map((row) => window.BacklogGames.find((game) => game.id === row.game_id))
                .filter(Boolean);
        },
        async currentlyPlaying(id) {
            const games = window.BacklogGames;
            if (id === 'local')
                return games
                    .filter((game) => window.Backlog.getStatus(game.id, null)?.id === 'playing')
                    .slice(0, 3);
            const api = await client();
            if (id === account.user?.id) await window.Backlog.statusReady;
            const rows =
                check(
                    await api
                        .from('game_statuses')
                        .select('game_id')
                        .eq('user_id', id)
                        .eq('status', 'playing')
                        .in(
                            'game_id',
                            games.map((game) => game.id)
                        )
                        .order('updated_at', { ascending: false })
                        .order('game_id')
                        .limit(3)
                ) || [];
            return rows.map((row) => games.find((game) => game.id === row.game_id)).filter(Boolean);
        },
        async loggedGames(id) {
            return (
                check(await (await client()).rpc('profile_logged_games', { profile_key: id })) || []
            );
        },
        async gameRatings(id) {
            const api = await client();
            return (
                check(
                    await api
                        .from('reviews')
                        .select('game_id,rating,reviewed_on,updated_at')
                        .eq('user_id', id)
                        .not('rating', 'is', null)
                ) || []
            );
        },
        async publicDiary(id, year, offset) {
            return (
                check(
                    await (
                        await client()
                    ).rpc('profile_public_diary', {
                        profile_key: id,
                        calendar_year: year,
                        page_offset: offset,
                    })
                ) || []
            );
        },
        async recent(id) {
            const api = await client(),
                params = { profile_key: id };
            let result = await api.rpc('profile_recent_games_v3', params);
            if (result.error?.code !== 'PGRST202') return check(result) || [];

            // Backward compatibility while the new RPC is being deployed.
            result = await api.rpc('profile_recent_games_v2', params);
            if (result.error?.code === 'PGRST202')
                result = await api.rpc('profile_recent_games', params);
            const hiddenStatuses = ['want-to-play', 'playing'];
            const entries = (check(result) || []).filter(
                (entry) => !hiddenStatuses.includes(entry.status)
            );
            if (!entries.length) return entries;
            const statuses =
                check(
                    await api
                        .from('game_statuses')
                        .select('game_id')
                        .eq('user_id', id)
                        .in('status', hiddenStatuses)
                        .in(
                            'game_id',
                            entries.map((entry) => entry.game_id)
                        )
                ) || [];
            const hiddenGames = new Set(statuses.map((row) => row.game_id));
            return entries.filter((entry) => !hiddenGames.has(entry.game_id));
        },
        async home(kind, offset = 0) {
            return withGameHearts(
                check(
                    await (
                        await client(kind === 'following')
                    ).rpc('home_review_feed', { feed_kind: kind, page_offset: offset })
                ) || []
            );
        },
        async profileReviews(id, offset, limit) {
            const api = await client();
            return withGameHearts(
                check(
                    await api
                        .from('review_cards')
                        .select('id,game_id,rating,text,like_count,updated_at')
                        .eq('user_id', id)
                        .order('like_count', { ascending: false })
                        .order('updated_at', { ascending: false })
                        .order('id')
                        .range(offset, offset + limit - 1)
                ) || []
            );
        },
        async review(id) {
            const rows = await withGameHearts(check(await (await client()).rpc('get_review_card', {review_key:id})) || []);
            return rows[0];
        },
        async social(id) {
            return (check(await (await client()).rpc('profile_social', { profile_key: id })) ||
                [])[0];
        },
        async follow(id, value) {
            check(
                await (
                    await client(true)
                ).rpc('set_profile_follow', { profile_key: id, should_follow: value })
            );
        },
        async connections(id, kind, offset = 0) {
            return (
                check(
                    await (
                        await client()
                    ).rpc('profile_connections', {
                        profile_key: id,
                        connection_kind: kind,
                        page_offset: offset,
                    })
                ) || []
            );
        },
        async like(reviewId, liked) {
            return Number(
                check(
                    await (
                        await client(true)
                    ).rpc('set_review_like', { review_key: reviewId, liked })
                )
            );
        },
        async comments(reviewId, offset = 0) {
            return (
                check(
                    await (
                        await client()
                    )
                        .from('review_comments')
                        .select('id,user_id,text,created_at,profiles(id,display_name,avatar_path)')
                        .eq('review_id', reviewId)
                        .order('created_at')
                        .order('id')
                        .range(offset, offset + 19)
                ) || []
            );
        },
        async comment(reviewId, text) {
            text = text.trim();
            if (!text || text.length > 1000)
                throw new Error('Write a comment between 1 and 1,000 characters.');
            const api = await client(true);
            return check(
                await api
                    .from('review_comments')
                    .insert({ review_id: reviewId, user_id: account.user.id, text })
                    .select('id,user_id,text,created_at,profiles(id,display_name,avatar_path)')
                    .single()
            );
        },
        async removeComment(id) {
            const api = await client(true);
            check(
                await api
                    .from('review_comments')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', account.user.id)
            );
        },
    });
})();
