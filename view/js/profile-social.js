(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,$=id=>document.getElementById(id);
    let profile=null,stats=null,version=0,photoVersion=0,stagedPhoto,processing=false,connectionsVersion=0,connectionKind='followers',connectionOffset=0;
    const feedback=$('follow-feedback');
    function preview(value){$('photo-preview').replaceChildren(...ui.avatar(value).childNodes);}
    async function render(value,own){
        profile=value;const ticket=++version;$('profile-counts').hidden=true;$('follow-player').hidden=true;feedback.textContent='';
        if(value.id==='local'||!account.configured)return;
        try{const next=await api.social(value.id);if(ticket!==version)return;stats=next;
            for(const [kind,count] of [['followers',stats.follower_count],['following',stats.following_count]]){
                const formatted=Number(count).toLocaleString('en');
                $(kind+'-count').textContent=formatted;
                $('tab-'+kind+'-count').textContent=formatted;
            }
            $('profile-counts').hidden=false;
            const follow=$('follow-player');follow.hidden=own;follow.disabled=account.loading;follow.textContent=!account.user?'Sign in to follow':stats.is_following?'Following ✓':'Follow';follow.setAttribute('aria-pressed',String(stats.is_following));
        }catch(error){if(ticket===version)feedback.textContent='Followers are unavailable. '+error.message;}
    }
    $('follow-player').addEventListener('click',event=>{
        if(!account.user){location.href=ui.href('view/profile.html#account');return;}
        const current=profile;ui.action(event.currentTarget,feedback,async()=>{await api.follow(current.id,!stats.is_following);if(profile.id===current.id)await render(current,false);});
    });
    const dialog=$('connections-dialog'),list=$('connections-list'),more=$('more-connections');
    const connectionsFeedback=$('connections-feedback');
    const tabs=[...dialog.querySelectorAll('[data-connections]')];

    async function loadConnections(reset=false){
        const ticket=++connectionsVersion,owner=profile.id,kind=connectionKind;
        more.disabled=true;
        connectionsFeedback.textContent=reset?'Loading '+kind+'…':'';
        if(reset){
            connectionOffset=0;
            list.replaceChildren();
            more.hidden=true;
        }
        try{
            const items=await api.connections(owner,kind,connectionOffset);
            if(ticket!==connectionsVersion)return;
            for(const item of items){
                const row=ui.element('li');
                const link=ui.profileLink(item);
                link.classList.add('connection-row');
                const arrow=ui.element('span','connection-chevron','›');
                arrow.setAttribute('aria-hidden','true');
                link.replaceChildren(ui.avatar(item),ui.element('span','connection-name',item.display_name),arrow);
                row.append(link);
                list.append(row);
            }
            connectionOffset+=items.length;
            more.hidden=items.length<20;
            connectionsFeedback.textContent=connectionOffset?'':kind==='followers'?'No followers yet.':'Not following anyone yet.';
        }catch(error){
            if(ticket===connectionsVersion)connectionsFeedback.textContent=error.message||'Could not load connections.';
        }finally{
            if(ticket===connectionsVersion)more.disabled=false;
        }
    }

    function selectConnections(kind){
        connectionKind=kind;
        for(const tab of tabs)tab.setAttribute('aria-pressed',String(tab.dataset.connections===kind));
        loadConnections(true);
    }

    for(const kind of ['followers','following']){
        $('show-'+kind).addEventListener('click',()=>{
            $('connections-title').textContent=profile.display_name;
            $('connections-avatar').replaceChildren(ui.avatar(profile));
            dialog.showModal();
            selectConnections(kind);
            tabs.find(tab=>tab.dataset.connections===kind).focus();
        });
    }
    for(const tab of tabs)tab.addEventListener('click',()=>selectConnections(tab.dataset.connections));
    dialog.addEventListener('close',()=>{if(!dialog.open)connectionsVersion++;});
    more.addEventListener('click',()=>loadConnections());
    const photoStage=detail=>window.dispatchEvent(new CustomEvent('backlog-photo-stage',{detail}));
    async function acceptPhoto(file){
        if(!file)return false;const ticket=++photoVersion;processing=true;$('edit-profile-feedback').textContent='Preparing photo…';
        try{
            if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Choose a JPG, PNG or WebP photo smaller than 5 MB.');
            const image=await createImageBitmap(file);if(ticket!==photoVersion){image.close();return;}
            let blob;try{blob=await window.BacklogPhotoCrop.open(image);}finally{image.close();}
            if(ticket!==photoVersion)return;
            if(!blob){$('edit-profile-feedback').textContent='Photo adjustment cancelled.';return;}
            stagedPhoto=blob;const reader=new FileReader();reader.onload=()=>{if(ticket===photoVersion)preview({id:'local',display_name:profile.display_name,avatar_local:reader.result});};reader.readAsDataURL(blob);
            $('edit-profile-feedback').textContent='Photo ready. Save your profile to apply it.';
            photoStage({status:'ready',name:file.name,size:file.size});return true;
        }catch(error){if(ticket===photoVersion)$('edit-profile-feedback').textContent=error.message;}
        finally{if(ticket===photoVersion)processing=false;$('profile-photo').value='';}
    }
    $('profile-photo').addEventListener('change',()=>acceptPhoto($('profile-photo').files[0]));
    $('remove-photo').addEventListener('click',()=>{++photoVersion;processing=false;stagedPhoto=null;preview({display_name:profile.display_name});$('edit-profile-feedback').textContent='Photo removed. Save your profile to apply it.';photoStage({status:'reset'});});
    $('profile-dialog').addEventListener('close',()=>{++photoVersion;processing=false;stagedPhoto=undefined;document.querySelector('.photo-crop-dialog')?.close();});
    window.BacklogProfileSocial={render,acceptPhoto,edit(value){++photoVersion;processing=false;stagedPhoto=undefined;$('profile-photo').value='';preview(value);photoStage({status:'reset'});},photo(){if(processing)throw new Error('Wait for your photo to finish preparing.');return stagedPhoto;}};
})();
