/* Mural contínuo com apenas três reviews únicas; as demais cópias são visuais. */
(() => {
    'use strict';
    const root=document.querySelector('#popular-reviews');
    const button=document.querySelector('#pause-review-wall');
    if(!root||!button)return;
    const device=matchMedia('(prefers-reduced-motion: reduce)');
    let columns=[],resize=null,frame=0,previous=0,visible=false,paused=false,offset=0,speed=30;
    const reduced=()=>window.BacklogMotion?.matches ?? device.matches;
    function cancel(){cancelAnimationFrame(frame);frame=0;previous=0;}
    function schedule(){if(!frame&&visible&&!document.hidden&&!paused&&!reduced()&&columns.length)frame=requestAnimationFrame(animate);}
    function animate(time){
        frame=0;const dt=Math.min((time-(previous||time-16))/1000,.06);previous=time;
        const target=columns.some(state=>state.hover&&state.column.getClientRects().length)?15:30;
        speed+=(target-speed)*(1-Math.exp(-dt*8));
        const distance=columns.find(state=>state.distance>0)?.distance;
        if(distance)offset=(offset+speed*dt)%distance;
        for(const state of columns){
            if(!state.distance||!state.column.getClientRects().length)continue;
            state.track.style.transform='translateY(-'+offset+'px)';
        }
        schedule();
    }
    function measure(){
        // Mesma altura e mesma fase: reviews diferentes permanecem lado a lado.
        root.style.removeProperty('--review-wall-card-height');
        if(!paused&&!reduced()){
            const cards=[...root.querySelectorAll('.home-review-card')].filter(card=>card.getClientRects().length);
            const height=Math.max(0,...cards.map(card=>card.offsetHeight));
            if(height)root.style.setProperty('--review-wall-card-height',height+'px');
        }
        for(const state of columns)state.distance=state.group.offsetHeight+20;
        const distance=columns.find(state=>state.distance>0)?.distance;
        if(distance)offset%=distance;
        schedule();
    }
    function configure(){
        cancel();const simple=paused||reduced();
        root.classList.toggle('is-static',simple&&columns.length>0);
        root.classList.toggle('is-animated',!simple&&columns.length>0);
        button.hidden=!columns.length||reduced();
        button.textContent=paused?'Resume animation':'Pause animation';
        button.setAttribute('aria-pressed',String(paused));
        measure();schedule();
    }
    function clear(){cancel();resize?.disconnect();resize=null;columns=[];offset=0;speed=30;root.style.removeProperty('--review-wall-card-height');button.hidden=true;root.classList.remove('is-static','is-animated');}
    function render(reviews,createCard){
        clear();root.replaceChildren();
        for(let index=0;index<3;index++){
            const column=document.createElement('div');column.className='review-wall-column';
            const track=document.createElement('div');track.className='review-wall-track';
            let first=null;
            for(let repeat=0;repeat<2;repeat++){
                const group=document.createElement('div');group.className='review-wall-group';
                const duplicate=index>0||repeat>0;
                if(duplicate)group.setAttribute('aria-hidden','true');
                for(let item=0;item<reviews.length;item++){
                    const review=reviews[(item+index)%reviews.length];
                    const card=createCard(review);if(!card)continue;
                    if(duplicate)card.querySelectorAll('a,button').forEach(control=>control.tabIndex=-1);
                    group.append(card);
                }
                // Evita transferir foco para cópias decorativas durante cliques com mouse.
                if(duplicate)group.addEventListener('mousedown',event=>event.preventDefault());
                if(!first)first=group;
                track.append(group);
            }
            column.append(track);root.append(column);
            const state={column,track,group:first,speed:[30,50,35][index],current:[30,50,35][index],offset:0,distance:0,hover:false};
            column.addEventListener('pointerenter',()=>{state.hover=true;});
            column.addEventListener('pointerleave',()=>{state.hover=false;});
            columns.push(state);
        }
        if('ResizeObserver' in window){resize=new ResizeObserver(measure);columns.forEach(state=>resize.observe(state.group));}
        configure();
    }
    if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)schedule();else cancel();}).observe(root);
    else visible=true;
    button.addEventListener('click',()=>{paused=!paused;configure();});
    root.addEventListener('focusin',event=>{
        if(!paused&&!reduced()&&event.target.matches(':focus-visible')){paused=true;configure();}
    });
    document.addEventListener('visibilitychange',()=>{cancel();schedule();});
    window.addEventListener('resize',measure);
    device.addEventListener('change',configure);
    document.addEventListener('DOMContentLoaded',()=>{window.BacklogMotion?.addEventListener('change',configure);configure();});
    window.BacklogReviewWall={render,clear};
})();
