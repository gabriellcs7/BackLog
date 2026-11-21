/* Mantém o indicador entre renderizações para deslizar até a página ativa. */
(() => {
    'use strict';const group=document.querySelector('#catalog-pages');if(!group)return;
    group.classList.add('pill-pagination');const marker=document.createElement('span');marker.className='pagination-pill-marker';marker.setAttribute('aria-hidden','true');
    function update(){if(!group.contains(marker))group.append(marker);const selected=group.querySelector('[aria-current="page"]');if(group.hidden||!selected){marker.hidden=true;return;}marker.hidden=false;const box=group.getBoundingClientRect(),rect=selected.getBoundingClientRect();marker.style.width=rect.width+'px';marker.style.height=rect.height+'px';marker.style.transform=`translate(${rect.left-box.left-group.clientLeft}px,${rect.top-box.top-group.clientTop}px)`;}
    new MutationObserver(update).observe(group,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current']});
    if('ResizeObserver'in window)new ResizeObserver(update).observe(group);window.addEventListener('resize',update);document.fonts?.ready.then(update);update();
})();
