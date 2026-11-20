/* Indicador deslizante para os filtros existentes, preservando suas ações. */
(() => {
    const groups=new Set(),selector='.filter-tabs,.activity-tabs,.connections-tabs,.command-search-tabs,.section-tabs';
    function enhance(group){
        if(group.dataset.animatedTabs)return;group.dataset.animatedTabs='true';group.classList.add('backlog-animated-tabs');
        if(group.matches('.section-tabs'))group.classList.add('backlog-tabs-underline');
        const marker=document.createElement('span');marker.className='backlog-tab-marker';marker.setAttribute('aria-hidden','true');group.append(marker);
        function update(){
            const selected=group.querySelector('[aria-pressed="true"],[aria-selected="true"],.selected');
            if(!selected||!group.getClientRects().length){marker.hidden=true;return;}
            marker.hidden=false;const box=group.getBoundingClientRect(),tab=selected.getBoundingClientRect();
            marker.style.width=tab.width+'px';marker.style.height=tab.height+'px';marker.style.transform='translate('+ (tab.left-box.left+group.scrollLeft-group.clientLeft)+'px,'+(tab.top-box.top+group.scrollTop-group.clientTop)+'px)';
        }
        group.addEventListener('click',event=>{
            const link=event.target.closest('a[href^="#"]');if(link&&group.matches('.section-tabs')){group.querySelectorAll('a').forEach(node=>node.classList.toggle('selected',node===link));}
            requestAnimationFrame(update);
        });
        new MutationObserver(update).observe(group,{subtree:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','class'],childList:true});
        if('ResizeObserver'in window)new ResizeObserver(update).observe(group);
        document.addEventListener('toggle',update,true);window.addEventListener('resize',update);groups.add(update);update();
    }
    function scan(root=document){if(root.matches?.(selector))enhance(root);root.querySelectorAll?.(selector).forEach(enhance);}
    scan();new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)if(node instanceof Element)scan(node);}).observe(document.body,{childList:true,subtree:true});
    document.fonts?.ready.then(()=>groups.forEach(update=>update()));
})();
