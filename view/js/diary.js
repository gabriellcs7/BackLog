/* Timeline pessoal: calendário, filtros e registros completos de cada avaliação. */
(() => {
    'use strict';
    const diary=window.BacklogDiary,account=window.BacklogAccount,ui=window.BacklogUI,{element:el,action}=ui;
    const $=selector=>document.querySelector(selector);
    const params=new URLSearchParams(location.search),profileId=params.get('id'),year=/^\d{4}$/.test(params.get('year')||'')?Number(params.get('year')):null;
    let publicView=false;
    let entries=[],visible=40,version=0,pending=null;
    const date=value=>new Date(value+'T12:00:00');
    const format=(value,options)=>new Intl.DateTimeFormat('en',options).format(date(value));
    $('#diary-month').max=diary.today().slice(0,7);$('#diary-edit-date').max=diary.today();
    function filtered(){const query=$('#diary-search').value.trim().toLowerCase(),month=$('#diary-month').value,type=$('#diary-type').value;return entries.filter(entry=>{const game=ui.game(entry.gameId);return game&&game.title.toLowerCase().includes(query)&&(!month||entry.reviewedOn.startsWith(month))&&(type==='all'||(type==='reviews'?Boolean(entry.text.trim()||entry.reviewNumber):!entry.text.trim()&&!entry.reviewNumber&&!entry.status));}).sort((a,b)=>b.reviewedOn.localeCompare(a.reviewedOn)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));}
    function entryCard(entry){const game=ui.game(entry.gameId),row=el('article','diary-entry');row.dataset.entry=entry.id;
        const day=el('time','diary-day');day.dateTime=entry.reviewedOn;day.append(el('strong','',entry.reviewedOn.slice(8)),el('span','',format(entry.reviewedOn,{weekday:'short'})));
        const cover=el('a','diary-cover');cover.href='game.html?id='+encodeURIComponent(game.id);const image=el('img');image.src='../imagens/capas/'+game.cover;image.alt=game.title+' cover';image.loading='lazy';cover.append(image);
        const content=el('div','diary-entry-content'),heading=el('div','diary-entry-heading'),title=el('a','diary-game-title',game.title);title.href=cover.href;
        const rating=el('span','social-rating',entry.status?window.Backlog.statusOptions.find(option=>option.id===entry.status)?.label:entry.rating===null?'Written review':entry.rating+' / 5 ★');heading.append(title,rating);if(entry.reviewNumber>1)heading.append(el('span','social-small',ui.reviewOrdinal(entry.reviewNumber)));content.append(heading);
        if(entry.text){if(entry.text.length>220){const details=el('details','diary-review');details.append(el('summary','','Preview review'),el('p','',entry.text));content.append(el('p','diary-excerpt',entry.text.slice(0,200)+'…'),details);}else content.append(el('p','diary-review-text',entry.text));}
        else if(!publicView)content.append(el('p','social-small','Rated this game.'));
        if(publicView){if(entry.reviewId)title.href=ui.reviewHref('id',entry.reviewId);row.append(day,cover,content);return row;}
        title.href=ui.reviewHref('entry',entry.id);
        const actions=el('div','social-actions diary-entry-actions'),edit=el('button','social-button social-button-quiet','Edit date'),remove=el('button','social-button social-button-quiet social-danger','Remove entry');edit.type=remove.type='button';edit.setAttribute('aria-label','Edit date for '+game.title);remove.setAttribute('aria-label','Remove diary entry for '+game.title);
        edit.addEventListener('click',()=>{pending=entry;$('#diary-edit-game').textContent=game.title;$('#diary-edit-date').value=entry.reviewedOn;$('#diary-date-feedback').textContent='';$('#diary-date-dialog').showModal();});remove.addEventListener('click',()=>{pending=entry;$('#diary-remove-game').textContent=game.title+' · '+format(entry.reviewedOn,{dateStyle:'medium'});$('#diary-remove-feedback').textContent='';$('#diary-remove-dialog').showModal();});actions.append(edit,remove);content.append(actions);row.append(day,cover,content);return row;}
    function render(){const list=filtered();$('#diary-total').textContent=String(entries.length);$('#diary-games').textContent=String(new Set(entries.map(e=>e.gameId)).size);$('#diary-days').textContent=String(new Set(entries.map(e=>e.reviewedOn)).size);$('#diary-result-count').textContent=list.length+' '+(list.length===1?'entry':'entries');$('#more-diary').hidden=list.length<=visible;const container=$('#diary-entries');container.replaceChildren();
        if(!list.length){const panel=el('div','social-empty');panel.append(el('p','',entries.length?'No entries match your filters.':'No diary entries for this period.'));container.append(panel);return;}
        let month=null,group=null;for(const entry of list.slice(0,visible)){const key=entry.reviewedOn.slice(0,7);if(key!==month){month=key;group=el('section','diary-month-group');const title=el('h2','diary-month-title',format(entry.reviewedOn,{month:'long',year:'numeric'}));title.id='month-'+key;group.setAttribute('aria-labelledby',title.id);group.append(title);container.append(group);}group.append(entryCard(entry));}
    }
    async function load(){const ticket=++version;$('#refresh-diary').disabled=true;$('#diary-feedback').textContent='';$('#diary-result-count').textContent='Loading your diary…';try{await account.ready;
        const visiting=Boolean(profileId&&profileId!==account.user?.id);
        let result,heading,note;
        if(visiting){
            const player=await account.getProfile(profileId);
            if(!player.profile)throw new Error('Profile not found.');
            heading=player.profile.display_name+'’s diary';
            note='Public ratings, reviews and collection updates.';
            result=[];
            for(let offset=0;;offset+=100){
                const rows=await window.BacklogCommunity.publicDiary(profileId,year,offset);
                if(ticket!==version)return;
                result.push(...rows.map(row=>({id:row.id,gameId:row.game_id,rating:row.rating,status:row.status,text:'',createdAt:row.created_at,reviewedOn:row.public_date,reviewNumber:row.review_number,reviewId:row.review_id})));
                if(rows.length<100)break;
            }
        }else{
            result=await diary.entries();
            const counts=new Map();
            for(const entry of [...result].sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){
                if(!entry.text.trim())continue;
                entry.reviewNumber=(counts.get(entry.gameId)||0)+1;
                counts.set(entry.gameId,entry.reviewNumber);
            }
        }
        if(ticket!==version)return;
        publicView=visiting;
        if(heading||year)$('#diary-title').textContent=(heading||'Your diary')+(year?' · '+year:'');
        entries=result.filter(entry=>ui.game(entry.gameId)&&(!year||Number(entry.reviewedOn.slice(0,4))===year));$('#diary-account-note').textContent=note||(account.user?'Your personal diary is saved to your account. Only you can see these entries.':'This is the diary saved on this device. Sign in through your profile to see your account diary.');render();}catch(error){if(ticket===version){entries=[];render();$('#diary-feedback').textContent='Could not load your diary. If this is your first visit after the update, finish the diary setup and refresh.';}}finally{if(ticket===version)$('#refresh-diary').disabled=false;}}
    for(const id of['diary-search','diary-month','diary-type'])$('#'+id).addEventListener(id==='diary-search'?'input':'change',()=>{visible=40;render();});
    $('#reset-diary-filters').addEventListener('click',()=>{$('#diary-search').value='';$('#diary-month').value='';$('#diary-type').value='all';visible=40;render();});$('#refresh-diary').addEventListener('click',load);$('#more-diary').addEventListener('click',()=>{visible+=40;render();});
    $('#diary-date-form').addEventListener('submit',event=>{event.preventDefault();const entry=pending;action(event.submitter,$('#diary-date-feedback'),async()=>{await diary.changeDate(entry.id,$('#diary-edit-date').value);$('#diary-date-dialog').close();await load();$('#refresh-diary').focus();$('#diary-feedback').textContent='Diary date updated.';});});
    $('#confirm-remove-entry').addEventListener('click',event=>{const entry=pending;action(event.currentTarget,$('#diary-remove-feedback'),async()=>{await diary.removeEntry(entry.id);$('#diary-remove-dialog').close();await load();$('#refresh-diary').focus();$('#diary-feedback').textContent='Diary entry removed. Your review and collection status are unchanged.';});});
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
    window.addEventListener('backlog-account-change',()=>{if(account.loading)return;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();load();});window.addEventListener('backlog-diary-change',load);window.addEventListener('backlog-review-change',load);window.addEventListener('storage',event=>{if(event.key===null||event.key.startsWith('backlog:review:'))load();});account.ready.then(load);
})();
