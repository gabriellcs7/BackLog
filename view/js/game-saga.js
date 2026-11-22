/* Outros títulos da mesma franquia, em ordem de lançamento. */
(() => {
    'use strict';const ui=window.BacklogUI,games=window.BacklogGames,requested=new URLSearchParams(location.search).get('id'),game=games.find(g=>g.id===requested)||games[0],section=document.getElementById('saga'),tab=document.querySelector('.section-tabs a[href="#saga"]');if(!section||!game.franchise)return;
    const related=games.filter(g=>g.id!==game.id&&g.franchise===game.franchise).sort((a,b)=>(Number.parseInt(a.year,10)||9999)-(Number.parseInt(b.year,10)||9999)||a.title.localeCompare(b.title));if(!related.length)return;
    section.hidden=false;tab.hidden=false;const grid=section.querySelector('.game-saga-grid'),name=section.querySelector('.game-saga-name');name.textContent=game.franchise;name.dataset.noTranslate='';
    for(const item of related){const card=ui.gameCard(item.id);card.classList.add('saga-game-card');card.dataset.gameId=item.id;const meta=ui.element('p','saga-game-meta',String(item.year||''));card.append(meta);grid.append(card);}
})();
