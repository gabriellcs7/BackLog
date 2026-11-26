/* Catálogo: pesquisa por título, filtros, ordenação e coleção local. */
(() => {
    'use strict';

    const games = window.BacklogGames;
    const params = new URLSearchParams(window.location.search);
    const searchInput = document.querySelector('#site-search');
    const genreSelect = document.querySelector('#genre-filter');
    const statusSelect = document.querySelector('#status-filter');
    const sortSelect = document.querySelector('#sort-games');
    const results = document.querySelector('#game-results');
    const emptyState = document.querySelector('#empty-state');
    const tabs = document.querySelectorAll('[data-collection]');
    const pageSize = 42;
    const pagination = document.querySelector('#catalog-pages');
    let page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
    let collection = params.get('saved') === '1' ? 'saved' : 'all';

    searchInput.value = (params.get('q') || '').slice(0, 120);
    function selectedValues(select) {
        return [...select.selectedOptions]
            .map((option) => option.value)
            .filter((value) => value !== 'all');
    }
    function readSelection(select, key, address) {
        const values = new Set(address.getAll(key).flatMap((value) => value.split(',')));
        for (const option of select.options)
            option.selected = option.value !== 'all' && values.has(option.value);
    }
    readSelection(genreSelect, 'genre', params);
    readSelection(statusSelect, 'status', params);
    if (['az', 'za'].includes(params.get('sort'))) sortSelect.value = params.get('sort');

    function normalize(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    // Cria elementos com textContent para tratar a pesquisa como texto.
    function createCard(game) {
        const link = document.createElement('a');
        link.className = 'library-card';
        link.href = `game.html?id=${encodeURIComponent(game.id)}`;

        const art = document.createElement('div');
        art.className = 'library-art';
        const image = document.createElement('img');
        image.src = `../imagens/capas/${game.cover}`;
        image.alt = '';
        image.loading = 'lazy';
        art.append(image);

        const arrow = document.createElement('span');
        arrow.className = 'card-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';
        art.append(arrow);

        const status = window.Backlog.getStatus(game.id);
        if (status) {
            const badge = document.createElement('span');
            badge.className = 'saved-badge';
            badge.dataset.status = status.id;
            badge.lang = 'en';
            badge.textContent = status.label;
            art.append(badge);
        }

        const title = document.createElement('h3');
        title.textContent = game.title;
        const tags = document.createElement('p');
        tags.textContent = game.tags.join(' · ');
        link.append(art, title, tags, window.BacklogPrices.create(game.id));
        return link;
    }

    function catalogAddress(pageNumber) {
        const url = new URL(window.location.href);
        url.search = '';
        const query = searchInput.value.trim();
        if (query) url.searchParams.set('q', query);
        if (collection === 'saved') url.searchParams.set('saved', '1');
        for (const value of selectedValues(genreSelect)) url.searchParams.append('genre', value);
        if (sortSelect.value !== 'featured') url.searchParams.set('sort', sortSelect.value);
        for (const value of selectedValues(statusSelect)) url.searchParams.append('status', value);
        if (collection === 'all' && pageNumber > 1)
            url.searchParams.set('page', String(pageNumber));
        return url;
    }

    function updateAddress() {
        const url = catalogAddress(page);
        try {
            history.replaceState(null, '', url.href);
        } catch {
            // Alguns navegadores restringem alterações de endereço em arquivos locais.
        }
    }

    const collectionGroups = [
        {
            id: 'played',
            title: 'Played',
            description: 'Games you have played, finished, or dropped.',
            statuses: ['played', 'completed', 'platinum', 'dropped'],
        },
        {
            id: 'playing',
            title: 'Playing',
            description: 'Games you are currently playing.',
            statuses: ['playing'],
        },
        {
            id: 'want-to-play',
            title: 'Want to play',
            description: 'Games saved to your wishlist.',
            statuses: ['want-to-play'],
        },
    ];
    function renderGroups(matches) {
        results.replaceChildren();
        const hint = document.createElement('p');
        hint.className = 'swipe-backlog-hint';
        hint.textContent =
            window.BacklogPreferences?.get().language === 'pt-BR'
                ? 'Deslize para os lados para revelar atalhos de status. Toque no status para salvar.'
                : 'Swipe either way for status shortcuts. Tap a status to save.';
        results.append(hint);
        for (const group of collectionGroups) {
            const section = document.createElement('section');
            section.id = 'collection-' + group.id;
            section.className = 'collection-group';
            const heading = document.createElement('h3');
            heading.id = section.id + '-title';
            section.setAttribute('aria-labelledby', heading.id);
            const items = matches.filter((game) =>
                group.statuses.includes(window.Backlog.getStatus(game.id)?.id)
            );
            heading.textContent = group.title + ' · ' + items.length;
            const description = document.createElement('p');
            description.className = 'collection-group-description';
            description.textContent = group.description;
            const grid = document.createElement('div');
            grid.className = 'catalog-grid';
            grid.append(
                ...items.map((game) => window.BacklogSwipeBacklog.create(createCard(game), game))
            );
            section.append(heading, description, grid);
            if (!items.length) {
                const empty = document.createElement('p');
                empty.className = 'collection-group-empty';
                empty.textContent = 'No games in this section match your filters.';
                section.append(empty);
            }
            results.append(section);
        }
    }
    function renderPagination(totalPages) {
        pagination.hidden = totalPages < 2;
        pagination.replaceChildren();
        if (pagination.hidden) return;
        for (let number = 1; number <= totalPages; number++) {
            const link = document.createElement('a');
            const address = catalogAddress(number);
            address.hash = 'results-heading';
            link.href = address.href;
            link.textContent = String(number);
            link.setAttribute('aria-label', 'Page ' + number);
            if (number === page) link.setAttribute('aria-current', 'page');
            pagination.append(link);
        }
    }

    function render() {
        const query = normalize(searchInput.value.trim());
        const genres = selectedValues(genreSelect),
            statuses = selectedValues(statusSelect);
        let matches = games.filter((game) => {
            const searchableText = [game.title, game.franchise || '', ...(game.aliases || [])].join(
                ' '
            );
            const matchesQuery = normalize(searchableText).includes(query);
            const matchesGenre = !genres.length || genres.includes(game.genre);
            const matchesCollection = collection === 'all' || window.Backlog.isSaved(game.id);
            const matchesStatus =
                !statuses.length || statuses.includes(window.Backlog.getStatus(game.id)?.id);
            return matchesQuery && matchesGenre && matchesCollection && matchesStatus;
        });

        if (sortSelect.value !== 'featured') {
            const direction = sortSelect.value === 'az' ? 1 : -1;
            matches = [...matches].sort((a, b) => direction * a.title.localeCompare(b.title, 'en'));
        }

        results.classList.toggle('is-grouped', collection === 'saved');
        document.querySelector('#collection-sections').hidden = collection !== 'saved';
        const totalPages = collection === 'all' ? Math.ceil(matches.length / pageSize) : 0;
        page = Math.min(page, Math.max(1, totalPages));
        const start = (page - 1) * pageSize;
        if (collection === 'saved' && matches.length) renderGroups(matches);
        else results.replaceChildren(...matches.slice(start, start + pageSize).map(createCard));
        renderPagination(totalPages);
        for (const [id, statuses] of [
            ['played-count', collectionGroups[0].statuses],
            ['playing-count', ['playing']],
            ['wishlist-count', ['want-to-play']],
        ]) {
            document.getElementById(id).textContent = String(
                games.filter((game) => statuses.includes(window.Backlog.getStatus(game.id)?.id))
                    .length
            );
        }
        emptyState.hidden = matches.length > 0;
        document.querySelector('#all-count').textContent = String(games.length);
        document.querySelector('#saved-count').textContent = String(window.Backlog.updateCount());
        document.querySelector('#result-count').textContent =
            `${matches.length} ${matches.length === 1 ? 'game' : 'games'}${query ? ` matching "${searchInput.value.trim()}"` : ' in catalog'}`;
        if (totalPages > 1) {
            document.querySelector('#result-count').textContent =
                `${start + 1}-${Math.min(start + pageSize, matches.length)} of ${matches.length} games`;
        }
        document.querySelector('#results-heading').textContent =
            collection === 'saved' ? 'My backlog' : 'Catalog';
        document.querySelector('#catalog-title').innerHTML =
            collection === 'saved'
                ? 'Your saved<br><span>backlog.</span>'
                : 'Explore games and<br><span>organize your backlog.</span>';
        document.querySelector('#catalog-description').textContent =
            collection === 'saved'
                ? 'Your played games, current playthroughs, and wishlist in one place.'
                : 'Browse titles by genre, check details, and track what you want to play.';

        const noSavedGames =
            collection === 'saved' && !games.some((game) => window.Backlog.isSaved(game.id));
        document.querySelector('#empty-title').textContent = noSavedGames
            ? 'No saved games yet.'
            : statuses.length
              ? 'No games with these statuses.'
              : 'No games found.';
        document.querySelector('#empty-description').textContent = noSavedGames
            ? 'Open any game page to add it to your backlog.'
            : 'Try another search, status or genre.';
        tabs.forEach((tab) => {
            const selected = tab.dataset.collection === collection;
            tab.classList.toggle('selected', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
        window.BacklogMultiSelect?.sync();
        updateAddress();
        window.dispatchEvent(new Event('backlog-catalog-render'));
    }

    pagination.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (
            !link ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        const url = new URL(link.href),
            next = Number(url.searchParams.get('page') || 1);
        if (!Number.isInteger(next) || next < 1) return;
        try {
            history.pushState(null, '', url.href);
        } catch {
            return;
        }
        event.preventDefault();
        page = next;
        render();
        pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
        document
            .querySelector('#results-heading')
            .scrollIntoView({
                block: 'start',
                behavior: window.BacklogMotion?.matches ? 'instant' : 'smooth',
            });
    });
    window.addEventListener('popstate', () => {
        const address = new URLSearchParams(location.search);
        page = Math.max(1, Number.parseInt(address.get('page'), 10) || 1);
        collection = address.get('saved') === '1' ? 'saved' : 'all';
        searchInput.value = (address.get('q') || '').slice(0, 120);
        readSelection(genreSelect, 'genre', address);
        readSelection(statusSelect, 'status', address);
        sortSelect.value = ['az', 'za'].includes(address.get('sort'))
            ? address.get('sort')
            : 'featured';
        render();
    });

    function resetPage() {
        page = 1;
        render();
    }
    searchInput.addEventListener('input', resetPage);
    genreSelect.addEventListener('change', resetPage);
    statusSelect.addEventListener('change', resetPage);
    sortSelect.addEventListener('change', resetPage);
    window.addEventListener('backlog-search', resetPage);
    window.addEventListener('storage', render);
    window.addEventListener('backlog-change', render);
    window.addEventListener('pageshow', render);
    tabs.forEach((tab) =>
        tab.addEventListener('click', () => {
            collection = tab.dataset.collection;
            resetPage();
        })
    );

    document.querySelector('#reset-filters').addEventListener('click', () => {
        searchInput.value = '';
        for (const select of [genreSelect, statusSelect])
            for (const option of select.options) option.selected = false;
        sortSelect.value = 'featured';
        collection = 'all';
        resetPage();
        searchInput.focus();
    });

    render();
})();
