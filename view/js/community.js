/* Reviews reais do jogo no marquee; discussões completas ficam na página da review. */
(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,el=ui.element,marquee=window.BacklogGameReviewMarquee;
    const requested=new URLSearchParams(location.search).get('id');
    const game=window.BacklogGames.find(game=>game.id===requested)||window.BacklogGames[0];
    const feed=document.querySelector('#community-feed'),feedback=document.querySelector('#community-feedback'),more=document.querySelector('#more-reviews');
    let offset=0,generation=0,busy=false,reviews=new Map();
    async function load(reset=false){
        if(busy&&!reset)return;const ticket=reset?++generation:generation;busy=true;more.disabled=true;feedback.textContent='';
        document.querySelector('#community-signin').hidden=Boolean(account.user)||!account.configured;
        document.querySelector('#refresh-community').hidden=!account.configured;
        if(!account.configured){marquee.clear();feed.replaceChildren(el('p','social-empty','Community reviews are not connected yet. Your personal review is still saved on this device.'));more.hidden=true;busy=false;return;}
        try{
            if(reset){offset=0;reviews=new Map();marquee.clear();feed.replaceChildren(ui.loadingCards('Loading community reviews…',2));}
            const items=await api.feed(game.id,offset);if(ticket!==generation)return;
            if(reset){const anchor=location.hash.match(/^#review-([0-9a-f-]{36})$/i);if(anchor&&!items.some(item=>item.id===anchor[1])){const pinned=await api.review(anchor[1]);if(ticket!==generation)return;if(pinned&&pinned.game_id===game.id)reviews.set(pinned.id,pinned);}}
            for(const review of items)if(review.game_id===game.id)reviews.set(review.id,review);
            offset+=items.length;more.hidden=items.length<20;
            marquee.render([...reviews.values()]);
            if(!reviews.size)feed.replaceChildren(el('p','social-empty','No public reviews yet. Be the first to share your take.'));
            if(reset&&location.hash.startsWith('#review-'))document.getElementById(location.hash.slice(1))?.querySelector('a')?.focus();
        }catch(error){if(ticket===generation){if(reset){marquee.clear();feed.replaceChildren();}feedback.textContent=error.message||'Could not load reviews. Try refreshing.';}}
        finally{if(ticket===generation){busy=false;more.disabled=false;}}
    }
    document.querySelector('#refresh-community').addEventListener('click',()=>load(true));more.addEventListener('click',()=>load());
    window.addEventListener('backlog-review-change',event=>{if(event.detail?.id===game.id)load(true);});
    window.addEventListener('backlog-account-change',()=>{if(!account.loading)load(true);});account.ready.then(()=>load(true));
})();
