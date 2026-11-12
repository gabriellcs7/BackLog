/* Reviews públicas do jogo, likes e comentários ligados à conta autenticada. */
(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,{element:el,action}=ui;
    const gameId=new URLSearchParams(location.search).get('id');
    const game=window.BacklogGames.find(game=>game.id===gameId)||window.BacklogGames[0];
    const feed=document.querySelector('#community-feed'),feedback=document.querySelector('#community-feedback'),more=document.querySelector('#more-reviews');
    let offset=0,generation=0,busy=false;
    const reviewCard=window.BacklogReviewCard;
    async function load(reset=false){if(busy&&!reset)return;const ticket=reset?++generation:generation;busy=true;more.disabled=true;feedback.textContent='';
        const signIn=document.querySelector('#community-signin');signIn.hidden=Boolean(account.user)||!account.configured;
        document.querySelector('#refresh-community').hidden=!account.configured;
        if(!account.configured){feed.replaceChildren(el('p','social-empty','Community reviews are not connected yet. Your personal review is still saved on this device.'));more.hidden=true;busy=false;return;}
        try{if(reset){offset=0;feed.replaceChildren(el('p','social-small','Loading reviews…'));}const items=await api.feed(game.id,offset);if(ticket!==generation)return;if(reset){feed.replaceChildren();const anchor=location.hash.match(/^#review-([0-9a-f-]{36})$/i);if(anchor&&!items.some(item=>item.id===anchor[1])){const pinned=await api.review(anchor[1]);if(ticket!==generation)return;if(pinned&&pinned.game_id===game.id)feed.append(reviewCard(pinned));}}for(const item of items){if(!document.getElementById('review-'+item.id))feed.append(reviewCard(item));}offset+=items.length;more.hidden=items.length<20;if(reset&&location.hash.startsWith('#review-'))document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});if(!feed.children.length)feed.append(el('p','social-empty','No public reviews yet. Be the first to share your take.'));}
        catch(error){if(ticket===generation){if(reset)feed.replaceChildren();feedback.textContent=error.message;}}
        finally{if(ticket===generation){busy=false;more.disabled=false;}}
    }
    document.querySelector('#refresh-community').addEventListener('click',()=>load(true));more.addEventListener('click',()=>load());
    window.addEventListener('backlog-review-change',event=>{if(event.detail?.id===game.id)load(true);});
    window.addEventListener('backlog-account-change',()=>{if(!account.loading)load(true);});account.ready.then(()=>load(true));
})();
