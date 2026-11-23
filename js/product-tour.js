/* An explicitly requested, read-only tour. Only progress is kept in this tab. */
(() => {
 'use strict';
 const key='backlog:tour:v1',script=document.currentScript,base=new URL('../view/',script.src);
 const pt=()=>window.BacklogPreferences?.get().language==='pt-BR',t=(en,br)=>pt()?br:en;
 const steps=[
  ['pagina_jogos.html','.nav-search','Find your next game','Encontre seu próximo jogo','Search games and players from any page.','Pesquise jogos e pessoas em qualquer página.'],
  ['pagina_jogos.html','.catalog-selects','Make the catalog yours','Explore do seu jeito','Combine genres and statuses, then choose an order.','Combine gêneros e status e escolha uma ordem.'],
  ['pagina_jogos.html','[data-collection="saved"]','Your backlog','Seu backlog','Saved games are grouped into played, playing and want to play. On mobile, swipe a row to reveal status shortcuts.','Os jogos salvos ficam separados em jogados, jogando e quero jogar. No celular, deslize uma linha para revelar atalhos.'],
  ['game.html?id=minecraft','.game-status-options','Keep track of your games','Acompanhe seus jogos','Choose a collection status. You can change it whenever you like.','Escolha um status para sua coleção. Você pode mudá-lo quando quiser.'],
  ['game.html?id=minecraft','#review-tab','Tell your story','Conte sua experiência','Open the review editor to give stars, write a review and choose a date. Nothing is saved during this tour.','Abra o editor para dar estrelas, escrever uma review e escolher uma data. Nada é salvo durante este passeio.'],
  ['profile.html','#favorites-grid','Your favorite four','Seus quatro favoritos','Choose four favorites in Settings and drag their covers to arrange them. There is no ranking.','Escolha quatro favoritos nas configurações e arraste as capas para organizá-los. Eles não têm ranking.'],
  ['profile.html','#profile-list-section','Build a collection of ideas','Organize suas ideias','Create themed or ranked lists and share them from your profile.','Crie listas temáticas ou com ranking e compartilhe pelo seu perfil.'],
  ['diary.html','#diary-search','Your gaming diary','Seu diário de jogos','Revisit your rated games by date and search your past entries.','Reveja os jogos avaliados por data e pesquise seus registros anteriores.'],
  ['settings.html','#settings-appearance','Your space, your style','Seu espaço, seu estilo','Adjust language, animations and appearance here. You can restart this tour in Help.','Ajuste idioma, animações e aparência aqui. Você pode reiniciar este passeio em Ajuda.']
 ];
 let progress=null,dialog,frame,tip,title,body,count,previous,next,originFocus,raf;
 function read(){try{const p=JSON.parse(sessionStorage.getItem(key));return p&&Number.isInteger(p.step)&&p.step>=0&&p.step<steps.length&&Date.now()-p.time<1200000?p:null;}catch{return null;}}
 function store(index){try{sessionStorage.setItem(key,JSON.stringify({step:index,time:Date.now()}));return true;}catch{return false;}}
 function clear(){try{sessionStorage.removeItem(key);}catch{}}
 function stop(){clear();progress=null;if(dialog?.open)dialog.close();dialog?.remove();dialog=null;cancelAnimationFrame(raf);originFocus?.isConnected&&originFocus.focus({preventScroll:true});}
 function matches(url){return location.pathname===url.pathname&&(!url.search||new URLSearchParams(location.search).get('id')===url.searchParams.get('id'));}
 function go(index){if(index>=steps.length){stop();return;}if(!store(index))return;const url=new URL(steps[index][0],base);if(matches(url)){progress={step:index,time:Date.now()};show();}else location.assign(url.href);}
 function start(){if(document.querySelector('dialog[open]'))return;originFocus=document.activeElement;if(!store(0)){const f=document.querySelector('#tour-feedback');if(f)f.textContent=t('Allow tab storage to start the tour.','Permita o armazenamento da aba para iniciar o passeio.');return;}go(0);}
 function button(label,cls,click){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',click);return b;}
 function build(){if(dialog)return;dialog=document.createElement('dialog');dialog.className='backlog-tour';dialog.setAttribute('aria-labelledby','tour-title');dialog.setAttribute('aria-describedby','tour-body');dialog.dataset.noTranslate='';
  frame=document.createElement('div');frame.className='backlog-tour-frame';frame.setAttribute('aria-hidden','true');
  tip=document.createElement('section');tip.className='backlog-tour-tip';count=document.createElement('p');count.className='backlog-tour-count';count.setAttribute('aria-live','polite');
  title=document.createElement('h2');title.id='tour-title';body=document.createElement('p');body.id='tour-body';
  const controls=document.createElement('div');controls.className='backlog-tour-controls';previous=button(t('Back','Voltar'),'social-button',()=>go(progress.step-1));next=button('','social-button social-button-primary',()=>go(progress.step+1));
  const skip=button(t('End tour','Encerrar passeio'),'backlog-tour-close',stop);controls.append(previous,next);tip.append(count,skip,title,body,controls);dialog.append(frame,tip);document.body.append(dialog);
  dialog.addEventListener('cancel',e=>{e.preventDefault();stop();});
  dialog.addEventListener('keydown',e=>{if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('button:not(:disabled)')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if(e.key==='ArrowRight'){e.preventDefault();go(progress.step+1);}if(e.key==='ArrowLeft'&&progress.step>0){e.preventDefault();go(progress.step-1);}});
  dialog.showModal();
 }
 function target(){const found=document.querySelector(steps[progress.step][1]);return found&&found.getBoundingClientRect().width>0?found:null;}
 function position(){if(!dialog?.open||!progress)return;const node=target(),box=node?.getBoundingClientRect(),w=innerWidth,h=innerHeight;
  frame.hidden=!box;const pad=8;if(box){Object.assign(frame.style,{left:Math.max(4,box.left-pad)+'px',top:Math.max(4,box.top-pad)+'px',width:Math.min(w-8,box.width+pad*2)+'px',height:Math.min(h-8,box.height+pad*2)+'px'});}
  const tw=tip.offsetWidth,th=tip.offsetHeight;let x=box?Math.min(w-tw-14,Math.max(14,box.left)):Math.max(14,(w-tw)/2),y=box?box.bottom+22:(h-th)/2;
  if(y+th>h-14)y=box?box.top-th-22:h-th-14;
  if(y<14)y=Math.max(14,(h-th)/2);
  tip.style.left=x+'px';tip.style.top=Math.max(14,Math.min(h-th-14,y))+'px';
 }
 function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(position);}
 function show(){if(!progress)return;build();const s=steps[progress.step];title.textContent=pt()?s[3]:s[2];body.textContent=pt()?s[5]:s[4];count.textContent=t('BACKLOG TOUR','PASSEIO PELO BACKLOG')+' · '+(progress.step+1)+' / '+steps.length;previous.disabled=progress.step===0;next.textContent=progress.step===steps.length-1?t('Finish','Concluir'):t('Next','Próximo');
  target()?.scrollIntoView({block:'center',behavior:'instant'});position();next.focus({preventScroll:true});
 }
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);
 document.querySelector('#start-product-tour')?.addEventListener('click',start);
 const explicit=new URL(location.href);if(explicit.searchParams.get('tour')==='1'&&location.pathname.endsWith('/settings.html')){explicit.searchParams.delete('tour');history.replaceState(null,'',explicit);start();}
 else{progress=read();if(progress){if(matches(new URL(steps[progress.step][0],base))){Promise.race([Promise.resolve(window.BacklogAccount?.ready),new Promise(r=>setTimeout(r,2500))]).then(()=>{if(progress)show();});}else clear();}}
 window.addEventListener('pagehide',()=>{if(dialog?.open)dialog.close();});
 window.addEventListener('pageshow',e=>{if(e.persisted){progress=read();if(progress&&matches(new URL(steps[progress.step][0],base)))show();else stop();}});
 window.BacklogTour={start,stop};
})();
