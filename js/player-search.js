/* Shared search results: games remain local, public players come from the database. */
(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI;
    const input=document.getElementById('site-search'),section=document.getElementById('player-search-section'),results=document.getElementById('player-search-results'),summary=document.getElementById('player-search-summary'),feedback=document.getElementById('player-search-feedback'),more=document.getElementById('more-players');
    let generation=0,timer,offset=0,query='',busy=false,seen=new Set();
    async function load(reset=true){
        if(!reset&&busy)return;
        const ticket=++generation;query=input.value.trim();section.hidden=!query;
        if(reset){offset=0;seen=new Set();results.replaceChildren();summary.textContent='';feedback.textContent='';more.hidden=true;}
        if(query.length<2){if(query)results.append(ui.element('p','social-empty','Type at least two characters to find players.'));return;}
        if(!account.configured){results.append(ui.element('p','social-empty','Player search needs an online connection. You can still search games below.'));return;}
        busy=true;more.disabled=true;summary.textContent='Searching players…';
        try{
            const items=await api.searchPlayers(query,offset);if(ticket!==generation)return;
            for(const player of items){if(seen.has(player.id))continue;seen.add(player.id);const card=ui.element('a','player-search-card');card.href=ui.href('view/profile.html?id='+encodeURIComponent(player.id));card.append(ui.avatar(player),ui.element('strong','',player.display_name));results.append(card);}
            offset+=items.length;more.hidden=items.length<12;summary.textContent=seen.size+' '+(seen.size===1?'player':'players')+' found'+(items.length===12?' so far':'');
            if(!seen.size)results.append(ui.element('p','social-empty','No players found. Try a different name.'));
        }catch(error){if(ticket===generation){summary.textContent='';feedback.textContent='Could not search players. '+error.message;more.hidden=false;more.textContent='Try again';}}
        finally{if(ticket===generation){busy=false;more.disabled=false;}}
    }
    function schedule(){++generation;busy=false;clearTimeout(timer);section.hidden=!input.value.trim();summary.textContent='';results.replaceChildren();feedback.textContent='';more.hidden=true;timer=setTimeout(()=>load(),300);}
    input.addEventListener('input',schedule);
    window.addEventListener('backlog-search',()=>{clearTimeout(timer);load();});
    // Reset filters also clears the search value, without firing an input event.
    document.getElementById('reset-filters').addEventListener('click',()=>{clearTimeout(timer);load();});
    window.addEventListener('popstate',()=>{clearTimeout(timer);load();});
    more.addEventListener('click',()=>{more.textContent='More players';load(!seen.size);});
    account.ready.then(()=>load());
})();
