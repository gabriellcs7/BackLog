/* Edição e prévias no próprio painel de Configurações. */
(() => {
    'use strict';const account=window.BacklogAccount,ui=window.BacklogUI,games=window.BacklogGames,$=s=>document.querySelector(s),el=ui.element,game=ui.game,action=ui.action;
    const button=(text,fn,cls='social-button')=>{const node=el('button',cls,text);node.type='button';node.addEventListener('click',fn);return node;};
    let profile=account.getState().profile,photoVersion=0,stagedPhoto,processing=false;
    const note=text=>{$('#settings-account-feedback').textContent=text;};
    const render=()=>{const state=account.getState(),p=state.profile;profile=p;setBannerImage($('#settings-preview-banner'),game(p.banner_game_id));$('#settings-preview-avatar').replaceChildren(ui.avatar(p));$('#settings-preview-name').textContent=p.display_name;$('#settings-preview-bio').textContent=p.bio||'';$('#settings-preview-details').textContent=[p.location,p.gaming_platform,p.website].filter(Boolean).join(' · ');$('#settings-preview-favorites').replaceChildren(...state.favorites.map(id=>{const item=game(id);if(!item)return el('span');const img=el('img');img.src=ui.href('imagens/capas/'+item.cover);img.alt=item.title;return img;}));for(const b of document.querySelectorAll('[data-edit-profile]'))b.disabled=account.loading;};
    function preview(value){$('#photo-preview').replaceChildren(...ui.avatar(value).childNodes);}
    function setBannerImage(image,item){image.hidden=!item?.banner;if(image.hidden)image.removeAttribute('src');else{image.src=ui.href('imagens/'+item.banner);image.style.objectPosition=item.bannerPosition||'center';}}
    function openProfileEditor(){if(account.loading)return;profile=account.getState().profile;$('#display-name').value=profile.display_name;$('#profile-bio-input').value=profile.bio||'';$('#profile-location-input').value=profile.location||'';$('#profile-website-input').value=profile.website||'';$('#profile-platform-input').value=profile.gaming_platform||'';$('#edit-profile-feedback').textContent='';window.BacklogProfileSocial.edit(profile);$('#profile-dialog').showModal();}
    $('#profile-form').addEventListener('submit',event=>{event.preventDefault();action(event.submitter,$('#edit-profile-feedback'),async()=>{await account.saveProfile($('#display-name').value,$('#profile-bio-input').value,window.BacklogProfileSocial.photo(),{location:$('#profile-location-input').value,website:$('#profile-website-input').value,platform:$('#profile-platform-input').value});$('#profile-dialog').close();note('Profile saved.');render();});});
    const photoStage=detail=>window.dispatchEvent(new CustomEvent('backlog-photo-stage',{detail}));
    async function acceptPhoto(file){
        if(!file)return false;const ticket=++photoVersion;processing=true;$('#edit-profile-feedback').textContent='Preparing photo…';
        try{
            if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Choose a JPG, PNG or WebP photo smaller than 5 MB.');
            const image=await createImageBitmap(file);if(ticket!==photoVersion){image.close();return;}
            let blob;try{blob=await window.BacklogPhotoCrop.open(image);}finally{image.close();}
            if(ticket!==photoVersion)return;
            if(!blob){$('#edit-profile-feedback').textContent='Photo adjustment cancelled.';return;}
            stagedPhoto=blob;const reader=new FileReader();reader.onload=()=>{if(ticket===photoVersion)preview({id:'local',display_name:profile.display_name,avatar_local:reader.result});};reader.readAsDataURL(blob);
            $('#edit-profile-feedback').textContent='Photo ready. Save your profile to apply it.';
            photoStage({status:'ready',name:file.name,size:file.size});return true;
        }catch(error){if(ticket===photoVersion)$('#edit-profile-feedback').textContent=error.message;}
        finally{if(ticket===photoVersion)processing=false;$('#profile-photo').value='';}
    }
    $('#profile-photo').addEventListener('change',()=>acceptPhoto($('#profile-photo').files[0]));
    $('#remove-photo').addEventListener('click',()=>{++photoVersion;processing=false;stagedPhoto=null;preview({display_name:profile.display_name});$('#edit-profile-feedback').textContent='Photo removed. Save your profile to apply it.';photoStage({status:'reset'});});
    $('#profile-dialog').addEventListener('close',()=>{++photoVersion;processing=false;stagedPhoto=undefined;document.querySelector('.photo-crop-dialog')?.close();});

    window.BacklogProfileSocial={acceptPhoto,edit(value){++photoVersion;processing=false;stagedPhoto=undefined;$('#profile-photo').value='';preview(value);photoStage({status:'reset'});},photo(){if(processing)throw new Error('Wait for your photo to finish preparing.');return stagedPhoto;}};
    const bannerSelect=$('#profile-banner-game');
    for(const item of games){
        const option=el('option','',item.title);
        option.value=item.id;
        bannerSelect.append(option);
    }

    function setBannerImage(image,item){
        image.hidden=!item?.banner;
        if(image.hidden)image.removeAttribute('src');
        else{
            image.src=ui.href('imagens/'+item.banner);
            image.style.objectPosition=item.bannerPosition||'center';
        }
    }


    const bannerPreview=$('#profile-banner-preview');
    bannerSelect.addEventListener('change',()=>setBannerImage(bannerPreview,game(bannerSelect.value)));
    function openBannerEditor(){
        if(account.loading)return;
        bannerSelect.value=game(account.getState().profile.banner_game_id)?.id||'';
        setBannerImage(bannerPreview,game(bannerSelect.value));
        $('#profile-banner-feedback').textContent='';
        $('#profile-banner-dialog').showModal();
    }
    $('#profile-banner-form').addEventListener('submit',event=>{
        event.preventDefault();
        action(event.submitter,$('#profile-banner-feedback'),async()=>{
            await account.saveProfileBanner(bannerSelect.value||null);
            $('#profile-banner-dialog').close();
            note('Profile banner saved.');
        });
    });

    let favoriteDraft=[], draggedFavorite=null;
    const favoriteSearch=$('#favorite-search');
    const normalizeFavorite=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

    function favoriteCover(item){
        const image=el('img');
        image.src='../imagens/capas/'+item.cover;
        image.alt='';
        image.loading='lazy';
        return image;
    }

    function renderFavoriteResults(){
        const query=normalizeFavorite(favoriteSearch.value.trim());
        const matches=games.filter(item=>normalizeFavorite([item.title,item.franchise||'',...(item.aliases||[])].join(' ')).includes(query));
        const results=$('#favorite-results');
        results.replaceChildren();
        for(const item of matches){
            const selected=favoriteDraft.includes(item.id);
            const control=button('',()=>{
                const scrollTop=results.scrollTop;
                if(selected)favoriteDraft=favoriteDraft.filter(id=>id!==item.id);
                else if(favoriteDraft.length<4)favoriteDraft.push(item.id);
                renderFavoritePicker();
                results.scrollTop=scrollTop;
                const replacement=[...results.children].find(node=>node.dataset.game===item.id);
                if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});
                else favoriteSearch.focus();
            },'favorite-result');
            control.dataset.game=item.id;
            control.setAttribute('aria-pressed',String(selected));
            control.disabled=!selected&&favoriteDraft.length===4;
            control.append(favoriteCover(item),el('span','',item.title),el('span','favorite-result-mark',selected?'✓':'+'));
            control.lastChild.setAttribute('aria-hidden','true');
            results.append(control);
        }
        $('#favorite-search-status').textContent=matches.length
            ? matches.length+(matches.length===1?' game found':' games found')
            : 'No games match your search.';
    }

    function moveFavorite(id,position,restoreFocus=false){
        const index=favoriteDraft.indexOf(id);
        if(index<0)return;
        const destination=Math.min(favoriteDraft.length-1,Math.max(0,position));
        if(index===destination)return;
        const before=new Map([...$('#favorite-selected').children].map(node=>[node.dataset.game,node.getBoundingClientRect()]));
        favoriteDraft.splice(index,1);
        favoriteDraft.splice(destination,0,id);
        renderFavoritePicker();
        const selected=$('#favorite-selected');
        if(matchMedia('(prefers-reduced-motion: no-preference)').matches){
            for(const node of selected.children){
                const previous=before.get(node.dataset.game);
                if(!previous||!node.dataset.game)continue;
                const current=node.getBoundingClientRect();
                node.animate([{transform:`translate(${previous.x-current.x}px,${previous.y-current.y}px)`},{transform:'none'}],{duration:210,easing:'ease-out'});
            }
        }
        if(restoreFocus){
            const moved=[...selected.children].find(node=>node.dataset.game===id);
            moved?.querySelector('.favorite-pick')?.focus({preventScroll:true});
        }
    }

    function favoriteDropTarget(node,index){
        node.addEventListener('dragover',event=>{
            if(!draggedFavorite||node.dataset.game===draggedFavorite)return;
            event.preventDefault();
            event.dataTransfer.dropEffect='move';
            node.classList.add('is-drop-target');
        });
        node.addEventListener('dragleave',event=>{
            if(!node.contains(event.relatedTarget))node.classList.remove('is-drop-target');
        });
        node.addEventListener('drop',event=>{
            if(!draggedFavorite)return;
            event.preventDefault();
            const id=draggedFavorite;
            draggedFavorite=null;
            node.classList.remove('is-drop-target');
            moveFavorite(id,index);
        });
    }

    function renderFavoritePicker(){
        const selected=$('#favorite-selected');
        selected.replaceChildren();
        $('#favorites-count').textContent=favoriteDraft.length+' / 4 selected';
        for(let index=0;index<4;index++){
            const item=game(favoriteDraft[index]);
            if(!item){
                const empty=el('div','favorite-pick-empty','+');
                empty.setAttribute('aria-hidden','true');
                favoriteDropTarget(empty,index);
                selected.append(empty);
                continue;
            }
            const remove=button('',()=>{
                favoriteDraft=favoriteDraft.filter(id=>id!==item.id);
                renderFavoritePicker();
                favoriteSearch.focus();
            },'favorite-pick');
            remove.setAttribute('aria-label','Remove '+item.title+' from favorites');
            remove.title=item.title;
            remove.append(favoriteCover(item),el('span','favorite-pick-remove','×'));
            const slot=el('div','favorite-order-slot');
            slot.dataset.game=item.id;
            slot.draggable=true;
            remove.firstChild.draggable=false;
            slot.addEventListener('dragstart',event=>{
                draggedFavorite=item.id;
                event.dataTransfer.effectAllowed='move';
                event.dataTransfer.setData('text/plain',item.id);
                slot.classList.add('is-dragging');
            });
            slot.addEventListener('dragend',()=>{
                draggedFavorite=null;
                slot.classList.remove('is-dragging');
                selected.querySelectorAll('.is-drop-target').forEach(target=>target.classList.remove('is-drop-target'));
            });
            favoriteDropTarget(slot,index);
            remove.setAttribute('aria-keyshortcuts','Alt+ArrowLeft Alt+ArrowRight');
            remove.setAttribute('aria-describedby','favorite-reorder-help');
            remove.addEventListener('keydown',event=>{
                if(!event.altKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;
                event.preventDefault();
                moveFavorite(item.id,index+(event.key==='ArrowLeft'?-1:1),true);
            });
            slot.append(remove);
            selected.append(slot);
        }
        renderFavoriteResults();
    }

    function openFavorites(){
        if(account.loading)return;
        draggedFavorite=null;
        favoriteDraft=account.getState().favorites.filter(id=>game(id)).slice(0,4);
        favoriteSearch.value='';
        $('#favorites-feedback').textContent='';
        renderFavoritePicker();
        $('#favorites-dialog').showModal();
        favoriteSearch.focus();
    }

    favoriteSearch.addEventListener('input',()=>{
        renderFavoriteResults();
        $('#favorite-results').scrollTop=0;
    });
    favoriteSearch.addEventListener('keydown',event=>{
        if(event.key==='Enter')event.preventDefault();
    });

    $('#favorites-form').addEventListener('submit',event=>{
        event.preventDefault();
        action(event.submitter,$('#favorites-feedback'),async()=>{
            await account.saveFavorites([...favoriteDraft]);
            $('#favorites-dialog').close();
            await render();

            note('Favorites saved.');
        });
    });

    const editors={profile:openProfileEditor,banner:openBannerEditor,favorites:openFavorites};
    for(const b of document.querySelectorAll('[data-edit-profile]'))b.addEventListener('click',()=>editors[b.dataset.editProfile]());
    for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$('#'+b.dataset.close).close());
    let owner=account.user?.id||'local';window.addEventListener('backlog-account-change',()=>{const next=account.user?.id||'local';if(next!==owner){for(const d of document.querySelectorAll('dialog[open]'))d.close();owner=next;}render();});account.ready.then(render);render();
})();
