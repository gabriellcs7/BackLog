(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,{element:el}=ui;
    function card(review){
        const game=ui.game(review.game_id);if(!game)return null;
        const article=el('article','home-review-card');article.dataset.review=review.id;
        const url=ui.href('view/game.html?id='+encodeURIComponent(game.id)+'#review-'+review.id);
        const link=el('a','home-review-game');link.href=url;const cover=el('img');cover.src=ui.href('imagens/capas/'+game.cover);cover.alt='';cover.loading='lazy';
        const title=el('div');title.append(el('h3','',game.title),el('p','social-rating',review.rating===null?'Written review':review.rating+' / 5 ★'));link.append(cover,title);
        const author=el('div','home-review-author'),profile={id:review.user_id,display_name:review.display_name,avatar_path:review.avatar_path};author.append(ui.avatar(profile),ui.profileLink(profile));
        const date=el('time','social-small',ui.date(review.created_at));date.dateTime=review.created_at;
        const actions=el('div','home-review-actions'),message=el('p','social-feedback');message.setAttribute('role','status');
        const like=el('button','social-button social-button-quiet');like.type='button';
        function refresh(){like.textContent=(review.liked?'♥':'♡')+' '+review.like_count;like.setAttribute('aria-label',(review.liked?'Unlike':'Like')+' review by '+review.display_name);like.setAttribute('aria-pressed',String(review.liked));like.disabled=!account.user||account.user.id===review.user_id;like.title=!account.user?'Sign in to like a review':account.user.id===review.user_id?'This is your review':'';}
        refresh();like.addEventListener('click',()=>ui.action(like,message,async()=>{const next=!review.liked;review.like_count=await api.like(review.id,next);review.liked=next;refresh();window.dispatchEvent(new Event('backlog-likes-change'));}));
        const read=el('a','','Read review · '+review.comment_count+' comments ↗');read.href=url;actions.append(like,read);
        article.append(link,author,el('p','home-review-copy',review.text),date,actions,message);return article;
    }
    for(const kind of ['popular','following']){
        const feed=document.getElementById(kind+'-reviews'),feedback=document.getElementById(kind+'-feedback'),more=document.getElementById('more-'+kind);
        let offset=0,generation=0,busy=false,seen=new Set();
        async function load(reset=false){
            if(busy&&!reset)return;const ticket=++generation;busy=true;more.disabled=true;feedback.textContent='';
            if(reset){offset=0;seen=new Set();feed.replaceChildren(el('p','social-empty','Loading reviews…'));}
            try{
                if(!account.configured){feed.replaceChildren(el('p','social-empty','Connect online accounts to discover community reviews.'));more.hidden=true;return;}
                if(kind==='following'&&!account.user){const empty=el('p','social-empty','Sign in to see the latest reviews from players you follow. '),login=el('a','player-link','Sign in ↗');login.href=ui.href('view/profile.html#account');empty.append(login);feed.replaceChildren(empty);more.hidden=true;return;}
                const items=await api.home(kind,offset);if(ticket!==generation)return;if(reset)feed.replaceChildren();
                for(const item of items){if(!seen.has(item.id)){seen.add(item.id);const node=card(item);if(node)feed.append(node);}}offset+=items.length;more.hidden=kind==='popular'||items.length<6;
                if(!feed.children.length)feed.append(el('p','social-empty',kind==='popular'?'No popular reviews yet. Reviews with likes will appear here.':'No reviews here yet. Follow players from their profiles to see their latest reviews.'));
            }catch(error){if(ticket===generation){if(reset)feed.replaceChildren();more.hidden=true;feedback.textContent='Could not load reviews. '+error.message;const retry=el('button','social-button','Try again');retry.type='button';retry.addEventListener('click',()=>load(true));feed.append(retry);}}
            finally{if(ticket===generation){busy=false;more.disabled=false;}}
        }
        window.addEventListener('backlog-likes-change',()=>{if(kind==='popular')load(true);});
        more.addEventListener('click',()=>load());account.ready.then(()=>load(true));window.addEventListener('backlog-account-change',()=>{if(!account.loading)load(true);});
    }
})();
