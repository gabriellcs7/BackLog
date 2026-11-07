/* Elementos seguros para perfis, listas e reviews sociais. */
(() => {
    const element=(tag,className='',text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=String(text);return node;};
    const game=id=>window.BacklogGames.find(game=>game.id===id);
    function gameCard(id){const item=game(id);if(!item)return element('span');const a=element('a','library-card');a.href='game.html?id='+encodeURIComponent(id);const art=element('div','library-art'),img=element('img');img.src='../imagens/capas/'+item.cover;img.alt='';img.loading='lazy';art.append(img);a.append(art,element('h3','',item.title));return a;}
    function profileLink(profile){const a=element('a','player-link',profile?.display_name||'Player');a.href='profile.html?id='+encodeURIComponent(profile.id);return a;}
    async function action(button,feedback,task){button.disabled=true;feedback.textContent='';try{return await task();}catch(error){feedback.textContent=error.message||'Something went wrong. Please try again.';}finally{button.disabled=false;}}
    window.BacklogUI={element,game,gameCard,profileLink,action,date:value=>new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(value))};
})();
