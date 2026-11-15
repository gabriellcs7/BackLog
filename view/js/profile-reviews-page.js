(() => {
    'use strict';
    const account=window.BacklogAccount,ui=window.BacklogUI,api=window.BacklogProfileReviews;
    const target=new URLSearchParams(location.search).get('id');
    const grid=document.querySelector('#all-profile-reviews');
    const title=document.querySelector('#all-reviews-title');
    const feedback=document.querySelector('#all-reviews-feedback');
    const more=document.querySelector('#more-all-reviews');
    const profileLink=document.querySelector('#reviews-profile-link');
    const pageSize=12;
    let offset=0,generation=0,busy=false;

    async function load(reset=false){
        if(busy&&!reset)return;
        const ticket=++generation;
        const profileId=target||account.user?.id||'local';
        busy=true;
        more.disabled=true;
        feedback.textContent='Loading reviews…';
        if(reset){
            offset=0;
            grid.replaceChildren();
            more.hidden=true;
            title.textContent='Reviews';
        }
        try{
            if(reset){
                profileLink.href=profileId==='local'?'profile.html':'profile.html?id='+encodeURIComponent(profileId);
                if(profileId!=='local'){
                    const player=await account.getProfile(profileId);
                    if(ticket!==generation)return;
                    if(!player.profile)throw new Error('Profile not found.');
                    title.textContent=player.profile.display_name+'\'s reviews';
                    document.title=title.textContent+' · BackLog';
                }
            }
            const reviews=await api.get(profileId,offset,pageSize+1);
            if(ticket!==generation)return;
            const page=reviews.slice(0,pageSize);
            grid.append(...page.map(api.card).filter(Boolean));
            if(!offset&&!page.length)grid.append(ui.element('p','social-empty','No reviews yet.'));
            offset+=page.length;
            more.hidden=reviews.length<=pageSize;
            feedback.textContent='';
        }catch(error){
            if(ticket===generation)feedback.textContent=error.message||'Could not load reviews.';
        }finally{
            if(ticket===generation){busy=false;more.disabled=false;}
        }
    }

    more.addEventListener('click',()=>load());
    account.ready.then(()=>load(true));
    window.addEventListener('backlog-account-change',()=>{
        if(!account.loading)load(true);
    });
})();
