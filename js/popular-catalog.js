/* Ranking da comunidade; cada conta vale uma vez por jogo. */
(() => {
    'use strict';const ui=window.BacklogUI,grid=document.getElementById('popular-catalog-games'),feedback=document.getElementById('popular-catalog-feedback'),retry=document.getElementById('popular-catalog-retry');if(!grid)return;
    let generation=0,lastLoad=0,rows=[];
    const t=text=>window.BacklogI18n?.t(text)||text;
    function draw(){grid.replaceChildren();for(const [i,row]of rows.entries()){const card=ui.gameCard(row.game_id);card.dataset.gameId=row.game_id;const badge=ui.element('span','rank-badge',String(i+1).padStart(2,'0'));badge.setAttribute('aria-hidden','true');card.querySelector('.library-art').append(badge);const count=ui.element('p','popular-player-count');count.textContent=row.player_count+' '+t(row.player_count===1?'player':'players');card.append(count);grid.append(card);}}
    async function load(){const ticket=++generation;lastLoad=Date.now();grid.setAttribute('aria-busy','true');retry.hidden=true;feedback.textContent='Loading popular games…';
        try{const data=await window.BacklogCommunity.catalogPopularity();if(ticket!==generation)return;rows=data.slice(0,6);draw();feedback.textContent=rows.length?'':'No games have been rated or reviewed yet.';}
        catch{if(ticket!==generation)return;rows=[];draw();feedback.textContent='Could not load popular games.';retry.hidden=false;}
        finally{if(ticket===generation)grid.setAttribute('aria-busy','false');}
    }
    retry.addEventListener('click',load);window.addEventListener('backlog-language-change',draw);window.addEventListener('backlog-review-change',load);window.addEventListener('backlog-account-change',load);window.addEventListener('focus',()=>{if(Date.now()-lastLoad>60000)load();});load();
})();
