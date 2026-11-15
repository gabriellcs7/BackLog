(() => {
    'use strict';
    const account=window.BacklogAccount,ui=window.BacklogUI,{element:el}=ui;
    const target=new URLSearchParams(location.search).get('id');
    const grid=document.querySelector('#all-profile-lists');
    const title=document.querySelector('#all-lists-title');
    const feedback=document.querySelector('#all-lists-feedback');
    const back=document.querySelector('#lists-profile-link');
    let generation=0;

    async function render(){
        const ticket=++generation;
        const profileId=target||account.user?.id||'local';
        const own=profileId===(account.user?.id||'local');
        grid.replaceChildren();
        title.textContent='Game lists';
        document.title='Game lists · BackLog';
        feedback.textContent='Loading lists…';
        try{
            if(profileId==='local'&&!own)throw new Error('Sign out to see your lists saved on this device.');
            const player=own?account.getState():await account.getProfile(profileId);
            if(ticket!==generation)return;
            if(!player.profile)throw new Error('Profile not found.');
            const profileUrl=new URL(ui.href('view/profile.html'));
            if(profileId!=='local')profileUrl.searchParams.set('id',profileId);
            profileUrl.hash='profile-list-section';
            back.href=profileUrl.href;
            title.textContent=own?'Your game lists':player.profile.display_name+'’s game lists';
            document.title=title.textContent+' · BackLog';
            for(const list of player.lists){
                const card=window.BacklogListCard(list,profileId);
                if(own){
                    const actions=el('div','social-actions');
                    for(const [operation,label] of [['edit','Edit'],['delete','Delete']]){
                        const url=new URL(profileUrl);
                        url.searchParams.set(operation+'-list',list.id);
                        const link=el('a','social-button social-button-quiet'+(operation==='delete'?' social-danger':''),label);
                        link.href=url.href;
                        link.setAttribute('aria-label',label+' '+list.name);
                        actions.append(link);
                    }
                    card.append(actions);
                }
                grid.append(card);
            }
            feedback.textContent='';
            if(!grid.children.length)grid.append(el('p','social-empty',own?'No lists yet.':'No public lists yet.'));
        }catch(error){
            if(ticket===generation)feedback.textContent=error.message||'Could not load lists.';
        }
    }

    account.ready.then(render);
    window.addEventListener('backlog-account-change',()=>{
        if(!account.loading)render();
    });
})();
