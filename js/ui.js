/* Elementos seguros para perfis, listas e reviews sociais. */
(() => {
    const element=(tag,className='',text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
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
    async function action(button,feedback,task){button.disabled=true;feedback.textContent='';try{return await task();}catch(error){feedback.textContent=error.message||'Something went wrong. Please try again.';}finally{button.disabled=false;}}
    function reviewOrdinal(number){
        const suffix=new Intl.PluralRules('en',{type:'ordinal'}).select(Number(number));
        return number+({one:'st',two:'nd',few:'rd',other:'th'}[suffix])+' review';
    }
    window.BacklogUI={element,game,gameCard,profileLink,avatar,href,action,reviewOrdinal,date:value=>new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(value))};
})();
