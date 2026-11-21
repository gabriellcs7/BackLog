/* Calendário e marcos derivados dos registros visíveis do perfil, sem tabelas novas. */
(() => {
    'use strict';const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,el=ui.element;
    const anchor=document.querySelector('.profile-content');if(!anchor)return;
    const root=el('div','profile-insights');root.hidden=true;anchor.after(root);
    const card=el('section','insight-card profile-heatmap');card.setAttribute('aria-labelledby','profile-heatmap-title');
    const heading=el('div','insight-heading'),copy=el('div'),title=el('h2','','Your year in games'),subtitle=el('p','','Rated games by diary date.');title.id='profile-heatmap-title';copy.append(title,subtitle);
    const controls=el('div','insight-controls'),yearSelect=el('select');yearSelect.id='profile-heatmap-year';yearSelect.setAttribute('aria-label','Year');const diaryLink=el('a','text-link','Open diary ↗');controls.append(yearSelect,diaryLink);heading.append(copy,controls);
    const content=el('div','heatmap-content'),feedback=el('p','social-feedback');feedback.setAttribute('role','status');card.append(heading,content,feedback);root.append(card);
    const achievementHost=el('div','profile-achievements-host');achievementHost.hidden=true;root.append(achievementHost);
    const tooltip=el('div','heatmap-tooltip');tooltip.id='heatmap-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;tooltip.dataset.noTranslate='';document.body.append(tooltip);
    let current=null,data=null,version=0,selectedYear=new Date().getFullYear(),timer=null;
    const t=s=>window.BacklogI18n?.t(s)||s,locale=()=>window.BacklogI18n?.locale||'en',date=d=>new Date(d+'T12:00:00'),iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const rated=r=>r.rating!=null&&Number(r.rating)>=.5&&Number(r.rating)<=5,known=id=>Boolean(ui.game(id));
    function diaryHref(day){const url=new URL(ui.href('view/diary.html'));if(current.player.profile.id!=='local')url.searchParams.set('id',current.player.profile.id);url.searchParams.set('year',selectedYear);if(day)url.searchParams.set('date',day);return url.href;}
    function hideTip(){tooltip.hidden=true;}
    function showTip(node){tooltip.textContent=node.getAttribute('aria-label');tooltip.hidden=false;const r=node.getBoundingClientRect();tooltip.style.left=Math.max(10,Math.min(innerWidth-tooltip.offsetWidth-10,r.left-tooltip.offsetWidth/2+r.width/2))+'px';tooltip.style.top=Math.max(10,r.top-tooltip.offsetHeight-9)+'px';}
    function draw(){
        if(!data||!current)return;hideTip();content.replaceChildren();const year=selectedYear,today=window.BacklogDiary.today(),counts=new Map();
        for(const row of data.calendar)if(Number(row.day.slice(0,4))===year)counts.set(row.day,(counts.get(row.day)||0)+1);
        const total=[...counts.values()].reduce((a,b)=>a+b,0),summary=el('div','heatmap-summary');summary.dataset.noTranslate='';summary.append(el('strong','',new Intl.NumberFormat(locale()).format(total)),document.createTextNode(' '+t(total===1?'rating':'ratings')+' · '+counts.size+' '+t(counts.size===1?'active day':'active days')));
        const scroll=el('div','heatmap-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label',t('Activity calendar'));const layout=el('div','heatmap-layout'),weekdays=el('div','heatmap-weekdays'),canvas=el('div','heatmap-canvas'),months=el('div','heatmap-months'),grid=el('div','heatmap-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label',t('Activity calendar')+' '+year);
        for(let i=0;i<7;i++){const label=el('span','',i%2===0?new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(new Date(2024,0,1+i,12)):'');label.dataset.noTranslate='';weekdays.append(label);}
        const first=new Date(year,0,1,12),offset=(first.getDay()+6)%7,start=new Date(first);start.setDate(1-offset);const days=Math.round((Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000),weeks=Math.ceil((offset+days)/7);canvas.style.setProperty('--heat-weeks',weeks);
        for(let m=0;m<12;m++){const dayIndex=Math.round((Date.UTC(year,m,1)-Date.UTC(year,0,1))/86400000),label=el('span','',new Intl.DateTimeFormat(locale(),{month:'short'}).format(new Date(year,m,1,12)));label.dataset.noTranslate='';label.style.gridColumn=String(Math.floor((offset+dayIndex)/7)+1);months.append(label);}
        const cells=[];
        for(let i=0;i<weeks*7;i++){const day=new Date(start);day.setDate(start.getDate()+i);const key=iso(day),outside=day.getFullYear()!==year||key>today;
            if(outside){const blank=el('span','heatmap-cell heatmap-outside');blank.setAttribute('aria-hidden','true');grid.append(blank);continue;}
            const count=counts.get(key)||0,cell=el('a','heatmap-cell');cell.href=diaryHref(key);cell.dataset.date=key;cell.dataset.count=count;cell.dataset.level=Math.min(count,4);cell.tabIndex=-1;
            const label=new Intl.DateTimeFormat(locale(),{dateStyle:'full'}).format(day)+' · '+count+' '+t(count===1?'rating':'ratings');cell.setAttribute('aria-label',label);cell.dataset.noTranslate='';
            cell.addEventListener('pointerenter',()=>showTip(cell));cell.addEventListener('pointerleave',hideTip);cell.addEventListener('focus',()=>showTip(cell));cell.addEventListener('blur',hideTip);cells.push(cell);grid.append(cell);
        }
        const initial=cells.find(c=>c.dataset.date===today)||cells.at(-1);if(initial)initial.tabIndex=0;
        grid.addEventListener('keydown',event=>{const at=cells.indexOf(event.target);if(at<0)return;let next=at;const delta={ArrowUp:-1,ArrowDown:1,ArrowLeft:-7,ArrowRight:7};if(event.key in delta)next=at+delta[event.key];else if(event.key==='Home')next=0;else if(event.key==='End')next=cells.length-1;else if(event.key==='Escape'){hideTip();return;}else return;event.preventDefault();next=Math.max(0,Math.min(cells.length-1,next));cells.forEach((cell,i)=>cell.tabIndex=i===next?0:-1);cells[next].focus();});
        canvas.append(months,grid);layout.append(weekdays,canvas);scroll.append(layout);
        const footer=el('div','heatmap-footer'),hint=el('span','heatmap-mobile-hint','Scroll to see the full year.'),legend=el('div','heatmap-legend');legend.setAttribute('aria-hidden','true');legend.append(el('span','',t('Less')));for(let i=0;i<5;i++){const sample=el('span','heatmap-cell');sample.dataset.level=i;legend.append(sample);}legend.append(el('span','',t('More')));footer.append(hint,legend);content.append(summary,scroll,footer);if(!total)content.append(el('p','insight-empty','No ratings in this year yet.'));diaryLink.href=diaryHref();
    }
    async function load(player,own){
        if(player.profile.id==='local'||own){
            if(own)await window.Backlog.statusReady;
            const entries=await window.BacklogDiary.currentEntries(),calendar=entries.filter(row=>known(row.gameId)&&rated(row)&&window.Backlog.getStatus(row.gameId)?.id!=='want-to-play'&&window.BacklogDiary.validDate(row.reviewedOn)).map(row=>({gameId:row.gameId,day:row.reviewedOn}));
            const logged=new Set(),written=new Set();let ratings=0,completed=0;
            for(const game of window.BacklogGames){const review=player.profile.id==='local'?window.BacklogReviews.getDevice(game.id):account.getReview(game.id),status=window.Backlog.getStatus(game.id)?.id;if(review){logged.add(game.id);if(rated(review))ratings++;if(review.text?.trim())written.add(game.id);}if(status&&status!=='want-to-play')logged.add(game.id);if(['completed','platinum'].includes(status))completed++;}
            return {calendar,counts:{ratings,written:written.size,completed,logged:logged.size,lists:player.lists.filter(list=>list.is_public===true).length}};
        }
        const id=player.profile.id,rows=[];
        const readRows=(async()=>{for(let offset=0;;offset+=100){const batch=await api.publicDiary(id,null,offset);rows.push(...batch);if(batch.length<100)break;}})();
        const [,logged]=await Promise.all([readRows,api.loggedGames(id)]),byGame=new Map();for(const row of rows)if(known(row.game_id)&&!byGame.has(row.game_id))byGame.set(row.game_id,row);const unique=[...byGame.values()];
        return {calendar:unique.filter(row=>rated(row)&&row.status!=='want-to-play'&&window.BacklogDiary.validDate(row.public_date)).map(row=>({gameId:row.game_id,day:row.public_date})),counts:{ratings:unique.filter(rated).length,written:unique.filter(row=>Number(row.review_number)>0).length,completed:unique.filter(row=>['completed','platinum'].includes(row.status)).length,logged:new Set(logged.filter(row=>known(row.game_id)).map(row=>row.game_id)).size,lists:player.lists.filter(list=>list.is_public===true).length}};
    }
    async function render(player,own){
        current={player,own};const ticket=++version;root.hidden=false;data=null;hideTip();feedback.textContent='';content.replaceChildren(ui.loadingCards('Loading…',1));achievementHost.hidden=true;
        try{const next=await load(player,own);if(ticket!==version)return;data=next;const years=[...new Set([new Date().getFullYear(),...data.calendar.map(r=>Number(r.day.slice(0,4)))])].sort((a,b)=>b-a);if(!years.includes(selectedYear))selectedYear=years[0];yearSelect.replaceChildren(...years.map(year=>{const option=el('option','',year);option.value=year;return option;}));yearSelect.value=selectedYear;draw();window.BacklogAchievements?.render(achievementHost,data.counts);}
        catch{if(ticket!==version)return;content.replaceChildren();feedback.textContent='Could not load this activity calendar.';const retry=el('button','social-button social-button-quiet','Try again');retry.type='button';retry.addEventListener('click',()=>render(current.player,current.own));content.append(retry);window.BacklogAchievements?.error(achievementHost);}
    }
    yearSelect.addEventListener('change',()=>{selectedYear=Number(yearSelect.value);draw();});
    window.addEventListener('backlog-language-change',()=>{draw();if(data)window.BacklogAchievements?.render(achievementHost,data.counts);});
    function refresh(){if(current?.own){clearTimeout(timer);timer=setTimeout(()=>render(account.getState(),true),40);}}
    window.addEventListener('backlog-change',refresh);window.addEventListener('backlog-diary-change',refresh);window.addEventListener('backlog-account-change',()=>{++version;clearTimeout(timer);current=null;data=null;root.hidden=true;hideTip();});window.addEventListener('scroll',hideTip,{passive:true});
    window.BacklogProfileInsights={render};
})();
