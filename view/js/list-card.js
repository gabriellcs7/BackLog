/* Listas no estilo Glass Folder Cards, com navegação real para listas e jogos. */
(() => {
    'use strict';
    const ui=window.BacklogUI,{element:el}=ui,ns='http://www.w3.org/2000/svg';
    let serial=0;
    function svgElement(tag,attributes){const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node;}
    const frontPath='M 22 75 H 116 C 139 75 142 108 165 108 H 318 Q 340 108 340 130 V 249 Q 340 272 317 272 H 23 Q 0 272 0 249 V 98 Q 0 75 22 75 Z';
    function shapes(){
        if(document.getElementById('backlog-folder-shapes'))return;
        const svg=svgElement('svg',{id:'backlog-folder-shapes',width:'0',height:'0','aria-hidden':'true',focusable:'false'});svg.style.position='absolute';
        const defs=svgElement('defs',{});
        for(const [id,d] of [['folder-back-clip','M .07 .13 H .43 C .49 .13 .49 0 .58 0 H .93 Q 1 0 1 .09 V .91 Q 1 1 .93 1 H .07 Q 0 1 0 .91 V .22 Q 0 .13 .07 .13 Z'],['folder-front-clip','M .065 .276 H .341 C .409 .276 .418 .397 .485 .397 H .935 Q 1 .397 1 .478 V .915 Q 1 1 .932 1 H .068 Q 0 1 0 .915 V .36 Q 0 .276 .065 .276 Z']]){const clip=svgElement('clipPath',{id,clipPathUnits:'objectBoundingBox'});clip.append(svgElement('path',{d}));defs.append(clip);}
        svg.append(defs);document.body.append(svg);
    }
    function listCard(list,profileId){
        shapes();
        const card=el('article','game-list-card glass-folder-card');
        const url=ui.href('view/list.html?'+new URLSearchParams({profile:profileId,id:list.id}));
        const games=list.gameIds.map(ui.game).filter(Boolean).slice(0,6),count=list.gameIds.length;
        const stage=el('div','glass-folder-stage'),back=el('div','glass-folder-back'),files=el('div','glass-folder-files');
        files.id='folder-files-'+(++serial);files.setAttribute('aria-hidden','true');
        if(games[0]?.banner){const art=el('img');art.src=ui.href('imagens/'+games[0].banner);art.alt='';art.loading='lazy';back.append(art);}
        for(const [index,game] of games.entries()){
            const link=el('a','glass-folder-file');link.href=ui.href('view/game.html?id='+encodeURIComponent(game.id));link.tabIndex=-1;link.setAttribute('aria-label',game.title);link.style.setProperty('--i',index);link.style.setProperty('--n',games.length);
            const image=el('img');image.src=ui.href('imagens/capas/'+game.cover);image.alt='';image.loading='lazy';image.draggable=false;link.append(image);
            if(list.is_ranked)link.append(el('span','glass-folder-rank',index+1));files.append(link);
        }
        const front=el('div','glass-folder-front');front.setAttribute('aria-hidden','true');
        const edge=svgElement('svg',{class:'glass-folder-edge',viewBox:'0 0 340 272',preserveAspectRatio:'none','aria-hidden':'true',focusable:'false'});edge.append(svgElement('path',{d:frontPath}));
        const toggle=el('button','glass-folder-toggle');toggle.type='button';toggle.setAttribute('aria-controls',files.id);toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Show games in '+list.name);toggle.disabled=!games.length;
        const copy=el('span','glass-folder-copy');copy.append(el('strong','',list.name),el('small','',count+(count===1?' game':' games')+(list.is_ranked?' · Ranked':'')+(list.is_public?' · Public':' · Private')));toggle.append(copy);
        const open=el('a','glass-folder-open','↗');open.href=url;open.setAttribute('aria-label','Open full list: '+list.name);open.title='Open full list';
        toggle.addEventListener('click',()=>{const expanded=card.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(expanded));files.setAttribute('aria-hidden',String(!expanded));toggle.setAttribute('aria-label',(expanded?'Hide':'Show')+' games in '+list.name);files.querySelectorAll('a').forEach(link=>link.tabIndex=expanded?0:-1);});
        card.addEventListener('keydown',event=>{if(event.key==='Escape'&&card.classList.contains('is-open')){event.preventDefault();card.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');files.setAttribute('aria-hidden','true');toggle.setAttribute('aria-label','Show games in '+list.name);files.querySelectorAll('a').forEach(link=>link.tabIndex=-1);toggle.focus();}});
        stage.append(back,files,front,edge,toggle,open);card.append(stage,window.BacklogListProgress.create(list.gameIds,{compact:true}));
        if(list.tags?.length)card.append(window.BacklogListTags.chips(list.tags));
        if(list.description)card.append(el('p','glass-folder-description',list.description));
        let frame=0;
        stage.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||(window.BacklogMotion?.matches??matchMedia('(prefers-reduced-motion:reduce)').matches)||frame)return;const x=event.clientX,y=event.clientY;frame=requestAnimationFrame(()=>{frame=0;if(!stage.isConnected)return;const rect=stage.getBoundingClientRect();stage.style.setProperty('--lean-x',((x-rect.left)/rect.width-.5)*6+'deg');stage.style.setProperty('--lean-y',-((y-rect.top)/rect.height-.5)*4+'deg');});});
        stage.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);frame=0;stage.style.setProperty('--lean-x','0deg');stage.style.setProperty('--lean-y','0deg');});
        return card;
    }
    window.BacklogListCard=listCard;
})();
