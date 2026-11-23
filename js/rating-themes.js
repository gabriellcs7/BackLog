/* Símbolos por jogo, sem alterar os controles nativos ou a escala de notas. */
(() => {
    'use strict';
    const themes={minecraft:'minecraft','grand-theft-auto-vi':'gta-wanted',cuphead:'cuphead','cuphead-the-delicious-last-course':'cuphead'};
    Object.assign(themes,{"superhot":"superhot","superhot-mind-control-delete":"superhot"});
    const ui=window.BacklogUI;
    function theme(id){return themes[id]||null;}
    function layer(parent,className){const node=document.createElement('span');node.className=className;node.setAttribute('aria-hidden','true');parent.append(node);return node;}
    function decorate(node,name){
        if(name==='cuphead'&&!node.querySelector('.rating-tv-noise')){layer(node,'rating-tv-noise-empty');layer(node,'rating-tv-noise');}
        if(name==='superhot'&&!node.querySelector('.rating-fragments')){const pieces=layer(node,'rating-fragments');for(let i=0;i<5;i++){const piece=layer(pieces,'rating-fragment');piece.style.setProperty('--piece',i);}}
        if(name==='uncharted'&&!node.querySelector('.rating-reflection'))layer(node,'rating-reflection');
    }
    function apply(node,id,rating){
        const name=theme(id);if(!name)return node;node.dataset.ratingTheme=name;node.textContent='';node.style.setProperty('--rating-fill','0%');
        for(let index=0;index<5;index++){const star=layer(node,'rating-themed-star');star.style.setProperty('--star-fill',Math.max(0,Math.min(1,Number(rating)-index))*100+'%');star.style.setProperty('--star-index',index);decorate(star,name);}return node;
    }
    const requested=new URLSearchParams(location.search).get('id'),current=ui.game(requested),name=theme(current?.id);
    if(current&&name){
        for(const host of document.querySelectorAll('.review-rating,#review-saved-rating'))host.dataset.ratingTheme=name;
        const summary=document.querySelector('.rating-preview .rating-star');if(summary){summary.dataset.ratingTheme=name;summary.classList.add('rating-themed-star');summary.style.setProperty('--star-fill','100%');decorate(summary,name);}
        const field=document.querySelector('.review-rating');if(field){
            [...field.querySelectorAll('.rating-star-shape')].forEach((node,index)=>{node.style.setProperty('--star-index',index);decorate(node,name);});
            let timer;field.addEventListener('change',event=>{
                if(event.target.name!=='review-rating'||(window.BacklogMotion?.matches??matchMedia('(prefers-reduced-motion:reduce)').matches))return;
                clearTimeout(timer);field.classList.remove('rating-effect-active');void field.offsetWidth;field.classList.add('rating-effect-active');timer=setTimeout(()=>field.classList.remove('rating-effect-active'),750);
            });
        }
    }
    window.BacklogRatingThemes=Object.freeze({theme,apply});
})();
