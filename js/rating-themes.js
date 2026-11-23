/* Ícones temáticos específicos, mantendo sempre a escala de meia a cinco estrelas. */
(() => {
    'use strict';const themes={minecraft:'minecraft','grand-theft-auto-vi':'gta-wanted',cuphead:'cuphead','cuphead-the-delicious-last-course':'cuphead'},ui=window.BacklogUI;
    function theme(id){return themes[id]||null;}
    function noise(node){if(node.querySelector('.rating-tv-noise'))return;const ghost=document.createElement('span');ghost.className='rating-tv-noise-empty';ghost.setAttribute('aria-hidden','true');node.append(ghost);const grain=document.createElement('span');grain.className='rating-tv-noise';grain.setAttribute('aria-hidden','true');node.append(grain);}
    function apply(node,id,rating){const name=theme(id);if(!name)return node;node.dataset.ratingTheme=name;node.textContent='';node.style.setProperty('--rating-fill','0%');for(let index=0;index<5;index++){const star=document.createElement('span');star.className='rating-themed-star';star.setAttribute('aria-hidden','true');star.style.setProperty('--star-fill',Math.max(0,Math.min(1,Number(rating)-index))*100+'%');if(name==='cuphead')noise(star);node.append(star);}return node;}
    const requested=new URLSearchParams(location.search).get('id'),current=ui.game(requested);
    if(current&&theme(current.id)){for(const host of document.querySelectorAll('.review-rating,#review-saved-rating'))host.dataset.ratingTheme=theme(current.id);const summary=document.querySelector('.rating-preview .rating-star');if(summary){summary.dataset.ratingTheme=theme(current.id);summary.classList.add('rating-themed-star');summary.style.setProperty('--star-fill','100%');if(theme(current.id)==='cuphead')noise(summary);}if(theme(current.id)==='cuphead'){for(const node of document.querySelectorAll('.review-rating .rating-star-shape'))noise(node);}}
    window.BacklogRatingThemes=Object.freeze({theme,apply});
})();
