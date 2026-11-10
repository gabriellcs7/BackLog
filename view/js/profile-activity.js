(() => {
    'use strict';
    const account=window.BacklogAccount,api=window.BacklogCommunity,ui=window.BacklogUI,$=id=>document.getElementById(id);
    let version=0,current=null;
    async function localData(player){
        const year=new Date().getFullYear(),logged=new Set(),annual=new Set(),recent=[];
        for(const item of window.BacklogGames){
            const review=window.BacklogReviews.getDevice(item.id),status=window.Backlog.getStatus(item.id),date=localStorage.getItem('backlog:status-date:local:'+item.id);
            if(review)logged.add(item.id);if(status&&status.id!=='want-to-play')logged.add(item.id);
            if(status&&status.id!=='want-to-play'&&date&&new Date(date).getFullYear()===year)annual.add(item.id);
            let latest=review?{game_id:item.id,kind:'rating',rating:review.rating,created_at:review.updatedAt}:null;
            if(status&&date&&(!latest||date>latest.created_at))latest={game_id:item.id,kind:'status',status:status.id,created_at:date};if(latest)recent.push(latest);
        }
        for(const entry of await window.BacklogDiary.entries())if(Number(entry.reviewedOn.slice(0,4))===year)annual.add(entry.gameId);
        return {metrics:{played_this_year:annual.size,list_count:player.lists.length,logged_games:logged.size},recent:recent.sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,8)};
    }
    async function render(player,own){
        current={player,own};const ticket=++version,year=new Date().getFullYear();$('metrics-feedback').textContent='';$('recent-feedback').textContent='';
        try{
            let data;if(player.profile.id==='local')data=await localData(player);
            else{if(own)await window.Backlog.statusReady;const [metrics,recent]=await Promise.all([api.metrics(player.profile.id,year),api.recent(player.profile.id)]);data={metrics,recent};}
            if(ticket!==version)return;$('profile-metrics').replaceChildren();
            for(const [value,label]of[[data.metrics.played_this_year,'Played in '+year],[data.metrics.list_count,own?'Lists':'Public lists'],[data.metrics.logged_games,'Games logged']]){const stat=ui.element('div','profile-stat');stat.append(ui.element('strong','',value),ui.element('span','',label));$('profile-metrics').append(stat);}
            const grid=$('profile-recent-games');grid.replaceChildren();
            for(const entry of data.recent){const item=ui.game(entry.game_id);if(!item)continue;const card=ui.gameCard(item.id);card.classList.add('recent-game-card');if(entry.review_id)card.href=ui.href('view/game.html?id='+encodeURIComponent(item.id)+'#review-'+entry.review_id);
                const label=entry.kind==='rating'?(entry.rating===null?'Reviewed':entry.rating+' / 5 ★'):window.Backlog.statusOptions.find(s=>s.id===entry.status)?.label||'Updated collection';
                const date=ui.element('time','social-small',ui.date(entry.created_at));date.dateTime=entry.created_at;card.append(ui.element('p','recent-game-label',label),date);grid.append(card);}
            if(!grid.children.length)grid.append(ui.element('p','social-empty','No recent activity yet. Rate a game or choose a status to start your story.'));
        }catch(error){if(ticket===version){$('profile-metrics').replaceChildren();$('profile-recent-games').replaceChildren();$('metrics-feedback').textContent='Could not load statistics. '+error.message;$('recent-feedback').textContent='Recent activity is unavailable. Please try again.';}}
    }
    window.addEventListener('backlog-change',()=>{if(current)render(current.own?account.getState():current.player,current.own);});
    window.addEventListener('backlog-review-change',()=>{if(current)render(current.own?account.getState():current.player,current.own);});
    window.BacklogProfileActivity={render};
})();
