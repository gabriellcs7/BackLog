/* Página de detalhes: dados do jogo, coleção local e compartilhamento. */
(() => {
    'use strict';

    const requestedId = new URLSearchParams(window.location.search).get('id');
    const games = window.BacklogGames;
    const game = games.find(item => item.id === requestedId) || games[0];
    const trailer=window.BacklogGameTrailers?.[game.id];
    const trailerLink=document.querySelector('#game-trailer-link');
    if(trailer&&/^[A-Za-z0-9_-]{11}$/.test(trailer.videoId)){
        trailerLink.href='https://www.youtube.com/watch?v='+trailer.videoId;
        trailerLink.title=trailer.title+' · '+trailer.channel;
        trailerLink.setAttribute('aria-label','Watch '+game.title+' '+(trailer.kind||'trailer')+' on YouTube (opens in a new tab)');
        if(trailer.kind==='gameplay')trailerLink.querySelector('span').textContent='Watch gameplay';
        else if(trailer.kind==='intro')trailerLink.querySelector('span').textContent='Watch intro';
    }else trailerLink.hidden=true;

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
        document.querySelector('.cover-label').textContent = game.releaseState === 'upcoming'
            ? 'COMING SOON'
            : game.releaseState === 'retired' ? 'HISTORICAL GAME' : (game.kind || 'CATALOG').toUpperCase();
        document.querySelector('.game-summary .eyebrow').textContent = game.studio;
        document.querySelector('.game-summary h2').textContent = game.caption;
        document.querySelector('.rating-preview strong').textContent = 'Not rated yet';
        document.querySelector('.rating-preview div>span').textContent = 'Add your rating below';
        if (game.releaseState === 'upcoming') {
            document.querySelector('.rating-preview strong').textContent = 'Coming soon';
            document.querySelector('.rating-preview div>span').textContent = 'Announced game';
        } else if (game.releaseState === 'retired') {
            document.querySelector('.rating-preview strong').textContent = 'Historical game';
            document.querySelector('.rating-preview div>span').textContent = 'Classic title';
        }
    }

    document.querySelector('.about-section > p').textContent = game.description;
    document.querySelector('.about-section > p + p').textContent = game.gameplay;

    const title = document.querySelector('#game-title');
    const logo = document.createElement('img');
    logo.className = 'game-title-logo';
    logo.src = '../imagens/logos/' + game.id + '.png';
    logo.alt = game.title;
    logo.fetchPriority = 'high';
    title.classList.add('has-game-logo');
    logo.addEventListener('error', () => {
        title.classList.remove('has-game-logo');
        title.textContent = game.title;
    }, { once: true });
    title.replaceChildren(logo);

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
        [game.franchise ? 'Franchise' : 'Collection', game.franchise || 'Backlog'],
        [game.releaseState === 'upcoming' ? 'Planned release' : 'First release', String(game.year)],
        ['Your status', window.Backlog.getStatus(game.id)?.label || 'Not in collection']
    ];
    document.querySelectorAll('.details-grid>div').forEach((detail, index) => {
        detail.querySelector('dt').textContent = values[index][0];
        detail.querySelector('dd').textContent = values[index][1];
    });

    const characterList = document.querySelector('#character-list');
    const characters = window.BacklogGameCharacters[game.id] || [];
    for (const [name, portrait, role] of characters) {
        const item = document.createElement('li');
        const image = document.createElement('img');
        image.src = '../imagens/personagens/' + portrait + '.webp';
        image.alt = '';
        image.loading = 'lazy';
        image.width = 128;
        image.height = 128;
        const copy = document.createElement('div');
        const label = document.createElement('strong');
        label.textContent = name;
        copy.append(label);
        if (role) {
            const subtitle = document.createElement('span');
            subtitle.textContent = role;
            copy.append(subtitle);
        }
        item.append(image, copy);
        characterList.append(item);
    }
    if (characters.length) {
        document.querySelector('#characters').hidden = false;
        document.querySelector('.section-tabs a[href="#characters"]').hidden = false;
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
            : 'Choose a status to add this game.';
        document.querySelector('#collection-status-label').textContent = status?.label || '';
        collectionStatus.hidden = !status;
        if (game.id !== games[0].id) {
            document.querySelector('.details-grid>div:last-child dd').textContent = status?.label || 'Not in collection';
        }
        window.Backlog.updateCount();
    }

    async function updateStatus(statusId) {
        if (window.Backlog.getStatus(game.id)?.id === statusId) return;
        try {
            await window.Backlog.setStatus(game.id, statusId);
            const status = window.Backlog.getStatus(game.id);
            notify(`${game.title}: ${status.label}.`);
        } catch(error) {
            notify(error.message||'Could not save this status.');
        }
    }

    statusButtons.forEach(button => {
        button.addEventListener('click', () => updateStatus(button.dataset.status));
    });
    document.querySelector('#remove-game').addEventListener('click', async () => {
        try {
            await window.Backlog.removeStatus(game.id);
            notify('Game removed from your collection.');
            statusButtons[0].focus();
        } catch(error) {
            notify(error.message||'Could not remove this game.');
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
            document.querySelector('#copy-status').textContent = 'Select the address and copy it with Ctrl+C or your device\'s copy menu.';
        }
    });
})();
