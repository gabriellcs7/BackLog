/* Progresso de quem está conectado, independente do dono da lista. */
(() => {
    'use strict';const entries=new Set(),ns='http://www.w3.org/2000/svg';
    const el=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    function circle(cls){const c=document.createElementNS(ns,'circle');for(const [key,value] of Object.entries({cx:28,cy:28,r:22,class:cls}))c.setAttribute(key,value);return c;}
    function paint(entry,error=''){
        const {button,value,caption,range,total,played,mode}=entry,percent=total?Math.round(played/total*100):0;
        button.disabled=Boolean(error);value.textContent=error?'—':mode==='count'?played+' of '+total:percent+'%';caption.textContent=error?'Progress unavailable':'Your progress';
        button.setAttribute('aria-label',error?'Your progress is unavailable':'Your progress: '+played+' of '+total+' games played, '+percent+' percent. Show '+(mode==='count'?'percentage':'game count')+'.');
        button.title=error||'Played, Playing, Completed, Platinum and Dropped count. Click to switch between percentage and count.';
        if(range)range.style.strokeDasharray=(error?0:percent/100*138.23)+' 138.23';
    }
    function hasPlayed(id){const status=window.Backlog.getStatus(id)?.id;if(status==='want-to-play')return false;if(['played','playing','completed','platinum','dropped'].includes(status))return true;const review=window.BacklogReviews?.get(id);return Boolean(review&&(review.rating!=null||review.text?.trim()));}
    async function update(entry){
        const ticket=++entry.version;entry.button.disabled=true;entry.value.textContent='—';entry.caption.textContent='Loading progress…';entry.button.setAttribute('aria-label','Loading your progress');if(entry.range)entry.range.style.strokeDasharray='0 138.23';try{await window.BacklogAccount.ready;const owner=window.BacklogAccount.user?.id||'local';if(window.BacklogAccount.loading)return;await window.Backlog.statusReady;if(ticket!==entry.version||owner!==(window.BacklogAccount.user?.id||'local'))return;if(window.Backlog.syncError)throw new Error('Could not sync your game statuses.');entry.played=entry.ids.filter(hasPlayed).length;paint(entry);}catch{if(ticket===entry.version)paint(entry,'Could not load your progress. Please try again.');}
    }
    function refresh(){for(const entry of entries){if(!entry.button.isConnected){entries.delete(entry);continue;}update(entry);}}
    window.BacklogListProgress={create(gameIds,{compact=false,minimal=false}={}){
        const ids=[...new Set(gameIds)].filter(id=>window.BacklogGames.some(game=>game.id===id));
        const button=el('button','list-progress'+(compact?' list-progress-compact':'')+(minimal?' list-progress-minimal':''));button.type='button';
        const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 56 56');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');let range=null;if(minimal){svg.setAttribute('viewBox','0 0 24 24');svg.classList.add('list-progress-gamepad');for(const d of ['M6.5 7h11a3 3 0 0 1 2.9 2.3l1.1 6.1c.4 2.2-2.3 3.4-3.7 1.7L15.8 15H8.2l-2 2.1c-1.4 1.7-4.1.5-3.7-1.7l1.1-6.1A3 3 0 0 1 6.5 7Z','M7 10v4m-2-2h4']){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);}for(const [x,y] of [[16,11],[18,13]]){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','.65');svg.append(dot);}}else{range=circle('list-progress-range');svg.append(circle('list-progress-track'),range);}
        const copy=el('span','list-progress-copy'),value=el('strong','','—'),caption=el('small','','Loading progress…');copy.append(value,caption);button.append(svg,copy);
        const entry={button,value,caption,range,ids,total:ids.length,played:0,mode:'percent',version:0};entries.add(entry);
        button.addEventListener('click',()=>{entry.mode=entry.mode==='percent'?'count':'percent';paint(entry);});update(entry);return button;
    }};
    for(const event of ['backlog-change','backlog-review-change','backlog-account-change','storage','pageshow','backlog-status-sync-error'])window.addEventListener(event,refresh);
})();
