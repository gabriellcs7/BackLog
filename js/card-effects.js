/* Luz suave nos cards, sem alterar os realces de status das capas. */
(() => {
    const selector='.home-review-card,.game-list-card,.community-review,.player-search-card';
    function scan(root=document){if(root.matches?.(selector))root.classList.add('backlog-spotlight');root.querySelectorAll?.(selector).forEach(node=>node.classList.add('backlog-spotlight'));}
    scan();new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)scan(node);}).observe(document.body,{childList:true,subtree:true});
    const pointer=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');let frame=0,pending;
    document.addEventListener('pointermove',event=>{
        if(!pointer.matches||(window.BacklogMotion?.matches??reduce.matches))return;
        const card=event.target.closest(selector);if(!card)return;pending={card,x:event.clientX,y:event.clientY};if(frame)return;
        frame=requestAnimationFrame(()=>{frame=0;const {card,x,y}=pending;if(!card.isConnected)return;const rect=card.getBoundingClientRect();card.style.setProperty('--spot-x',x-rect.left+'px');card.style.setProperty('--spot-y',y-rect.top+'px');});
    },{passive:true});
})();
