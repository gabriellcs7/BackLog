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
            $('show-followers').textContent=stats.follower_count+(Number(stats.follower_count)===1?' follower':' followers');$('show-following').textContent=stats.following_count+' following';$('profile-counts').hidden=false;
            const follow=$('follow-player');follow.hidden=own;follow.disabled=account.loading;follow.textContent=!account.user?'Sign in to follow':stats.is_following?'Following ✓':'Follow';follow.setAttribute('aria-pressed',String(stats.is_following));
        }catch(error){if(ticket===version)feedback.textContent='Followers are unavailable. '+error.message;}
    }
    $('follow-player').addEventListener('click',event=>{
        if(!account.user){location.href=ui.href('view/profile.html#account');return;}
        const current=profile;ui.action(event.currentTarget,feedback,async()=>{await api.follow(current.id,!stats.is_following);if(profile.id===current.id)await render(current,false);});
    });
    async function loadConnections(reset=false){
        const ticket=++connectionsVersion,owner=profile.id,more=$('more-connections');more.disabled=true;$('connections-feedback').textContent='';
        if(reset){connectionOffset=0;$('connections-list').replaceChildren();}
        try{const items=await api.connections(owner,connectionKind,connectionOffset);if(ticket!==connectionsVersion)return;
            connectionOffset+=items.length;for(const item of items){const row=ui.element('div','connection-row');row.append(ui.avatar(item),ui.profileLink(item));$('connections-list').append(row);}
            if(!connectionOffset)$('connections-list').append(ui.element('p','social-empty','No '+connectionKind+' yet.'));more.hidden=items.length<20;
        }catch(error){if(ticket===connectionsVersion)$('connections-feedback').textContent=error.message;}finally{if(ticket===connectionsVersion)more.disabled=false;}
    }
    for(const kind of ['followers','following'])$('show-'+kind).addEventListener('click',()=>{connectionKind=kind;$('connections-title').textContent=kind==='followers'?'Followers':'Following';$('connections-dialog').showModal();loadConnections(true);});
    $('more-connections').addEventListener('click',()=>loadConnections());
    $('profile-photo').addEventListener('change',async()=>{
        const file=$('profile-photo').files[0];if(!file)return;const ticket=++photoVersion;processing=true;$('edit-profile-feedback').textContent='Preparing photo…';
        try{
            if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Choose a JPG, PNG or WebP photo smaller than 5 MB.');
            const image=await createImageBitmap(file);if(ticket!==photoVersion){image.close();return;}
            const canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;const context=canvas.getContext('2d'),side=Math.min(image.width,image.height);
            context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,384,384);image.close();
            const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));if(ticket!==photoVersion)return;
            if(!blob||blob.type!=='image/webp'||blob.size>524288)throw new Error('Could not prepare this photo. Try another image.');
            stagedPhoto=blob;const reader=new FileReader();reader.onload=()=>{if(ticket===photoVersion)preview({id:'local',display_name:profile.display_name,avatar_local:reader.result});};reader.readAsDataURL(blob);
            $('edit-profile-feedback').textContent='Photo ready. Save your profile to apply it.';
        }catch(error){if(ticket===photoVersion)$('edit-profile-feedback').textContent=error.message;}
        finally{if(ticket===photoVersion)processing=false;$('profile-photo').value='';}
    });
    $('remove-photo').addEventListener('click',()=>{++photoVersion;processing=false;stagedPhoto=null;preview({display_name:profile.display_name});$('edit-profile-feedback').textContent='Photo removed. Save your profile to apply it.';});
    window.BacklogProfileSocial={render,edit(value){++photoVersion;processing=false;stagedPhoto=undefined;$('profile-photo').value='';preview(value);},photo(){if(processing)throw new Error('Wait for your photo to finish preparing.');return stagedPhoto;}};
})();
