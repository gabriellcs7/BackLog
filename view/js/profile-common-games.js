(() => {
 'use strict';const account=window.BacklogAccount,ui=window.BacklogUI,api=window.BacklogCommonGames,host=document.querySelector('#profile-common-games'),grid=document.querySelector('#profile-common-grid'),feedback=document.querySelector('#profile-common-feedback'),link=document.querySelector('#profile-common-link'),count=document.querySelector('#profile-common-count');
 let version=0,current=null;const t=s=>window.BacklogI18n?.t(s)||s;
 async function render(player,own){current={player,own};const ticket=++version;grid.replaceChildren();feedback.replaceChildren();link.hidden=true;count.textContent='';host.removeAttribute('aria-busy');host.hidden=own;
  if(own)return;
  if(!account.user){feedback.append(document.createTextNode(t('Sign in to see which games you have in common.')+' '));const login=ui.element('a','player-link',t('Sign in ↗'));login.href=ui.href('view/profile.html#account');feedback.append(login);return;}
  host.setAttribute('aria-busy','true');feedback.textContent=t('Finding your shared games…');
  try{const data=await api.load(player.profile.id);if(ticket!==version)return;
   feedback.textContent=data.items.length?t('Compare your ratings side by side.') :t('No games in common yet.');
   count.textContent=data.items.length+' '+t(data.items.length===1?'shared game':'shared games');
   grid.replaceChildren(...data.items.slice(0,6).map(item=>api.card(item,player.profile,data)));
   link.href=ui.href('view/common-games.html?id='+encodeURIComponent(player.profile.id));link.hidden=!data.items.length;
  }catch{if(ticket===version){feedback.textContent=t('Could not compare games. Please try again.');const retry=ui.element('button','social-button',t('Try again'));retry.type='button';retry.addEventListener('click',()=>render(player,own));feedback.append(document.createTextNode(' '),retry);}}
  finally{if(ticket===version)host.removeAttribute('aria-busy');}
 }
 window.addEventListener('backlog-account-change',()=>{++version;host.hidden=true;host.removeAttribute('aria-busy');grid.replaceChildren();});
 window.addEventListener('backlog-change',()=>{if(current&&!account.loading)render(current.player,current.own);});
 window.addEventListener('backlog-language-change',()=>{if(current&&!account.loading)render(current.player,current.own);});
 window.BacklogProfileCommonGames={render};
})();
