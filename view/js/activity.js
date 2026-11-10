(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,$=id=>document.getElementById(id);
    let offset=0,generation=0,busy=false,filter='all',seen=new Set();
    function row(event){
        const item=ui.element('article','activity-event'),profile={id:event.actor_id,display_name:event.display_name,avatar_path:event.avatar_path};item.dataset.kind=event.kind;
        const identity=ui.element('div','activity-event-copy'),sentence=ui.element('p');sentence.append(ui.profileLink(profile));const game=ui.game(event.game_id),target=event.target_id===account.user?.id?'you':event.target_name||'a player';
        const messages={follow:' followed '+target+'.',like:' liked '+(target==='you'?'your':target+'’s')+' review of ',comment:' commented on '+(target==='you'?'your':target+'’s')+' review of ',rating:event.rating===null?' reviewed ':' rated ',status:' marked '};sentence.append(document.createTextNode(messages[event.kind]||' updated '));
        if(game){const link=ui.element('a','player-link',game.title);link.href=ui.href('view/game.html?id='+encodeURIComponent(game.id)+(event.review_id?'#review-'+event.review_id:''));sentence.append(link);}
        if(event.kind==='rating'&&event.rating!==null)sentence.append(document.createTextNode(' '+event.rating+' / 5 ★.'));
        if(event.kind==='status')sentence.append(document.createTextNode(' as '+(window.Backlog.statusOptions.find(s=>s.id===event.status)?.label||event.status)+'.'));
        const date=ui.element('time','social-small',new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(event.created_at)));date.dateTime=event.created_at;identity.append(sentence,date);item.append(ui.avatar(profile),identity);
        if(game){const cover=ui.element('a','activity-game-cover');cover.href=ui.href('view/game.html?id='+encodeURIComponent(game.id));const img=ui.element('img');img.src=ui.href('imagens/capas/'+game.cover);img.alt=game.title;img.loading='lazy';cover.append(img);item.append(cover);}return item;
    }
    async function load(reset=false){
        if(busy&&!reset)return;const ticket=++generation;busy=true;$('more-activity').disabled=true;$('activity-feedback').textContent='';
        if(reset){offset=0;seen=new Set();$('activity-feed').replaceChildren();}
        try{
            if(!account.user){const empty=ui.element('p','social-empty','Sign in to see who followed you, reactions to your reviews and updates from your circle. '),link=ui.element('a','player-link','Sign in ↗');link.href='profile.html#account';empty.append(link);$('activity-feed').replaceChildren(empty);$('more-activity').hidden=true;return;}
            const events=await api.activity(offset,filter);if(ticket!==generation)return;
            for(const event of events)if(!seen.has(event.id)){seen.add(event.id);$('activity-feed').append(row(event));}
            offset+=events.length;$('more-activity').hidden=events.length<20;
            if(!seen.size)$('activity-feed').append(ui.element('p','social-empty','No activity here yet. Follow players and share reviews to get started.'));
        }catch(error){if(ticket===generation){$('activity-feedback').textContent='Could not load activity. '+error.message;$('more-activity').hidden=true;}}
        finally{if(ticket===generation){busy=false;$('more-activity').disabled=false;}}
    }
    document.querySelectorAll('[data-activity-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.activityFilter;document.querySelectorAll('[data-activity-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));load(true);}));
    $('refresh-activity').addEventListener('click',()=>load(true));$('more-activity').addEventListener('click',()=>load());account.ready.then(()=>load(true));window.addEventListener('backlog-account-change',()=>{if(!account.loading)load(true);});
})();
