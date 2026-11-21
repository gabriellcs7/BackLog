/* Dicas com contexto para capas e fotos, disponíveis também pelo teclado. */
(() => {
    const ui=window.BacklogUI;if(!ui)return;
    const coverGames=new Map(window.BacklogGames.map(game=>[new URL(ui.href('imagens/capas/'+game.cover)).pathname,game]));
    const selector='.library-card,.discover-card,.home-review-game,.single-review-cover,.activity-game-cover,.community-avatar,.nav-profile-avatar';
    const tip=ui.element('div','backlog-rich-tooltip');tip.id='backlog-rich-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;
    const popover=typeof tip.showPopover==='function';if(popover)tip.setAttribute('popover','manual');document.body.append(tip);
    let active=null,timer=0;
    function hide(){clearTimeout(timer);if(active){const value=(active.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==tip.id).join(' ');if(value)active.setAttribute('aria-describedby',value);else active.removeAttribute('aria-describedby');}if(popover&&tip.matches(':popover-open'))tip.hidePopover();tip.hidden=true;active=null;}
    function position(){if(!active)return;const rect=active.getBoundingClientRect(),width=tip.offsetWidth,height=tip.offsetHeight;tip.style.left=Math.max(10,Math.min(innerWidth-width-10,rect.left+(rect.width-width)/2))+'px';tip.style.top=(rect.top-height-12>8?rect.top-height-12:Math.min(innerHeight-height-8,rect.bottom+12))+'px';}
    function show(node){
        if(node.closest('.nav-account-toggle,.account-dropdown'))return;
        hide();active=node;timer=setTimeout(()=>{
            if(!node.isConnected||active!==node)return;tip.replaceChildren();tip.style.transform='';
            const img=node.querySelector('img'),game=img?coverGames.get(new URL(img.src,document.baseURI).pathname):null;
            if(game){
                const image=ui.element('img','tooltip-game-cover');image.src=ui.href('imagens/capas/'+game.cover);image.alt='';
                const copy=ui.element('div','tooltip-copy');copy.append(ui.element('strong','',game.title),ui.element('span','',[game.year,...game.tags.slice(0,2)].filter(Boolean).join(' · ')));
                const status=window.Backlog?.getStatus(game.id)?.label;if(status)copy.append(ui.element('small','','Your status: '+status));
                const rating=window.BacklogReviews?.get(game.id)?.rating;if(rating!=null){const stars=ui.ratingStars(Number(rating));stars.title='Your rating';copy.append(stars);}
                tip.append(image,copy);
            }else{
                const container=node.closest('.home-review-author,.community-player,.connection-row,.activity-event,.nav-profile-link');
                const name=node.matches('.nav-profile-avatar')?window.BacklogAccount?.getState().profile.display_name:container?.querySelector('.player-link')?.textContent;
                if(!name){active=null;return;}
                const copy=ui.element('div','tooltip-copy');copy.append(ui.element('strong','',name),ui.element('span','','BackLog player'));tip.append(copy);
            }
            node.setAttribute('aria-describedby',[(node.getAttribute('aria-describedby')||''),tip.id].filter(Boolean).join(' '));tip.hidden=false;if(popover)tip.showPopover();position();
        },180);
    }
    document.addEventListener('pointerover',event=>{if(event.pointerType==='touch'||!matchMedia('(hover:hover)').matches)return;const node=event.target.closest(selector);if(node&&node!==active)show(node);});
    document.addEventListener('pointerout',event=>{if(active&&active.contains(event.target)&&!active.contains(event.relatedTarget))hide();});
    document.addEventListener('focusin',event=>{const node=event.target.closest(selector);if(node)show(node);});
    document.addEventListener('focusout',event=>{if(active?.contains(event.target))hide();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
    let frame=0;
    document.addEventListener('pointermove',event=>{
        if(!active||tip.hidden||frame||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
        const node=active,x=event.clientX,y=event.clientY;frame=requestAnimationFrame(()=>{frame=0;if(active!==node)return;const rect=node.getBoundingClientRect();const dx=Math.max(-1,Math.min(1,(x-rect.left)/rect.width*2-1)),dy=Math.max(-1,Math.min(1,(y-rect.top)/rect.height*2-1));tip.style.transform='perspective(600px) rotateY('+dx*4+'deg) rotateX('+(-dy*3)+'deg)';});
    },{passive:true});
    window.addEventListener('scroll',event=>{if(!tip.contains(event.target))hide();},true);window.addEventListener('resize',hide);
})();
