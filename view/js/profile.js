(() => {
    'use strict';
    const account=window.BacklogAccount,ui=window.BacklogUI,{element:el,game,gameCard,action}=ui;
    const $=selector=>document.querySelector(selector);
    const params=new URLSearchParams(location.search);
    const target=params.get('id');
    const games=[...window.BacklogGames].sort((a,b)=>a.title.localeCompare(b.title));
    let player=null,own=true,signup=false,pendingDelete=null,selected=new Set(),version=0;
    const button=(text,task,className='social-button')=>{const b=el('button',className,text);b.type='button';b.addEventListener('click',task);return b;};
    function note(message){$('#profile-message').textContent=message;}
    async function render(){const ticket=++version;own=!target||target===account.user?.id;
        const profileNav=$('#profile-nav-link');
        profileNav.classList.toggle('active',own);
        if(own)profileNav.setAttribute('aria-current','page');
        else profileNav.removeAttribute('aria-current');
        try{const value=own?account.getState():await account.getProfile(target);if(ticket!==version)return;if(!value.profile)throw new Error('Profile not found.');player=value;
            $('#profile-name').textContent=player.profile.display_name;$('#profile-bio').textContent=player.profile.bio||'Games you play, reviews, and custom lists.';$('#profile-avatar').replaceChildren(...ui.avatar(player.profile).childNodes);if(!$('#profile-avatar').textContent)$('#profile-avatar').prepend(player.profile.display_name.slice(0,1).toUpperCase());window.BacklogProfileSocial.render(player.profile,own);window.BacklogProfileActivity.render(player,own);window.BacklogProfileMilestones.render(player,own);document.title=player.profile.display_name+' · BackLog';
            window.BacklogProfileCommonGames.render(player,own);
            renderProfileBanner();
            window.BacklogProfileWishlist.render(player.profile.id);
            window.BacklogProfilePlaying.render(player.profile.id);
            window.BacklogProfileRatings.render(player.profile.id);
            renderProfileDetails();
            for(const id of ['choose-favorites','new-list'])$('#'+id).disabled=account.loading;
            $('#choose-favorites').hidden=!own;$('#new-list').hidden=!own;$('#account').hidden=!own;
            $('#favorites-title').textContent=own?'Your favorite four.':'Favorite four.';$('#favorites-grid').replaceChildren();
            for(let i=0;i<4;i++){const id=player.favorites[i],slot=el('div','favorite-slot');if(id){slot.append(gameCard(id));}else{const empty=own?button('+',openFavorites,'favorite-empty'):el('div','favorite-empty','☆');if(own)empty.setAttribute('aria-label','Choose favorite game '+(i+1));empty.append(el('span','',own?'Choose a game':'Not selected'));slot.append(empty);}$('#favorites-grid').append(slot);}
            renderLists();openRequestedListAction();await renderReviews(ticket);renderAccount();openSettingsShortcut();if(account.error)note(account.error);
        }catch(error){if(ticket===version)note(error.message);}
    }
    function openSettingsShortcut(){
        const request=params.get('settings'),targets={profile:openProfileEditor,banner:openBannerEditor,favorites:openFavorites};
        if(!own||!player||account.loading||!Object.hasOwn(targets,request))return;
        params.delete('settings');const url=new URL(location.href);url.searchParams.delete('settings');history.replaceState(null,'',url);targets[request]();
    }
    function confirmListDeletion(list){
        pendingDelete=list.id;
        $('#delete-list-name').textContent=list.name;
        $('#delete-list-feedback').textContent='';
        $('#delete-list-dialog').showModal();
    }

    function openRequestedListAction(){
        if(!own||account.loading)return;
        const editId=params.get('edit-list'),deleteId=params.get('delete-list');
        if(!editId&&!deleteId)return;
        params.delete('edit-list');
        params.delete('delete-list');
        const url=new URL(location.href);
        url.searchParams.delete('edit-list');
        url.searchParams.delete('delete-list');
        history.replaceState(null,'',url);
        const list=player.lists.find(item=>item.id===(editId||deleteId));
        if(!list){note('List not found.');return;}
        if(editId)openListEditor(list);
        else confirmListDeletion(list);
    }

    function renderLists(){
        const container=$('#profile-lists'),link=$('#profile-lists-link');
        container.replaceChildren();
        link.href=ui.href('view/profile-lists.html?'+new URLSearchParams({id:player.profile.id}));
        if(!player.lists.length){
            container.append(el('p','social-empty',own?'No lists yet.':'No public lists yet.'));
            return;
        }
        for(const list of player.lists.slice(0,1)){
            const card=window.BacklogListCard(list,player.profile.id);
            if(own){
                const actions=el('div','social-actions');
                actions.append(button('Edit',()=>openListEditor(list),'social-button social-button-quiet'),button('Delete',()=>confirmListDeletion(list),'social-button social-button-quiet social-danger'));
                card.append(actions);
            }
            container.append(card);
        }
    }
    async function renderReviews(ticket){
        const grid=$('#profile-reviews'),more=$('#more-profile-reviews'),feedback=$('#profile-reviews-feedback');
        grid.replaceChildren(ui.loadingCards('Loading reviews…',2));
        more.hidden=true;
        feedback.textContent='';
        try{
            const profileId=player.profile.id;
            const api=window.BacklogProfileReviews;
            const reviews=await api.get(profileId,0,3);
            if(ticket!==version)return;
            grid.replaceChildren(...reviews.slice(0,2).map(api.card).filter(Boolean));
            more.href=ui.href('view/profile-reviews.html?id='+encodeURIComponent(profileId));
            more.hidden=reviews.length<=2;
            if(!reviews.length)grid.append(el('p','social-empty',own?'Your reviews will appear here once you write one.':'No reviews yet.'));
        }catch(error){
            if(ticket===version){grid.replaceChildren();feedback.textContent=error.message||'Could not load reviews.';}
        }
    }
    function renderAccount(){if(!own)return;$('#signed-in').hidden=!account.user;const filePreview=location.protocol==='file:'&&account.configured;$('#auth-form').hidden=Boolean(account.user)||!account.configured||filePreview;$('#local-preview-link').hidden=!filePreview||Boolean(account.user);
        $('#account-note').textContent=account.user?'Your profile, lists and favorites are connected to your account.':account.configured?'Sign in to sync your profile across devices. Your local profile stays separate.':'Online accounts are not connected yet. You can still save your profile, top four and lists on this device.';
        if(filePreview&&!account.user)$('#account-note').textContent='Open the local site to create an account and confirm your email. Your device profile stays available in this preview.';
        if(account.user){$('#account-email').textContent=account.user.email;let imported=false;try{imported=localStorage.getItem('backlog:imported:'+account.user.id)==='yes';}catch{}$('#import-device').disabled=imported;$('#import-device').textContent=imported?'Device profile copied':'Copy device profile & lists to account';}
    }
    function openProfileEditor(){if(!own||!player||account.loading)return;$('#display-name').value=player.profile.display_name;$('#profile-bio-input').value=player.profile.bio;$('#profile-location-input').value=player.profile.location||'';$('#profile-website-input').value=player.profile.website||'';$('#profile-platform-input').value=player.profile.gaming_platform||'';$('#edit-profile-feedback').textContent='';window.BacklogProfileSocial.edit(player.profile);$('#profile-dialog').showModal();}
    $('#profile-form').addEventListener('submit',event=>{event.preventDefault();action(event.submitter,$('#edit-profile-feedback'),async()=>{await account.saveProfile($('#display-name').value,$('#profile-bio-input').value,window.BacklogProfileSocial.photo(),{location:$('#profile-location-input').value,website:$('#profile-website-input').value,platform:$('#profile-platform-input').value});$('#profile-dialog').close();note('Profile saved.');await render();});});
    function renderProfileDetails(){
        const location=$('#profile-location'),website=$('#profile-website');
        location.textContent=player.profile.location||'';
        location.hidden=!location.textContent;
        website.hidden=true;
        website.removeAttribute('href');
        try{
            const url=new URL(player.profile.website);
            if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password){
                website.href=url.href;
                website.textContent=url.hostname.replace(/^www\./,'')+' ↗';
                website.hidden=false;
            }
        }catch{}
        const platform=$('#profile-platform');
        platform.textContent=player.profile.gaming_platform||'';
        platform.hidden=!platform.textContent;
        $('#profile-details').hidden=location.hidden&&website.hidden&&platform.hidden;
    }

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

    function renderProfileBanner(){
        const item=game(player.profile.banner_game_id);
        const banner=$('#profile-banner'),credit=$('#profile-banner-credit');
        setBannerImage(banner,item);
        banner.closest('.profile-header').classList.toggle('has-profile-banner',!banner.hidden);
        credit.hidden=banner.hidden;
        if(!credit.hidden){
            credit.href=ui.href('view/game.html?id='+encodeURIComponent(item.id));
            credit.textContent=item.title+' ↗';
        }
    }

    const bannerPreview=$('#profile-banner-preview');
    bannerSelect.addEventListener('change',()=>setBannerImage(bannerPreview,game(bannerSelect.value)));
    function openBannerEditor(){
        if(!own||account.loading)return;
        bannerSelect.value=game(player.profile.banner_game_id)?.id||'';
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
        if(!own||account.loading||!player)return;
        draggedFavorite=null;
        favoriteDraft=player.favorites.filter(id=>game(id)).slice(0,4);
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
    $('#choose-favorites').addEventListener('click',openFavorites);
    $('#favorites-form').addEventListener('submit',event=>{
        event.preventDefault();
        action(event.submitter,$('#favorites-feedback'),async()=>{
            await account.saveFavorites([...favoriteDraft]);
            $('#favorites-dialog').close();
            await render();
            $('#choose-favorites').focus();
            note('Favorites saved.');
        });
    });
    for(const genre of [...new Set(games.map(g=>g.genre))].sort()){const option=el('option','',genre);option.value=genre;$('#list-genre').append(option);}
    function matchingGames(){const q=$('#list-search').value.trim().toLowerCase();return games.filter(g=>(g.title+' '+(g.franchise||'')).toLowerCase().includes(q)&&($('#list-genre').value==='all'||g.genre===$('#list-genre').value)&&(!$('#list-played').checked||['played','playing','completed','platinum','dropped'].includes(window.Backlog.getStatus(g.id)?.id)));}
    function updateSelected(){$('#list-selected-count').textContent=selected.size+' selected';renderSelection();}
    function renderSelection(){
        const ranked=$('#list-ranked').checked,ids=[...selected],container=$('#list-order');
        $('#list-order-panel').hidden=ids.length===0;
        $('#list-order-title').textContent=ranked?'Your ranking':'Selected games';
        $('#list-order-help').textContent=ranked?'Number 1 is your top pick. Drag the handle, use its arrow keys, or enter a position to reorder games.':'These games have no preference order. Turn on ranking to number and reorder them.';
        container.replaceChildren();
        ids.forEach((id,index)=>{
            const item=game(id),row=el('li','selected-game'+(ranked?' is-ranked':''));row.dataset.game=id;
            const position=el('input','list-rank-input');position.type='number';position.min='1';position.max=String(ids.length);position.step='1';position.value=String(index+1);position.hidden=!ranked;position.setAttribute('aria-label','Rank for '+item.title);
            const commitPosition=()=>{const next=Number(position.value);if(!Number.isInteger(next)||next<1||next>ids.length){position.value=String(index+1);$('#list-order-feedback').textContent='Choose a position from 1 to '+ids.length+'.';return;}moveGame(id,next-1,'position');};
            position.addEventListener('change',commitPosition);position.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commitPosition();}});
            const image=el('img');image.src='../imagens/capas/'+item.cover;image.alt='';
            const title=el('span','selected-game-title',item.title),controls=el('div','selected-game-controls');
            if(ranked){const up=button('↑',()=>moveGame(id,index-1,'up'),'social-button'),down=button('↓',()=>moveGame(id,index+1,'down'),'social-button');up.dataset.move='up';down.dataset.move='down';up.disabled=index===0;down.disabled=index===ids.length-1;up.setAttribute('aria-label','Move '+item.title+' up');down.setAttribute('aria-label','Move '+item.title+' down');controls.append(up,down);}
            const remove=button('×',()=>{selected.delete(id);renderPicker();$('#list-order-feedback').textContent=item.title+' removed from the list.';$('#list-search').focus();},'social-button social-danger');remove.setAttribute('aria-label','Remove '+item.title+' from list');controls.append(remove);
            if(ranked){const handle=button('⠿',()=>{},'sort-game-handle');handle.dataset.move='handle';handle.setAttribute('aria-label','Reorder '+item.title);handle.setAttribute('aria-describedby','list-order-help');row.append(handle);}
            row.append(position,image,title,controls);container.append(row);
        });
    }
    window.BacklogSortable.attach($('#list-order'),(id,to)=>moveGame(id,to,'handle'));
    function moveGame(id,to,focus){
        const ids=[...selected],from=ids.indexOf(id);if(from<0||to<0||to>=ids.length)return;
        ids.splice(from,1);ids.splice(to,0,id);selected=new Set(ids);renderSelection();
        $('#list-order-feedback').textContent=game(id).title+' moved to position '+(to+1)+'.';
        const row=[...$('#list-order').children].find(node=>node.dataset.game===id);
        const target=focus==='position'?row?.querySelector('.list-rank-input'):row?.querySelector('[data-move="'+focus+'"]');
        (target&&!target.disabled?target:row?.querySelector('.list-rank-input'))?.focus();
    }
    function renderPicker(){const container=$('#list-picker');container.replaceChildren();const matches=matchingGames();if(!matches.length)container.append(el('p','social-empty','No games match these filters.'));for(const item of matches){const label=el('label','picker-game');const input=el('input');input.type='checkbox';input.value=item.id;input.checked=selected.has(item.id);input.addEventListener('change',()=>{if(input.checked)selected.add(item.id);else selected.delete(item.id);updateSelected();});const img=el('img');img.src='../imagens/capas/'+item.cover;img.alt='';const copy=el('span','',item.title);label.append(input,img,copy);container.append(label);}updateSelected();}
    function openListEditor(list=null){if(!own)return;$('#list-id').value=list?.id||'';$('#list-name').value=list?.name||'';$('#list-description').value=list?.description||'';window.BacklogListTags.editor.set(list?.tags||[]);$('#list-public').checked=list?Boolean(list.is_public):Boolean(account.user&&window.BacklogPreferences?.get().publicLists);$('#list-ranked').checked=list?.is_ranked===true;$('#list-order-feedback').textContent='';$('#list-public').disabled=!account.user;$('#list-local-note').textContent=account.user?'Private lists are only visible to you. Public lists appear on your profile.':'Lists on this device are private. Sign in when online accounts are connected to share lists.';$('#list-search').value='';$('#list-genre').value='all';$('#list-played').checked=false;selected=new Set(list?.gameIds||[]);$('#list-editor-title').textContent=list?'Edit your list.':'Create a list.';$('#list-feedback').textContent='';renderPicker();$('#list-dialog').showModal();}
    $('#list-ranked').addEventListener('change',()=>{$('#list-order-feedback').textContent='';renderSelection();});
    $('#new-list').addEventListener('click',()=>openListEditor());for(const id of ['list-search','list-genre','list-played'])$('#'+id).addEventListener(id==='list-search'?'input':'change',renderPicker);$('#select-visible').addEventListener('click',()=>{for(const item of matchingGames())selected.add(item.id);renderPicker();});
    $('#list-form').addEventListener('submit',event=>{event.preventDefault();action(event.submitter,$('#list-feedback'),async()=>{await account.saveList({id:$('#list-id').value||null,name:$('#list-name').value,description:$('#list-description').value,tags:window.BacklogListTags.editor.get(),is_public:$('#list-public').checked,is_ranked:$('#list-ranked').checked,gameIds:[...selected]});$('#list-dialog').close();await render();$('#new-list').focus();note('List saved.');});});
    $('#confirm-delete-list').addEventListener('click',event=>action(event.currentTarget,$('#delete-list-feedback'),async()=>{await account.deleteList(pendingDelete);$('#delete-list-dialog').close();await render();$('#new-list').focus();note('List deleted.');}));
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
    $('#auth-mode').addEventListener('click',()=>{signup=!signup;$('#signup-name-wrap').hidden=!signup;$('#signup-name').required=signup;$('#auth-password').autocomplete=signup?'new-password':'current-password';$('#auth-submit').textContent=signup?'Create account':'Sign in';$('#auth-mode').textContent=signup?'I already have an account':'Create an account';$('#auth-feedback').textContent='';});
    $('#auth-form').addEventListener('submit',event=>{event.preventDefault();action(event.submitter,$('#auth-feedback'),async()=>{if(signup){const logged=await account.signUp($('#auth-email').value,$('#auth-password').value,$('#signup-name').value);$('#auth-feedback').textContent=logged?'Account created.':'Check your email to confirm your account, then sign in.';}else{await account.signIn($('#auth-email').value,$('#auth-password').value);$('#auth-feedback').textContent='Signed in.';}$('#auth-password').value='';await render();});});
    $('#sign-out').addEventListener('click',event=>action(event.currentTarget,$('#auth-feedback'),async()=>{await account.signOut();await render();$('#auth-feedback').textContent='Signed out. Your device profile is available again.';}));
    $('#import-device').addEventListener('click',event=>action(event.currentTarget,$('#auth-feedback'),async()=>{if(!confirm('Copy your device name, bio, favorites and lists into this account? This replaces your account name, bio and top four. Lists will be added privately; reviews will not be published.'))return;await account.importDevice();try{localStorage.setItem('backlog:imported:'+account.user.id,'yes');}catch{}await render();$('#auth-feedback').textContent='Device profile copied. Reviews were not published.';}));
    window.addEventListener('backlog-account-change',()=>render());window.addEventListener('backlog-review-change',()=>render());account.ready.then(render);
})();
