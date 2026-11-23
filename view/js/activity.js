(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,$=id=>document.getElementById(id);
    let offset=0,generation=0,busy=false,filter='all',seen=new Set(),days=new Map();
    let loaded=false,newestTime=0,checking=false,lastCheck=0;
    const news=window.BacklogNewItems.create(async()=>{if(await load(true))$('activity-feed').scrollIntoView({behavior:window.BacklogMotion?.matches?'auto':'smooth',block:'start'});});
    $('activity-feed').before(news.host);
    async function checkNew(){
        if(checking||busy||!loaded||!account.user||document.hidden||Date.now()-lastCheck<4000)return;
        checking=true;lastCheck=Date.now();const ticket=generation,owner=account.user.id,kind=filter;
        try{const events=await api.activity(0,kind);if(ticket!==generation||account.user?.id!==owner||filter!==kind)return;
            const fresh=[...new Map(events.filter(event=>!seen.has(event.id)&&Date.parse(event.created_at)>=newestTime).map(event=>[event.id,event])).values()];
            news.set(fresh.length,events.length===20&&fresh.length===20);
        }catch{/* A próxima verificação pode recuperar falhas temporárias sem interromper a leitura. */}
        finally{checking=false;}
    }
    setInterval(checkNew,45000);window.addEventListener('focus',checkNew);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkNew();});
    function row(event){
        const item=ui.element('article','activity-event'),profile={id:event.actor_id,display_name:event.display_name,avatar_path:event.avatar_path};item.dataset.kind=event.kind;
        const identity=ui.element('div','activity-event-copy'),sentence=ui.element('p');sentence.append(ui.profileLink(profile));const game=ui.game(event.game_id),target=event.target_id===account.user?.id?'you':event.target_name||'a player';
        const wishlistAddition=event.kind==='status'&&event.status==='want-to-play';
        const messages={follow:' followed '+target+'.',like:' liked '+(target==='you'?'your':target+'\'s')+' review of ',comment:' commented on '+(target==='you'?'your':target+'\'s')+' review of ',rating:event.review_number||event.rating===null?' reviewed ':' rated ',status:wishlistAddition?' added ':' marked '};sentence.append(document.createTextNode(messages[event.kind]||' updated '));
        const destination=event.review_id?ui.reviewHref('id',event.review_id):game?ui.href('view/game.html?id='+encodeURIComponent(game.id)):null;
        if(game){const link=ui.element('a','player-link',game.title);link.href=destination;sentence.append(link);}
        if(event.kind==='rating'&&event.rating!==null){const score=ui.ratingStars(Number(event.rating),event.game_id);score.classList.add('activity-rating');sentence.append(document.createTextNode(' '),score);}
        if(event.kind==='rating'&&event.review_number>1)sentence.append(document.createTextNode(' · '+ui.reviewOrdinal(event.review_number)));
        if(wishlistAddition)sentence.append(document.createTextNode(' to Want to play.'));
        else if(event.kind==='status')sentence.append(document.createTextNode(' as '+(window.Backlog.statusOptions.find(s=>s.id===event.status)?.label||event.status)+'.'));
        const date=ui.element('time','social-small',new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(event.created_at)));date.dateTime=event.created_at;identity.append(sentence,date);item.append(ui.avatar(profile),identity);
        if(game){const cover=ui.element('a','activity-game-cover');cover.href=destination;const img=ui.element('img');img.src=ui.href('imagens/capas/'+game.cover);img.alt=game.title;img.loading='lazy';cover.append(img);item.append(cover);}
        const badge=ui.element('span','activity-kind-badge',({follow:'+',like:'♥',comment:'↗',rating:'★',status:'✓'})[event.kind]||'·');badge.setAttribute('aria-hidden','true');item.append(badge);
        if(game){
            const details=ui.element('details','activity-details'),summary=ui.element('summary','','View details');
            const panel=ui.element('div','activity-details-panel'),link=ui.element('a','player-link',event.review_id?'Open review ↗':'Open game ↗');link.href=destination;
            panel.append(ui.element('strong','',game.title),ui.element('p','social-small',[game.year,...game.tags].filter(Boolean).join(' · ')),link);details.append(summary,panel);identity.append(details);
        }
        return item;
    }
    function appendEvent(event){
        const date=new Date(event.created_at),key=[date.getFullYear(),date.getMonth(),date.getDate()].join('-');
        let group=days.get(key);
        if(!group){
            const section=ui.element('section','activity-day'),heading=ui.element('h2','activity-day-title');
            const today=new Date(),yesterday=new Date();yesterday.setDate(today.getDate()-1);
            const sameDay=other=>date.getFullYear()===other.getFullYear()&&date.getMonth()===other.getMonth()&&date.getDate()===other.getDate();
            const label=sameDay(today)?'Today':sameDay(yesterday)?'Yesterday':new Intl.DateTimeFormat('en',{month:'long',day:'numeric',year:'numeric'}).format(date);
            const time=ui.element('time','',label);time.dateTime=date.toISOString();heading.append(time);
            group=ui.element('div','activity-day-events');section.append(heading,group);days.set(key,group);$('activity-feed').append(section);
        }
        const item=row(event);group.append(item);
        if(matchMedia('(prefers-reduced-motion:no-preference)').matches)item.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:240,easing:'ease-out'});
    }
    async function load(reset=false){
        if(busy&&!reset)return;const ticket=++generation;busy=true;$('more-activity').disabled=true;$('activity-feedback').textContent='';
        if(reset){loaded=false;newestTime=0;news.set(0);offset=0;seen=new Set();days=new Map();$('activity-feed').replaceChildren();}
        try{
            if(!account.user){const empty=ui.element('p','social-empty','Sign in to see who followed you, reactions to your reviews and updates from your circle. '),link=ui.element('a','player-link','Sign in ↗');link.href='profile.html#account';empty.append(link);$('activity-feed').replaceChildren(empty);$('more-activity').hidden=true;return;}
            const events=await api.activity(offset,filter);if(ticket!==generation)return;
            if(reset){loaded=true;newestTime=Math.max(0,...events.map(event=>Date.parse(event.created_at)||0));}
            for(const event of events)if(!seen.has(event.id)){seen.add(event.id);appendEvent(event);}
            offset+=events.length;$('more-activity').hidden=events.length<20;
            if(!seen.size)$('activity-feed').append(ui.element('p','social-empty','No activity here yet. Follow players and share reviews to get started.'));
            return true;
        }catch(error){if(ticket===generation){$('activity-feedback').textContent='Could not load activity. '+error.message;$('more-activity').hidden=true;}}
        finally{if(ticket===generation){busy=false;$('more-activity').disabled=false;}}
    }
    document.querySelectorAll('[data-activity-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.activityFilter;document.querySelectorAll('[data-activity-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));load(true);}));
    $('refresh-activity').addEventListener('click',()=>load(true));$('more-activity').addEventListener('click',()=>load());account.ready.then(()=>load(true));window.addEventListener('backlog-account-change',()=>{if(!account.loading)load(true);});
})();
