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
    let collection = params.get('saved') === '1' ? 'saved' : 'all';

    searchInput.value = (params.get('q') || '').slice(0, 120);
    if ([...genreSelect.options].some(option => option.value === params.get('genre'))) {
        genreSelect.value = params.get('genre');
    }
    if (['az', 'za'].includes(params.get('sort'))) sortSelect.value = params.get('sort');
    if (window.Backlog.statusOptions.some(option => option.id === params.get('status'))) {
        statusSelect.value = params.get('status');
    }

    function normalize(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
            badge.lang = 'pt-BR';
            badge.textContent = status.label;
            art.append(badge);
        }

        const title = document.createElement('h3');
        title.textContent = game.title;
        const tags = document.createElement('p');
        tags.textContent = game.tags.join(' · ');
        link.append(art, title, tags);
        return link;
    }

    function updateAddress() {
        const url = new URL(window.location.href);
        url.search = '';
        const query = searchInput.value.trim();
        if (query) url.searchParams.set('q', query);
        if (collection === 'saved') url.searchParams.set('saved', '1');
        if (genreSelect.value !== 'all') url.searchParams.set('genre', genreSelect.value);
        if (sortSelect.value !== 'featured') url.searchParams.set('sort', sortSelect.value);
        if (statusSelect.value !== 'all') url.searchParams.set('status', statusSelect.value);
        try {
            history.replaceState(null, '', url.href);
        } catch {
            // Alguns navegadores restringem alterações de endereço em arquivos locais.
        }
    }

    function render() {
        const query = normalize(searchInput.value.trim());
        let matches = games.filter(game => {
            const matchesQuery = normalize(game.title).includes(query);
            const matchesGenre = genreSelect.value === 'all' || game.genre === genreSelect.value;
            const matchesCollection = collection === 'all' || window.Backlog.isSaved(game.id);
            const matchesStatus = statusSelect.value === 'all' || window.Backlog.getStatus(game.id)?.id === statusSelect.value;
            return matchesQuery && matchesGenre && matchesCollection && matchesStatus;
        });

        if (sortSelect.value !== 'featured') {
            const direction = sortSelect.value === 'az' ? 1 : -1;
            matches = [...matches].sort((a, b) => direction * a.title.localeCompare(b.title, 'en'));
        }

        results.replaceChildren(...matches.map(createCard));
        emptyState.hidden = matches.length > 0;
        document.querySelector('#all-count').textContent = String(games.length);
        document.querySelector('#saved-count').textContent = String(window.Backlog.updateCount());
        document.querySelector('#result-count').textContent = `${matches.length} ${matches.length === 1 ? 'game' : 'games'}${query ? ` for “${searchInput.value.trim()}”` : ' to discover'}`;
        document.querySelector('#results-heading').textContent = collection === 'saved' ? 'Your collection' : 'The collection';
        document.querySelector('#catalog-title').innerHTML = collection === 'saved'
            ? 'Your games.<br><span>Your story.</span>'
            : 'Find your next<br><span>great adventure.</span>';
        document.querySelector('#catalog-description').textContent = collection === 'saved'
            ? 'All the adventures you saved, together in this browser.'
            : 'From familiar favorites to your next obsession. It all starts here.';

        const noSavedGames = collection === 'saved' && !games.some(game => window.Backlog.isSaved(game.id));
        document.querySelector('#empty-title').textContent = noSavedGames
            ? 'Your next adventure starts here.'
            : statusSelect.value !== 'all' ? 'Nenhum jogo com esse status.' : 'No games found.';
        document.querySelector('#empty-description').textContent = noSavedGames
            ? 'Open a game and add it to your backlog. Your saved games will appear here.'
            : 'Try another search, status or genre.';
        tabs.forEach(tab => {
            const selected = tab.dataset.collection === collection;
            tab.classList.toggle('selected', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
        updateAddress();
    }

    searchInput.addEventListener('input', render);
    genreSelect.addEventListener('change', render);
    statusSelect.addEventListener('change', render);
    sortSelect.addEventListener('change', render);
    window.addEventListener('backlog-search', render);
    window.addEventListener('storage', render);
    window.addEventListener('backlog-change', render);
    window.addEventListener('pageshow', render);
    tabs.forEach(tab => tab.addEventListener('click', () => {
        collection = tab.dataset.collection;
        render();
    }));

    document.querySelector('#reset-filters').addEventListener('click', () => {
        searchInput.value = '';
        genreSelect.value = 'all';
        statusSelect.value = 'all';
        sortSelect.value = 'featured';
        collection = 'all';
        render();
        searchInput.focus();
    });

    render();
})();
