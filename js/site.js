/* Navegação, pesquisa e armazenamento compartilhados entre as três páginas. */
(() => {
    'use strict';

    const games = window.BacklogGames;
    const searchForm = document.querySelector('.nav-search');
    const searchInput = document.querySelector('#site-search');
    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('#navigation');

    // O mesmo armazenamento é usado pela página do jogo e pelo catálogo.
    function isSaved(id) {
        try {
            return localStorage.getItem(`backlog:${id}`) === 'saved';
        } catch {
            return false;
        }
    }

    function updateCount() {
        const count = games.filter(game => isSaved(game.id)).length;
        document.querySelector('#nav-count').textContent = String(count);
        return count;
    }

    window.Backlog = { isSaved, updateCount };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('backlog-change', updateCount);

    // A pesquisa funciona também ao abrir os arquivos diretamente no navegador.
    // Fora do catálogo, leva o termo para a página de resultados.
    searchForm.addEventListener('submit', event => {
        event.preventDefault();
        if (document.querySelector('#game-results')) {
            window.dispatchEvent(new CustomEvent('backlog-search'));
            document.querySelector('#results-heading').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const url = new URL(searchForm.dataset.catalog, window.location.href);
        const query = searchInput.value.trim();
        if (query) url.searchParams.set('q', query);
        window.location.assign(url.href);
    });

    function closeMenu() {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open menu');
        navigation.classList.remove('is-open');
    }

    menuButton.addEventListener('click', () => {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        navigation.classList.toggle('is-open', open);
    });

    navigation.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', event => {
        const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
        if (event.key === '/' && !editing && !document.querySelector('dialog[open]')) {
            event.preventDefault();
            searchInput.focus();
        }
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
            closeMenu();
            menuButton.focus();
        }
    });

    window.matchMedia('(min-width: 801px)').addEventListener('change', event => {
        if (event.matches) closeMenu();
    });
})();
