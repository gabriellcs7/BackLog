/* Shared native dialog lifecycle for shortcuts and feedback. */
(() => {
 'use strict';
 function mount(dialog){let opener=null,closing=false,previousOverflow='';
  const reduced=()=>document.documentElement.dataset.presentationMotion==='reduced'||(document.documentElement.dataset.presentationMotion!=='full'&&matchMedia('(prefers-reduced-motion:reduce)').matches);
  function open(button){if(dialog.open)return;closing=false;opener=button||document.activeElement;previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';}
  function close(){if(!dialog.open||closing)return;closing=true;if(reduced()||!dialog.animate){dialog.close();return;}const a=dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(8px) scale(.985)'}],{duration:150,easing:'ease-in'});a.finished.then(()=>dialog.close(),()=>dialog.close());}
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-component-close]'))close();if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{closing=false;document.body.style.overflow=previousOverflow;opener?.isConnected&&opener.focus({preventScroll:true});});
  dialog.addEventListener('pointermove',event=>{if(window.BacklogPreferences?.get().cardGlow===false)return;const r=dialog.getBoundingClientRect();dialog.style.setProperty('--dialog-x',event.clientX-r.left+'px');dialog.style.setProperty('--dialog-y',event.clientY-r.top+'px');});
  return{open,close};
 }
 window.BacklogComponentDialog={mount};
})();