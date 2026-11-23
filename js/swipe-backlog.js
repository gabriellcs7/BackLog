/* Mobile shortcuts reveal actions; a swipe never saves a status by itself. */
(() => {
 'use strict';
 const mobile=matchMedia('(max-width:600px)'), states=new WeakMap();
 let opened=null;
 const text=(en,pt)=>window.BacklogPreferences?.get().language==='pt-BR'?pt:en;
 const el=(tag,cls,value)=>{const n=document.createElement(tag);n.className=cls;if(value)n.textContent=value;return n;};
 function close(){if(opened){states.get(opened)?.show(0);opened=null;}}
 function create(card,game){
  const row=el('div','swipe-backlog-row'),content=el('div','swipe-backlog-content');row.dataset.gameId=game.id;
  const toggle=el('button','swipe-backlog-toggle','⇄');toggle.type='button';toggle.setAttribute('aria-label',text('Status shortcuts for ','Atalhos de status de ')+game.title);toggle.setAttribute('aria-expanded','false');
  const playing=el('button','swipe-backlog-action swipe-backlog-playing',text('▷ Playing','▷ Jogando'));
  const completed=el('button','swipe-backlog-action swipe-backlog-completed',text('✓ Completed','✓ Zerado'));
  const feedback=el('p','swipe-backlog-feedback');feedback.setAttribute('role','status');
  for(const b of [playing,completed]){b.type='button';b.tabIndex=-1;b.setAttribute('aria-hidden','true');}
  content.append(card,toggle);row.append(playing,completed,content,feedback);
  let offset=0,gesture=null,suppressUntil=0,busy=false;
  function show(next){offset=next;row.style.setProperty('--swipe-offset',next+'px');toggle.setAttribute('aria-expanded',String(next!==0));row.classList.toggle('is-open',next!==0);
   playing.tabIndex=next>0?0:-1;completed.tabIndex=next<0?0:-1;
   playing.setAttribute('aria-hidden',String(next<=0));completed.setAttribute('aria-hidden',String(next>=0));
  }
  states.set(row,{show});
  function reveal(next){if(opened!==row)close();opened=next?row:null;show(next);}
  toggle.addEventListener('click',()=>{if(offset){close();return;}const next=window.Backlog.getStatus(game.id)?.id==='playing'?-100:100;reveal(next);(next>0?playing:completed).focus();});
  row.addEventListener('keydown',e=>{if(e.key==='Escape'&&offset){e.preventDefault();close();toggle.focus();}});
  content.addEventListener('dragstart',e=>{if(mobile.matches)e.preventDefault();});
  content.addEventListener('pointerdown',e=>{if(!mobile.matches||busy||e.button!==0||e.target.closest('button,input,select,textarea'))return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,base:offset,locked:false};});
  content.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
   if(!gesture.locked){if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;if(Math.abs(dy)>=Math.abs(dx)){gesture=null;return;}gesture.locked=true;if(opened!==row)close();content.setPointerCapture(e.pointerId);row.classList.add('is-dragging');}
   e.preventDefault();const next=Math.max(-100,Math.min(100,gesture.base+dx));row.style.setProperty('--swipe-offset',next+'px');
  },{passive:false});
  function end(e,cancel=false){if(!gesture||e.pointerId!==gesture.id)return;const g=gesture;gesture=null;row.classList.remove('is-dragging');if(g.locked){suppressUntil=Date.now()+450;const value=cancel?0:g.base+e.clientX-g.x;reveal(Math.abs(value)>35?Math.sign(value)*100:0);}}
  content.addEventListener('pointerup',e=>end(e));content.addEventListener('pointercancel',e=>end(e,true));
  content.addEventListener('click',e=>{if(Date.now()<suppressUntil&&!e.target.closest('button')){e.preventDefault();e.stopImmediatePropagation();}},true);
  async function save(status){if(busy)return;const owner=window.BacklogAccount?.user?.id||'local';busy=true;playing.disabled=completed.disabled=toggle.disabled=true;feedback.textContent='';
   try{await window.BacklogAccount?.ready;await window.Backlog.statusReady;if(owner!==(window.BacklogAccount?.user?.id||'local'))throw Error('account');await window.BacklogStatusActions.setStatus(game.id,status);close();
    requestAnimationFrame(()=>document.querySelector('.swipe-backlog-row[data-game-id="'+CSS.escape(game.id)+'"] .swipe-backlog-toggle')?.focus({preventScroll:true}));
   }catch{feedback.textContent=text('Could not save. Please try again.','Não foi possível salvar. Tente novamente.');}finally{busy=false;playing.disabled=completed.disabled=toggle.disabled=false;}
  }
  playing.addEventListener('click',()=>save('playing'));completed.addEventListener('click',()=>save('completed'));
  return row;
 }
 document.addEventListener('pointerdown',e=>{if(opened&&!opened.contains(e.target))close();},{passive:true});
 mobile.addEventListener('change',close);window.addEventListener('backlog-account-change',close);
 window.BacklogSwipeBacklog={create};
})();
