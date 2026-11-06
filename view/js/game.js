/* Página de detalhes: dados do jogo, coleção local e compartilhamento. */
(() => {
    'use strict';

    const requestedId = new URLSearchParams(window.location.search).get('id');
    const games = window.BacklogGames;
    const game = games.find(item => item.id === requestedId) || games[0];
    const storageKey = `backlog:${game.id}`;
    const saveButton = document.querySelector('#save-game');
    const saveLabel = document.querySelector('#save-label');
    const saveIcon = document.querySelector('#save-icon');
    const collectionStatus = document.querySelector('#collection-status');
    const toast = document.querySelector('#toast');
    let saved = window.Backlog.isSaved(game.id);
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
        document.querySelector('.platforms').hidden = true;

        const values = [
            ['Studio', game.studio],
            ['Collection', 'Your personal backlog'],
            ['Genre', game.tags.join(' · ')],
            ['Your status', saved ? 'In your backlog' : 'Ready to discover']
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
    const recommendations = games.filter(item => item.id !== game.id).slice(0, 4);
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

    function renderSavedState() {
        saveButton.setAttribute('aria-pressed', String(saved));
        saveLabel.textContent = saved ? 'Added to backlog' : 'Add to backlog';
        saveIcon.textContent = saved ? '✓' : '＋';
        collectionStatus.hidden = !saved;
        if (game.id !== games[0].id) {
            document.querySelector('.details-grid>div:last-child dd').textContent = saved ? 'In your backlog' : 'Ready to discover';
        }
        window.Backlog.updateCount();
    }

    function updateSavedState(nextState) {
        try {
            if (nextState) localStorage.setItem(storageKey, 'saved');
            else localStorage.removeItem(storageKey);
            saved = nextState;
            renderSavedState();
            window.dispatchEvent(new Event('backlog-change'));
            notify(saved ? `${game.title} added to your backlog.` : 'Game removed from your backlog.');
        } catch {
            notify('Saving is unavailable in this browser. Please enable local storage.');
        }
    }

    saveButton.addEventListener('click', () => updateSavedState(!saved));
    document.querySelector('#remove-game').addEventListener('click', () => {
        updateSavedState(false);
        saveButton.focus();
    });
    window.addEventListener('storage', () => {
        saved = window.Backlog.isSaved(game.id);
        renderSavedState();
    });
    window.addEventListener('pageshow', () => {
        saved = window.Backlog.isSaved(game.id);
        renderSavedState();
    });
    renderSavedState();

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
