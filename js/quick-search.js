/* Busca global em janela: jogos locais e perfis públicos, sem dependências externas. */
(() => {
    const ui = window.BacklogUI,
        account = window.BacklogAccount,
        api = window.BacklogCommunity,
        input = document.querySelector('#site-search'),
        form = document.querySelector('.nav-search');
    if (!ui || !input || !form || !HTMLDialogElement.prototype.showModal) return;
    const el = ui.element,
        dialog = el('dialog', 'social-dialog quick-search-dialog');
    dialog.setAttribute('aria-label', 'Search games and players');
    const header = el('div', 'quick-search-header'),
        field = el('input');
    field.type = 'search';
    field.placeholder = 'Search games or players…';
    field.autocomplete = 'off';
    field.maxLength = 120;
    field.setAttribute('aria-label', 'Search games and players');
    field.setAttribute('role', 'combobox');
    field.setAttribute('aria-autocomplete', 'list');
    field.setAttribute('aria-expanded', 'true');
    field.setAttribute('aria-controls', 'quick-search-results');
    const close = el('button', 'quick-search-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close search');
    header.append(field, close);
    const tabs = el('div', 'command-search-tabs');
    tabs.setAttribute('role', 'group');
    tabs.setAttribute('aria-label', 'Search categories');
    let filter = 'all',
        query = '',
        players = [],
        generation = 0,
        timer = 0,
        current = -1,
        links = [],
        returnFocus = null;
    const cache = new Map();
    for (const [id, label] of [
        ['all', 'All results'],
        ['games', 'Games'],
        ['players', 'Players'],
    ]) {
        const button = el('button', '', label);
        button.type = 'button';
        button.dataset.category = id;
        button.setAttribute('aria-pressed', String(id === filter));
        button.addEventListener('click', () => {
            filter = id;
            tabs.querySelectorAll('button').forEach((node) =>
                node.setAttribute('aria-pressed', String(node === button))
            );
            render();
            field.focus();
        });
        tabs.append(button);
    }
    const results = el('div', 'quick-search-results');
    results.id = 'quick-search-results';
    results.setAttribute('role', 'listbox');
    results.setAttribute('aria-label', 'Search results');
    const status = el('p', 'quick-search-status');
    status.setAttribute('role', 'status');
    const footer = el('div', 'quick-search-footer'),
        help = el('span', '', '↑↓ Navigate · Enter Open · Esc Close'),
        all = el('a', '', 'View all results ↗');
    footer.append(help, all);
    dialog.append(header, tabs, results, status, footer);
    document.body.append(dialog);
    const normalize = (value) =>
        String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    function highlight(index) {
        current = index;
        links.forEach((link, i) => {
            link.classList.toggle('is-active', i === index);
            link.setAttribute('aria-selected', String(i === index));
        });
        const selected = links[index];
        if (selected) {
            field.setAttribute('aria-activedescendant', selected.id);
            const top = selected.offsetTop,
                bottom = top + selected.offsetHeight;
            if (top < results.scrollTop) results.scrollTop = top;
            else if (bottom > results.scrollTop + results.clientHeight)
                results.scrollTop = bottom - results.clientHeight;
        } else field.removeAttribute('aria-activedescendant');
    }
    function group(name) {
        const section = el('div', 'quick-search-group');
        section.setAttribute('role', 'group');
        section.setAttribute('aria-label', name);
        const heading = el('p', 'quick-search-group-title', name);
        heading.setAttribute('aria-hidden', 'true');
        section.append(heading);
        results.append(section);
        return section;
    }
    function result(section, url, image, title, subtitle) {
        const link = el('a', 'quick-search-result');
        link.href = url;
        link.tabIndex = -1;
        link.id = 'quick-result-' + links.length;
        link.setAttribute('role', 'option');
        link.setAttribute('aria-selected', 'false');
        const copy = el('span', 'quick-search-result-copy');
        copy.append(el('strong', '', title), el('small', '', subtitle));
        link.append(image, copy, el('span', 'quick-search-result-arrow', '↗'));
        link.addEventListener('pointermove', () => highlight(links.indexOf(link)));
        section.append(link);
        links.push(link);
    }
    function render() {
        results.replaceChildren();
        links = [];
        current = -1;
        field.removeAttribute('aria-activedescendant');
        const term = normalize(query),
            games = window.BacklogGames.filter(
                (game) =>
                    !term ||
                    normalize(
                        [game.title, game.franchise, ...(game.aliases || [])].join(' ')
                    ).includes(term)
            )
                .sort(
                    (a, b) =>
                        Number(normalize(b.title).startsWith(term)) -
                        Number(normalize(a.title).startsWith(term))
                )
                .slice(0, 7);
        if (filter !== 'players' && games.length) {
            const section = group(query ? 'Games' : 'Explore games');
            for (const game of games) {
                const img = el('img', 'quick-search-cover');
                img.src = ui.href('imagens/capas/' + game.cover);
                img.alt = '';
                img.loading = 'lazy';
                result(
                    section,
                    ui.href('view/game.html?id=' + encodeURIComponent(game.id)),
                    img,
                    game.title,
                    [game.year, ...game.tags.slice(0, 2)].filter(Boolean).join(' · ')
                );
            }
        }
        if (filter !== 'games' && players.length) {
            const section = group('Players');
            for (const player of players.slice(0, 5))
                result(
                    section,
                    ui.href('view/profile.html?id=' + encodeURIComponent(player.id)),
                    ui.avatar(player),
                    player.display_name,
                    'Player profile'
                );
        }
        if (!links.length)
            results.append(
                el(
                    'p',
                    'social-empty',
                    query
                        ? 'No matching results. Try a different name.'
                        : 'Type a name to find players.'
                )
            );
        const url = new URL(ui.href('view/pagina_jogos.html'));
        if (query) url.searchParams.set('q', query);
        all.href = url.href;
        if (links.length) highlight(0);
    }
    function search() {
        query = field.value.trim();
        const ticket = ++generation;
        clearTimeout(timer);
        players = [];
        status.textContent = '';
        render();
        if (filter === 'games' || query.length < 2) {
            if (filter === 'players')
                status.textContent = 'Type at least two characters to find players.';
            return;
        }
        if (!account.configured) {
            status.textContent = 'Player search is unavailable offline. You can still find games.';
            return;
        }
        const key = normalize(query);
        if (cache.has(key)) {
            players = cache.get(key);
            render();
            return;
        }
        status.textContent = 'Searching players…';
        timer = setTimeout(async () => {
            try {
                const items = await api.searchPlayers(query);
                if (ticket !== generation || !dialog.open) return;
                players = items;
                cache.set(key, items);
                render();
                status.textContent = items.length ? '' : 'No players found.';
            } catch (error) {
                if (ticket === generation)
                    status.textContent =
                        'Could not load players. Game results are still available.';
            }
        }, 280);
    }
    function open(value = input.value) {
        if (dialog.open) return;
        if (document.querySelector('dialog[open]')) return;
        returnFocus = document.activeElement;
        field.value = value;
        dialog.showModal();
        search();
        field.focus();
        field.select();
    }
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        clearTimeout(timer);
        ++generation;
        returnFocus?.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        )
            dialog.close();
    });
    field.addEventListener('input', search);
    field.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (links.length)
                highlight(
                    Math.max(
                        0,
                        Math.min(links.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))
                    )
                );
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            location.assign(links[current]?.href || all.href);
        }
    });
    tabs.addEventListener('click', search);
    input.readOnly = true;
    input.setAttribute('aria-haspopup', 'dialog');
    input.addEventListener('click', () => open());
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            open(event.key);
        }
    });
    form.addEventListener(
        'submit',
        (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            open();
        },
        true
    );
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            open();
        }
    });
    window.addEventListener('backlog-account-change', () => {
        cache.clear();
        if (dialog.open) search();
    });
    window.BacklogQuickSearch = { open };
})();
