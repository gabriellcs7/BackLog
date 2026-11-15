(() => {
    'use strict';
    const {element:el,href}=window.BacklogUI;
    const account=window.BacklogAccount;
    const chart=document.getElementById('profile-ratings-chart');
    const feedback=document.getElementById('profile-ratings-feedback');
    let generation=0;

    async function render(profileId){
        const ticket=++generation;
        chart.replaceChildren();
        feedback.textContent='';
        try{
            let values;
            if(profileId==='local'){
                values=window.BacklogGames.map(game=>window.BacklogReviews.getDevice(game.id)?.rating);
            }else if(profileId===account.user?.id){
                values=account.getState().reviews.map(review=>review.rating);
            }else{
                const {data,error}=await account.client.from('reviews').select('rating').eq('user_id',profileId).not('rating','is',null);
                if(error)throw error;
                values=data.map(review=>review.rating);
            }
            if(ticket!==generation)return;
            const counts=Array(11).fill(0);
            let sum=0,total=0;
            for(const value of values){
                if(value==null||value==='')continue;
                const score=Number(value);
                if(score<0||score>5||!Number.isInteger(score*2))continue;
                counts[score*2]++;
                sum+=score;
                total++;
            }
            if(!total){feedback.textContent='No ratings yet.';return;}
            const summary=el('div','ratings-summary');
            summary.append(el('span','social-small',total+(total===1?' rating':' ratings')),el('strong','ratings-average',(sum/total).toFixed(1)+' / 5'));
            const histogram=el('ul','ratings-histogram');
            const first=counts[0]?0:1;
            histogram.style.setProperty('--rating-bins',11-first);
            histogram.setAttribute('aria-label','Rating distribution');
            const maximum=Math.max(...counts);
            for(let index=first;index<counts.length;index++){
                const count=counts[index];
                const description=(index/2)+' stars: '+count+(count===1?' rating':' ratings');
                const bin=el('li','ratings-bin');
                bin.title=description;
                bin.setAttribute('aria-label',description);
                const bar=el('span','ratings-bar');
                bar.style.setProperty('--bar-height',count/maximum*100+'%');
                const link=el('a','ratings-bin-link');
                link.href=href('view/logged-games.html?'+new URLSearchParams({id:profileId,rating:index/2}));
                link.setAttribute('aria-label',description+' · View games');
                link.title=description;
                bar.setAttribute('aria-hidden','true');
                link.append(bar);
                bin.append(link);
                histogram.append(bin);
            }
            const scale=el('div','ratings-scale');
            scale.setAttribute('aria-hidden','true');
            scale.append(el('span','','★'),el('span','','★★★★★'));
            chart.append(summary,histogram,scale);
        }catch(error){
            if(ticket===generation)feedback.textContent='Could not load ratings.';
        }
    }
    window.BacklogProfileRatings={render};
})();
