/* Derived public statistics. No reviews or statuses are changed by this module. */
(() => {
 'use strict';const account=window.BacklogAccount,games=window.BacklogGames,byId=new Map(games.map(g=>[g.id,g]));
 const dateKey=value=>{if(!value)return null;const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;const parts=new Intl.DateTimeFormat('en',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),get=k=>parts.find(p=>p.type===k).value;return get('year')+'-'+get('month')+'-'+get('day');};
 const today=()=>dateKey(new Date());
 function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>today())return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
 const score=value=>value!=null&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=.5&&Number(value)<=5&&Number.isInteger(Number(value)*2)?Number(value):null;
 function normalize(statuses,reviews,profile){return {profile,statuses:statuses.filter(row=>byId.has(row.game_id)&&window.Backlog.statusOptions.some(s=>s.id===row.status)).map(row=>({...row,date:dateKey(row.updated_at)})),reviews:reviews.filter(row=>byId.has(row.game_id)).map(row=>({...row,rating:score(row.rating),date:validDate(row.reviewed_on)?row.reviewed_on:dateKey(row.updated_at||row.created_at)}))};}
 async function rows(table,fields,id){const result=[];for(let offset=0;;offset+=500){const batch=await account.client.from(table).select(fields).eq('user_id',id).order('game_id').range(offset,offset+499);if(batch.error)throw Error(batch.error.message||'Could not load statistics. Please try again.');result.push(...(batch.data||[]));if(!batch.data||batch.data.length<500)break;}return result;}
 async function load(id){await account.ready;const owner=account.user?.id||null;
  if(id==='local'){
   if(owner)throw Error('Sign out to view your device statistics.');
   const statuses=[],reviews=[];
   for(const game of games){const status=window.Backlog.getStatus(game.id,null),review=window.BacklogReviews.getDevice(game.id);if(status)statuses.push({game_id:game.id,status:status.id,updated_at:localStorage.getItem('backlog:status-date:local:'+game.id)});if(review)reviews.push({game_id:game.id,rating:review.rating,reviewed_on:review.reviewedOn,updated_at:review.updatedAt});}
   return normalize(statuses,reviews,account.getState().profile);
  }
  if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Profile not found.');
  if(!account.client)throw Error('Online accounts are not connected yet.');
  if(id===owner){await window.Backlog.statusReady;if((account.user?.id||null)!==owner)throw Error('Your account changed. Please try again.');}
  const [player,statuses,reviews]=await Promise.all([account.getProfile(id),rows('game_statuses','game_id,status,updated_at',id),rows('reviews','game_id,rating,reviewed_on,updated_at,created_at',id)]);
  if((account.user?.id||null)!==owner)throw Error('Your account changed. Please try again.');
  if(!player.profile)throw Error('Profile not found.');return normalize(statuses,reviews,player.profile);
 }
 function years(data){const current=Number(today().slice(0,4)),values=new Set([current,current-1]);for(const row of [...data.statuses,...data.reviews])if(validDate(row.date))values.add(Number(row.date.slice(0,4)));return [...values].sort((a,b)=>b-a);}
 function summarize(data,year){
  const statuses=new Map(data.statuses.map(s=>[s.game_id,s])),reviews=new Map(data.reviews.map(s=>[s.game_id,s])),logged=new Set(reviews.keys()),annual=new Set(),monthly=Array(12).fill(0),completedGames=Array.from({length:12},()=>[]),counts=Array(10).fill(0),genres=new Map(),highest=[];
  const inYear=(row,y=year)=>validDate(row.date)&&Number(row.date.slice(0,4))===y;
  let sum=0,ratingCount=0,completed=0,previousCompleted=0,wantCount=0;
  const collection={completed:0,played:0,platinum:0,playing:0,dropped:0,reviewed:0};
  for(const row of statuses.values()){
   if(row.status==='want-to-play')wantCount++;else{logged.add(row.game_id);if(inYear(row))annual.add(row.game_id);}
   if(['completed','platinum'].includes(row.status)){
    if(inYear(row)){const month=Number(row.date.slice(5,7))-1;monthly[month]++;completed++;completedGames[month].push(byId.get(row.game_id));}
    if(inYear(row,year-1))previousCompleted++;
   }
  }
  for(const row of reviews.values())if(inYear(row)){annual.add(row.game_id);if(row.rating!==null){counts[row.rating*2-1]++;sum+=row.rating;ratingCount++;highest.push({game:byId.get(row.game_id),rating:row.rating});}}
  for(const id of logged){const status=statuses.get(id)?.status;collection[status&&status!=='want-to-play'?status:'reviewed']++;}
  for(const id of annual){const genre=byId.get(id).genre||'Other';genres.set(genre,(genres.get(genre)||0)+1);}
  return {year,completed,previousCompleted,monthly,completedGames,loggedCount:annual.size,loggedAll:logged.size,wantCount,collection,ratingCount,average:ratingCount?sum/ratingCount:null,counts,genreCount:genres.size,genres:[...genres].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),highest:highest.sort((a,b)=>b.rating-a.rating||a.game.title.localeCompare(b.game.title)).slice(0,4)};
 }
 window.BacklogGamingStatistics={load,years,summarize,today,validDate};
})();
