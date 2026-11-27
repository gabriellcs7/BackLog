(() => {
    'use strict';
    const account = window.BacklogAccount;
    const ui = window.BacklogUI;
    const params = new URLSearchParams(location.search);
    const profileId = params.get('profile');
    const listId = params.get('id');
    const title = document.querySelector('#list-page-title');
    const meta = document.querySelector('#list-page-meta');
    const description = document.querySelector('#list-page-description');
    const grid = document.querySelector('#list-page-games');
    const feedback = document.querySelector('#list-page-feedback');
    const back = document.querySelector('#list-profile-link');
    const progressPanel = document.querySelector('#list-progress-panel');
    const share = document.querySelector('#share-list');
    window.BacklogShare.mount(share, { url: () => location.href, title: () => document.title });
    const rename = window.BacklogInlineListName.mount(title, profileId, listId);
    const actions = window.BacklogListActions.mount({ share, profileId, listId, feedback });
    let generation = 0;

    async function render() {
        rename.reset();
        actions.reset();
        const ticket = ++generation;
        share.disabled = true;
        progressPanel.hidden = true;
        progressPanel.querySelector('.list-progress')?.remove();
        grid.replaceChildren();
        title.textContent = 'Game list';
        document.title = 'Game list · BackLog';
        meta.textContent = '';
        description.hidden = true;
        description.textContent = '';
        feedback.textContent = 'Loading list…';
        try {
            if (!listId || !profileId) throw new Error('List not found.');
            const player =
                profileId === 'local' && account.user
                    ? null
                    : profileId === 'local' || profileId === account.user?.id
                      ? account.getState()
                      : await account.getProfile(profileId);
            if (ticket !== generation) return;
            const list = player?.lists.find((item) => item.id === listId);
            if (!list) throw new Error('List not found or private.');
            back.href = ui.href(
                'view/profile.html' +
                    (profileId === 'local' ? '' : '?id=' + encodeURIComponent(profileId)) +
                    '#profile-list-section'
            );
            title.textContent = list.name;
            rename.setList(list);
            actions.setList(list);
            document.title = list.name + ' · BackLog';
            meta.textContent = [
                player.profile.display_name,
                list.gameIds.length + (list.gameIds.length === 1 ? ' game' : ' games'),
                list.is_ranked ? 'Ranked' : 'Unranked',
                list.is_public ? 'Public' : 'Private',
            ].join(' · ');
            description.textContent = list.description;
            description.hidden = !list.description;
            document.getElementById('list-page-tags')?.remove();
            const tags = window.BacklogListTags.chips(list.tags);
            tags.id = 'list-page-tags';
            description.after(tags);
            for (const [index, id] of list.gameIds.entries()) {
                const game = ui.game(id);
                if (!game) continue;
                const slot = ui.element('li');
                const card = ui.gameCard(id);
                if (list.is_ranked) {
                    const rank = ui.element('span', 'list-rank-badge', String(index + 1));
                    rank.setAttribute('aria-label', 'Rank ' + (index + 1));
                    slot.append(rank);
                }
                slot.append(card);
                grid.append(slot);
            }
            progressPanel.append(
                window.BacklogListProgress.create(list.gameIds, { minimal: true })
            );
            progressPanel.hidden = false;
            share.disabled = false;
            feedback.textContent = grid.children.length ? '' : 'No games in this list yet.';
        } catch (error) {
            if (ticket === generation)
                feedback.textContent = error.message || 'Could not load this list.';
        }
    }

    account.ready.then(render);
    window.addEventListener('backlog-account-change', render);
})();
