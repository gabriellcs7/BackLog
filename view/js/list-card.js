(() => {
    'use strict';
    const ui=window.BacklogUI,{element:el}=ui;

    function listCard(list,profileId){
        const card=el('article','game-list-card');
        const url=ui.href('view/list.html?'+new URLSearchParams({profile:profileId,id:list.id}));
        const covers=el('a','list-cover-stack');
        covers.href=url;
        covers.setAttribute('aria-label','Open '+list.name);
        for(const id of list.gameIds.slice(0,6)){
            const game=ui.game(id);
            if(!game)continue;
            const image=el('img');
            image.src=ui.href('imagens/capas/'+game.cover);
            image.alt=game.title;
            image.loading='lazy';
            covers.append(image);
        }
        if(!covers.children.length)covers.append(el('span','','No games yet'));
        const title=el('a','list-title-button',list.name);
        title.href=url;
        const count=list.gameIds.length;
        const meta=count+(count===1?' game':' games')+(list.is_ranked?' · Ranked':'')+(list.is_public?' · Public':' · Private');
        card.append(covers,title,el('span','social-small',meta));
        if(list.description)card.append(el('p','list-description',list.description));
        return card;
    }

    window.BacklogListCard=listCard;
})();
