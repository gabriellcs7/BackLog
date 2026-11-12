/* Navegação, pesquisa e armazenamento compartilhados entre as três páginas. */
(() => {
    'use strict';

    const games = window.BacklogGames;
    const gameByCover = new Map(games.map(game => [
        new URL('../imagens/capas/' + game.cover, document.currentScript.src).pathname,
        game.id
    ]));
    const searchForm = document.querySelector('.nav-search');
    const searchInput = document.querySelector('#site-search');
    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('#navigation');

    // Um status atual por jogo, compartilhado pela página de detalhes e pela coleção.
    const statusOptions = Object.freeze([
        { id: 'played', label: 'Played', description: 'You have played this game.' },
        { id: 'playing', label: 'Playing', description: 'You are currently playing this game.' },
        { id: 'completed', label: 'Completed', description: 'You completed the game.' },
        { id: 'platinum', label: 'Platinum', description: 'You completed all missions.' },
        { id: 'dropped', label: 'Dropped', description: 'You played this game but stopped before completing it.' },
        { id: 'want-to-play', label: 'Want to play', description: 'You want to play this game.' }
    ].map(option => Object.freeze(option)));

    const statusKey = id => window.BacklogAccount?.user ? `backlog:status:${window.BacklogAccount.user.id}:${id}` : `backlog:${id}`;
    function getStatus(id) {
        try {
            const stored = localStorage.getItem(statusKey(id));
            // Preserva os jogos salvos antes da introdução dos seis status.
            if (stored === 'saved') return statusOptions.find(option => option.id === 'want-to-play');
            return statusOptions.find(option => option.id === stored) || null;
        } catch {
            return null;
        }
    }

    function isSaved(id) {
        return getStatus(id) !== null;
    }

    const account=window.BacklogAccount;
    let cloudOwner=null,hydration=Promise.resolve(),statusQueue=Promise.resolve(),syncIssue='',syncGeneration=0;
    const syncedKey=(owner,id)=>'backlog:status-synced:'+owner+':'+id;
    async function hydrateStatuses(){
        const owner=account?.user?.id;
        if(!owner){cloudOwner=null;++syncGeneration;return;}
        if(account.loading||cloudOwner===owner)return;
        cloudOwner=owner;const ticket=++syncGeneration;
        hydration=(async()=>{try{
            const result=await account.client.rpc('my_game_statuses');if(result.error)throw result.error;
            if(ticket!==syncGeneration||account.user?.id!==owner)return;
            const rows=new Map((result.data||[]).map(row=>[row.game_id,row.status]));
            for(const game of games){
                const key='backlog:status:'+owner+':'+game.id,marker=syncedKey(owner,game.id);
                if(rows.has(game.id)){localStorage.setItem(key,rows.get(game.id));localStorage.setItem(marker,'yes');}
                else if(localStorage.getItem(marker)==='yes')localStorage.removeItem(key);
                else {const old=localStorage.getItem(key);if(statusOptions.some(option=>option.id===old)){
                    const imported=await account.client.rpc('save_game_status',{game_key:game.id,new_status:old,initial_import:true});if(imported.error)throw imported.error;
                    if(ticket!==syncGeneration||account.user?.id!==owner)return;localStorage.setItem(marker,'yes');
                }}
            }
            syncIssue='';window.dispatchEvent(new Event('backlog-change'));
        }catch(error){if(ticket===syncGeneration){cloudOwner=null;syncIssue=error.message;window.dispatchEvent(new Event('backlog-status-sync-error'));}}})();
        return hydration;
    }
    function cloudStatus(id,status){
        const owner=account.user.id;const task=statusQueue.catch(()=>{}).then(async()=>{await hydration;
        if(account.user?.id!==owner)throw new Error('Your account changed. Please try again.');
        const result=await account.client.rpc('save_game_status',{game_key:id,new_status:status,initial_import:false});if(result.error)throw new Error(result.error.message);
        if(account.user?.id!==owner)throw new Error('Your account changed. Please reload.');
        const key='backlog:status:'+owner+':'+id;
        if(status)localStorage.setItem(key,status);else localStorage.removeItem(key);
        localStorage.setItem(syncedKey(owner,id),'yes');syncIssue='';window.dispatchEvent(new Event('backlog-change'));
        });statusQueue=task;return task;
    }
    function setStatus(id, statusId) {
        if (!games.some(game => game.id === id) || !statusOptions.some(option => option.id === statusId)) {
            throw new Error('Invalid game or collection status.');
        }
        if(account?.user)return cloudStatus(id,statusId);
        localStorage.setItem('backlog:status-date:local:'+id,new Date().toISOString());
        localStorage.setItem(statusKey(id), statusId);
        window.dispatchEvent(new Event('backlog-change'));
    }

    function removeStatus(id) {
        if(account?.user)return cloudStatus(id,null);
        localStorage.removeItem('backlog:status-date:local:'+id);
        localStorage.removeItem(statusKey(id));
        window.dispatchEvent(new Event('backlog-change'));
    }

    function updateCoverStatus(image) {
        const path = new URL(image.src, document.baseURI).pathname;
        const id = gameByCover.get(path);
        const frame = image.closest('.library-art') || image;
        if (id) frame.dataset.coverStatus = getStatus(id)?.id || 'none';
        else delete frame.dataset.coverStatus;
    }

    function updateCovers(root = document) {
        if (root instanceof HTMLImageElement && root.hasAttribute('src')) updateCoverStatus(root);
        root.querySelectorAll('img[src]').forEach(updateCoverStatus);
    }

    updateCovers();
    new MutationObserver(records => {
        for (const record of records) {
            if (record.type === 'attributes') updateCoverStatus(record.target);
            else for (const node of record.addedNodes) {
                if (node instanceof Element) updateCovers(node);
            }
        }
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    window.addEventListener('backlog-change', () => updateCovers());
    window.addEventListener('storage', () => updateCovers());

    function updateCount() {
        const count = games.filter(game => isSaved(game.id)).length;
        document.querySelector('#nav-count').textContent = String(count);
        return count;
    }

    window.Backlog = { statusOptions, getStatus, setStatus, removeStatus, isSaved, updateCount, syncStatuses:hydrateStatuses, get statusReady(){return hydration;}, get syncError(){return syncIssue;} };
    updateCount();
    account?.ready.then(hydrateStatuses);
    window.addEventListener('backlog-account-change',hydrateStatuses);
    window.addEventListener('storage', updateCount);
    window.addEventListener('backlog-change', updateCount);
    window.addEventListener('backlog-account-change', () => window.dispatchEvent(new Event('backlog-change')));

    // A pesquisa funciona também ao abrir os arquivos diretamente no navegador.
    // Fora do catálogo, leva o termo para a página de resultados.
    searchForm.addEventListener('submit', event => {
        event.preventDefault();
        if (document.querySelector('#game-results')) {
            window.dispatchEvent(new CustomEvent('backlog-search'));
            (document.querySelector('#player-search-section:not([hidden])')||document.querySelector('#results-heading')).scrollIntoView({ behavior: 'smooth' });
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
