/* Página de detalhes: dados do jogo, coleção local e compartilhamento. */
(() => {
    'use strict';

    const requestedId = new URLSearchParams(window.location.search).get('id');
    const games = window.BacklogGames;
    const game = games.find(item => item.id === requestedId) || games[0];
    const statusButtons = document.querySelectorAll('.game-status-button');
    const collectionStatus = document.querySelector('#collection-status');
    const toast = document.querySelector('#toast');
    let toastTimer;

    // Cada jogo possui uma arte horizontal e um enquadramento para cada tela.
    const hero = document.querySelector('.hero');
    const backdrop = document.querySelector('.hero-image');
    backdrop.src = `../imagens/${game.banner}`;
    hero.style.setProperty('--banner-position', game.bannerPosition || 'center');
    hero.style.setProperty('--banner-position-mobile', game.bannerPositionMobile || 'center');

    // O GTA VI usa a composição original; os demais jogos usam os dados do catálogo.
    document.title = `${game.title} · BackLog`;
    document.querySelector('meta[name="description"]').content = game.description;

    if (game.id !== games[0].id) {
        document.body.classList.remove('gta-vi-page');
        document.querySelector('#game-title').textContent = game.title;
        document.querySelector('.hero-caption').textContent = game.caption;
        document.querySelector('.breadcrumbs>span:last-child').textContent = game.title;
        document.querySelector('.hero-heading').classList.add('generic-heading');

        const cover = document.querySelector('.game-cover');
        cover.src = `../imagens/capas/${game.cover}`;
        cover.alt = `${game.title} cover`;
        document.querySelector('.cover-label').textContent = 'BUILD YOUR COLLECTION';
        document.querySelector('.game-summary .eyebrow').textContent = game.studio;
        document.querySelector('.game-summary h2').textContent = game.caption;
        document.querySelector('.rating-preview strong').textContent = 'Your next game';
        document.querySelector('.rating-preview div>span').textContent = 'Make it a memory';
        document.querySelector('.about-section>p').textContent = game.description;
        document.querySelector('.about-section>p + p').textContent = 'Save it to your backlog and come back whenever you are ready for your next adventure.';
        const platforms = document.querySelector('.platforms');
        const platformItems = (game.platforms || []).map(platform => {
            const item = document.createElement('span');
            item.className = 'platform';
            item.textContent = platform;
            return item;
        });
        const platformLabel = document.createElement('span');
        platformLabel.className = 'small-label';
        platformLabel.textContent = 'PLATFORMS';
        platforms.replaceChildren(platformLabel, ...platformItems);
        platforms.hidden = platformItems.length === 0;

        const values = [
            ['Studio', game.studio],
            [game.franchise ? 'Franchise' : 'Collection', game.franchise || 'Your personal backlog'],
            [game.year ? 'First release' : 'Genre', game.year ? String(game.year) : game.tags.join(' · ')],
            ['Your status', window.Backlog.getStatus(game.id)?.label || 'Ready to discover']
        ];
        document.querySelectorAll('.details-grid>div').forEach((detail, index) => {
            detail.querySelector('dt').textContent = values[index][0];
            detail.querySelector('dd').textContent = values[index][1];
        });
    }

    const tags = game.tags.map(tag => {
        const span = document.createElement('span');
        span.textContent = tag;
        return span;
    });
    document.querySelector('.hero-tags').replaceChildren(...tags);

    // As sugestões levam a outros jogos e excluem o jogo aberto.
    const otherGames = games.filter(item => item.id !== game.id);
    const relatedGames = otherGames.filter(item => game.franchise && item.franchise === game.franchise);
    const recommendations = [...relatedGames, ...otherGames.filter(item => !relatedGames.includes(item))].slice(0, 4);
    document.querySelectorAll('.discover-card').forEach((card, index) => {
        const recommendation = recommendations[index];
        card.href = `game.html?id=${encodeURIComponent(recommendation.id)}`;
        card.querySelector('img').src = `../imagens/capas/${recommendation.cover}`;
        card.querySelector('h3').textContent = recommendation.title;
        card.querySelector('p').textContent = recommendation.tags.join(' · ');
    });

    function notify(message) {
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('visible');
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
    }

    function renderCollectionState() {
        const status = window.Backlog.getStatus(game.id);
        statusButtons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.status === status?.id));
        });
        document.querySelector('#game-status-help').textContent = status
            ? status.description
            : 'Escolha um status para adicionar este jogo.';
        document.querySelector('#collection-status-label').textContent = status?.label || '';
        collectionStatus.hidden = !status;
        if (game.id !== games[0].id) {
            document.querySelector('.details-grid>div:last-child dd').textContent = status?.label || 'Ready to discover';
        }
        window.Backlog.updateCount();
    }

    function updateStatus(statusId) {
        if (window.Backlog.getStatus(game.id)?.id === statusId) return;
        try {
            window.Backlog.setStatus(game.id, statusId);
            const status = window.Backlog.getStatus(game.id);
            notify(`${game.title}: ${status.label}.`);
        } catch {
            notify('Não foi possível salvar. Permita o armazenamento neste navegador.');
        }
    }

    statusButtons.forEach(button => {
        button.addEventListener('click', () => updateStatus(button.dataset.status));
    });
    document.querySelector('#remove-game').addEventListener('click', () => {
        try {
            window.Backlog.removeStatus(game.id);
            notify('Jogo removido da sua coleção.');
            statusButtons[0].focus();
        } catch {
            notify('Não foi possível remover. Permita o armazenamento neste navegador.');
        }
    });
    window.addEventListener('backlog-change', renderCollectionState);
    window.addEventListener('storage', renderCollectionState);
    window.addEventListener('pageshow', renderCollectionState);
    renderCollectionState();

    const shareDialog = document.querySelector('#share-dialog');
    const shareUrl = document.querySelector('#share-url');
    document.querySelector('#share-game').addEventListener('click', () => {
        shareUrl.value = window.location.href.split('#')[0];
        document.querySelector('#copy-status').textContent = window.location.protocol === 'file:'
            ? 'This is a local preview. Publish the page to get a public address.' : '';
        shareDialog.showModal();
        shareUrl.focus();
        shareUrl.select();
    });
    document.querySelector('#copy-link').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(shareUrl.value);
            document.querySelector('#copy-status').textContent = 'Link copied!';
        } catch {
            shareUrl.focus();
            shareUrl.select();
            document.querySelector('#copy-status').textContent = 'Select the address and copy it with Ctrl+C or your device’s copy menu.';
        }
    });
})();
