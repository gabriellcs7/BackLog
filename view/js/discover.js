/* Swipe choices reuse the collection API. Skipping never changes saved data. */
(() => {
 'use strict';const account=window.BacklogAccount,api=window.Backlog,ui=window.BacklogUI,$=id=>document.getElementById('discover-'+id),t=s=>window.BacklogI18n?.t(s)||s,deck=$('deck');
 let queue=[],history=[],busy=true,generation=0,gesture=null,currentOwner=null,feedbackKey='Drag a cover, or use the buttons below.',loadFailed=false;
 const owner=()=>account.user?.id||'local',eligible=game=>!api.getStatus(game.id)&&!window.BacklogReviews.get(game.id);
 const reduced=()=>window.BacklogMotion?.matches??matchMedia('(prefers-reduced-motion:reduce)').matches;
 function say(message){feedbackKey=message;$('feedback').textContent=t(message);}
 function shuffled(games){const result=[...games];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
 function controls(){const empty=!queue.length;for(const id of ['skip','want'])$(id).disabled=busy||empty;$('undo').disabled=busy||!history.length;$('restart').disabled=busy;deck.setAttribute('aria-busy',String(busy));$('position').textContent=empty?t('No games remaining'):(history.length+1)+' / '+(queue.length+history.length);$('game-link').hidden=empty;if(!empty)$('game-link').href=ui.href('view/game.html?id='+encodeURIComponent(queue[0].id));}
 function clearGesture(card){gesture=null;card?.classList.remove('is-dragging');if(card){card.style.transform='';card.querySelectorAll('.swipe-discover-stamp').forEach(s=>s.style.opacity='0');}}
 function card(game,depth){const n=ui.element('article','swipe-discover-card '+(depth?'swipe-discover-ghost'+depth:'swipe-discover-active')),img=ui.element('img');img.src=ui.href('imagens/capas/'+game.cover);img.alt='';img.draggable=false;n.append(img);
  if(depth){n.setAttribute('aria-hidden','true');return n;}n.tabIndex=0;n.dataset.gameId=game.id;n.setAttribute('aria-label',game.title+'. '+t('Use the arrow keys to skip or save this game.'));
  const overlay=ui.element('div','swipe-discover-card-overlay'),name=ui.element('h2','',game.title),meta=ui.element('div','swipe-discover-card-meta',[game.year,...game.tags.slice(0,2)].filter(Boolean).join(' · '));name.dataset.noTranslate='';meta.dataset.noTranslate='';overlay.append(name,meta);n.append(overlay);
  for(const [type,label]of [['want','WANT TO PLAY'],['skip','SKIP']]){const stamp=ui.element('span','swipe-discover-stamp swipe-discover-'+type,t(label));stamp.setAttribute('aria-hidden','true');n.append(stamp);}
  n.addEventListener('dragstart',e=>e.preventDefault());n.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,locked:false};});
  n.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId||busy)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(!gesture.locked){if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;if(Math.abs(dy)>Math.abs(dx)){clearGesture(n);return;}gesture.locked=true;n.setPointerCapture(e.pointerId);n.classList.add('is-dragging');}e.preventDefault();n.style.transform='translateX('+dx+'px) rotate('+(dx/18)+'deg)';n.querySelector('.swipe-discover-want').style.opacity=Math.max(0,Math.min(1,dx/90));n.querySelector('.swipe-discover-skip').style.opacity=Math.max(0,Math.min(1,-dx/90));},{passive:false});
  function end(e,cancel=false){if(!gesture||e.pointerId!==gesture.id)return;const dx=e.clientX-gesture.x,locked=gesture.locked;gesture=null;n.classList.remove('is-dragging');if(locked&&!cancel&&Math.abs(dx)>80)choose(dx>0?'want':'skip');else clearGesture(n);}
  n.addEventListener('pointerup',e=>end(e));n.addEventListener('pointercancel',e=>end(e,true));return n;
 }
 function draw(){deck.replaceChildren();for(let i=Math.min(2,queue.length-1);i>=0;i--)deck.append(card(queue[i],i));if(!queue.length){const empty=ui.element('div','swipe-discover-empty');empty.append(ui.element('h2','',t(loadFailed?'Could not load games.':'All caught up.')),ui.element('p','',t(loadFailed?'Refresh the selection to try again.':'Explore again to revisit skipped games, or browse the full catalog.')));const link=ui.element('a','social-button',t('Browse games ↗'));link.href=ui.href('view/pagina_jogos.html');empty.append(link);deck.append(empty);}controls();}
 async function animateOut(card,kind){if(!card||reduced())return;try{await card.animate([{transform:getComputedStyle(card).transform},{transform:'translateX('+(kind==='want'?420:-420)+'px) rotate('+(kind==='want'?18:-18)+'deg)',opacity:0}],{duration:250,easing:'ease-in',fill:'forwards'}).finished;}catch{}}
 function restoreFocus(previous){if(document.activeElement===document.body||document.activeElement===deck){if(previous?.isConnected&&!previous.disabled)previous.focus({preventScroll:true});else deck.querySelector('.swipe-discover-active')?.focus({preventScroll:true});}}
 async function choose(kind){if(busy||!queue.length)return;const game=queue[0],ticket=generation,who=owner(),focus=document.activeElement,active=deck.querySelector('.swipe-discover-active');busy=true;controls();
  try{await account.ready;await api.statusReady;if(ticket!==generation||owner()!==who)return;if(!eligible(game)){queue.shift();say('This game is already in your collection.');return;}if(kind==='want')await api.setStatus(game.id,'want-to-play');if(ticket!==generation||owner()!==who)return;queue.shift();history.push({game,kind,owner:who});await animateOut(active,kind);if(ticket===generation&&owner()===who){feedbackKey=kind==='want'?'Added to Want to play.':'Skipped. You can revisit it later.';$('feedback').textContent=game.title+' · '+t(feedbackKey);}}
  catch(error){if(ticket===generation)say(error.message||'Could not save this game. Please try again.');}
  finally{if(ticket===generation){busy=false;queue=queue.filter(eligible);draw();restoreFocus(focus);}}
 }
 async function undo(){if(busy||!history.length)return;const last=history.at(-1),ticket=generation,who=owner(),focus=document.activeElement;busy=true;controls();
  try{await account.ready;await api.statusReady;if(ticket!==generation||owner()!==who||last.owner!==who)return;
   if(last.kind==='want'){if(api.getStatus(last.game.id)?.id!=='want-to-play'||window.BacklogReviews.get(last.game.id)){history.pop();say('This game changed elsewhere. Its current status was kept.');return;}await api.removeStatus(last.game.id);}
   if(ticket!==generation||owner()!==who)return;history.pop();if(eligible(last.game)){queue=queue.filter(g=>g.id!==last.game.id);queue.unshift(last.game);}say('Choice undone.');
  }catch(error){if(ticket===generation)say(error.message||'Could not undo. Please try again.');}
  finally{if(ticket===generation){busy=false;queue=queue.filter(eligible);draw();restoreFocus(focus);}}
 }
 async function load(){const ticket=++generation;busy=true;loadFailed=false;queue=[];history=[];gesture=null;deck.replaceChildren();controls();say('Loading your next games…');
  try{await account.ready;await api.statusReady;if(ticket!==generation)return;currentOwner=owner();if(account.user&&(account.error||api.syncError))throw Error('Could not load your collection. Please try again.');queue=shuffled(window.BacklogGames.filter(eligible));say('Drag a cover, or use the buttons below.');}
  catch(error){if(ticket===generation){loadFailed=true;say(error.message||'Could not load your collection. Please try again.');}}
  finally{if(ticket===generation){busy=false;draw();}}
 }
 $('skip').addEventListener('click',()=>choose('skip'));$('want').addEventListener('click',()=>choose('want'));$('undo').addEventListener('click',undo);$('restart').addEventListener('click',load);
 document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||!e.target.closest('#main')||e.target.closest('input,textarea,select,[contenteditable=true]')||document.querySelector('dialog[open]'))return;if(e.key==='ArrowRight'){e.preventDefault();choose('want');}else if(e.key==='ArrowLeft'){e.preventDefault();choose('skip');}else if(e.key.toLowerCase()==='z'){e.preventDefault();undo();}});
 window.addEventListener('backlog-account-change',load);function reconcile(){if(busy)return;if(owner()!==currentOwner){load();return;}queue=queue.filter(eligible);draw();}window.addEventListener('backlog-change',reconcile);window.addEventListener('backlog-review-change',reconcile);window.addEventListener('storage',reconcile);window.addEventListener('backlog-language-change',()=>{if(!busy)draw();$('feedback').textContent=t(feedbackKey);});account.ready.then(load);
 const nav=[...document.querySelectorAll('#navigation a')].find(a=>a.getAttribute('href')?.endsWith('pagina_jogos.html'));nav?.classList.add('active');nav?.setAttribute('aria-current','page');
})();
