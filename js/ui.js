/* Elementos seguros para perfis, listas e reviews sociais. */
(() => {
    const element=(tag,className='',text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=window.BacklogReviewText&&String(text).startsWith(window.BacklogReviewText.marker)?window.BacklogReviewText.plain(text):String(text);return node;};
    const base=new URL('../',document.currentScript.src);
    const href=path=>new URL(path,base).href;
    const game=id=>window.BacklogGames.find(game=>game.id===id);
    function gameCard(id){const item=game(id);if(!item)return element('span');const a=element('a','library-card');a.href=href('view/game.html?id='+encodeURIComponent(id));const art=element('div','library-art'),img=element('img');img.src=href('imagens/capas/'+item.cover);img.alt='';img.loading='lazy';art.append(img);a.append(art,element('h3','',item.title));return a;}
    function profileLink(profile){const a=element('a','player-link',profile?.display_name||'Player');a.href=href('view/profile.html?id='+encodeURIComponent(profile.id));return a;}
    function avatar(profile,className='community-avatar'){
        const node=element('span',className,(profile?.display_name||'Player').slice(0,1).toUpperCase());node.setAttribute('aria-hidden','true');
        let src=null;
        if(profile?.id==='local' && /^data:image\/webp;base64,/.test(profile.avatar_local||''))src=profile.avatar_local;
        else if(profile?.avatar_path && new RegExp('^'+profile.id+'/[0-9a-f-]+\\.webp$').test(profile.avatar_path) && window.BacklogConfig?.supabaseUrl)src=window.BacklogConfig.supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/public/avatars/'+profile.avatar_path;
        if(src){const img=element('img');img.src=src;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.remove(),{once:true});node.append(img);}
        return node;
    }
    function loadingCards(label='Loading…',count=3){
        const group=element('div','loading-card-group');group.setAttribute('role','status');group.setAttribute('aria-label',label);
        group.append(element('span','visually-hidden',label));
        for(let i=0;i<count;i++){
            const card=element('div','loading-card');card.setAttribute('aria-hidden','true');
            const art=element('span','loading-card-art'),copy=element('span','loading-card-copy');
            copy.append(element('span','loading-card-line'),element('span','loading-card-line loading-card-line-short'),element('span','loading-card-line'));
            card.append(art,copy);group.append(card);
        }
        return group;
    }
    async function action(button,feedback,task){button.disabled=true;feedback.textContent='';try{return await task();}catch(error){feedback.textContent=error.message||'Something went wrong. Please try again.';}finally{button.disabled=false;}}
    function reviewOrdinal(number){
        const suffix=new Intl.PluralRules('en',{type:'ordinal'}).select(Number(number));
        return number+({one:'st',two:'nd',few:'rd',other:'th'}[suffix])+' review';
    }
    function reviewHref(key,value){
        return href('view/review.html?'+new URLSearchParams({[key]:value}));
    }
    function ratingStars(rating){
        const stars=element('span','game-rating-stars','★★★★★');
        stars.setAttribute('role','img');
        stars.setAttribute('aria-label',rating+' out of 5 stars');
        stars.title=rating+' / 5';
        stars.style.setProperty('--rating-fill',Number(rating)*20+'%');
        return stars;
    }

    // A navegação usa sempre a identidade da conta local, nunca a do perfil visitado.
    const navProfile=document.querySelector('#navigation a[href$="profile.html"]');
    const account=window.BacklogAccount;
    function updateNavAvatar(){
        if(!navProfile||!account)return;
        navProfile.querySelector('.nav-profile-avatar')?.remove();
        navProfile.classList.add('nav-profile-link');
        navProfile.prepend(avatar(account.getState().profile,'nav-profile-avatar'));
    }
    updateNavAvatar();
    account?.ready.then(updateNavAvatar);
    window.addEventListener('backlog-account-change',updateNavAvatar);

    window.BacklogUI={loadingCards,element,game,gameCard,ratingStars,profileLink,avatar,href,reviewHref,action,reviewOrdinal,date:value=>new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(value))};
})();
