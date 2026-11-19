/* Distribuição real das notas de todas as contas para o jogo atual. */
(() => {
    'use strict';
    const {element:el}=window.BacklogUI;
    const account=window.BacklogAccount,api=window.BacklogCommunity;
    const requested=new URLSearchParams(location.search).get('id');
    const game=window.BacklogGames.find(game=>game.id===requested)||window.BacklogGames[0];
    const chart=document.querySelector('#game-ratings-chart');
    const feedback=document.querySelector('#game-ratings-feedback');
    const retry=document.querySelector('#retry-game-ratings');
    const preview=document.querySelector('.rating-preview');
    let generation=0;
    function emptyPreview(){
        preview.querySelector('strong').textContent='Not rated yet';
        preview.querySelector('div>span').textContent='Community ratings';
    }
    function render({counts,total,average}){
        const summary=el('div','ratings-summary');
        summary.append(el('span','social-small',total+(total===1?' rating':' ratings')),el('strong','ratings-average',total?average.toFixed(1)+' / 5':'—'));
        const histogram=el('ul','ratings-histogram');
        histogram.setAttribute('aria-label','Community rating distribution for '+game.title);
        const maximum=Math.max(1,...counts);
        counts.forEach((count,index)=>{
            const description=((index+1)/2)+' stars: '+count+(count===1?' rating':' ratings');
            const bin=el('li','ratings-bin');
            const bar=el('span','ratings-bar');
            bin.title=description;bin.tabIndex=0;bin.setAttribute('aria-label',description);
            bar.setAttribute('aria-hidden','true');
            bar.style.setProperty('--bar-height',count/maximum*100+'%');
            bin.append(bar);histogram.append(bin);
        });
        const scale=el('div','ratings-scale');scale.setAttribute('aria-hidden','true');
        scale.append(el('span','','★'),el('span','','★★★★★'));
        chart.replaceChildren(summary,histogram,scale);
        feedback.textContent=total?'':'No community ratings yet. Be the first to rate this game.';
        if(total){preview.querySelector('strong').textContent=average.toFixed(1)+' / 5';preview.querySelector('div>span').textContent=total+(total===1?' community rating':' community ratings');}
        else emptyPreview();
    }
    async function load(){
        const ticket=++generation;chart.setAttribute('aria-busy','true');retry.hidden=true;feedback.textContent='Loading community ratings…';
        try{
            await account.ready;
            if(ticket!==generation)return;
            if(!account.configured){render({counts:Array(10).fill(0),total:0,average:null});feedback.textContent='Connect community accounts to see ratings from other players.';return;}
            const distribution=await api.ratingDistribution(game.id);
            if(ticket===generation)render(distribution);
        }catch(error){
            if(ticket===generation){chart.replaceChildren();emptyPreview();feedback.textContent='Could not load community ratings. Please try again.';retry.hidden=false;}
        }finally{if(ticket===generation)chart.setAttribute('aria-busy','false');}
    }
    retry.addEventListener('click',load);
    document.querySelector('#refresh-community')?.addEventListener('click',load);
    window.addEventListener('backlog-account-change',load);
    window.addEventListener('backlog-review-change',load);
    window.addEventListener('pageshow',event=>{if(event.persisted)load();});
    load();
})();
