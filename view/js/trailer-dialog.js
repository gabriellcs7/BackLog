/* Trailer em uma janela sobre o jogo; o link original para o YouTube permanece. */
(() => {
    const trigger=document.querySelector('#game-trailer-link'),ui=window.BacklogUI;
    if(!trigger||!ui||!HTMLDialogElement.prototype.showModal)return;
    const game=ui.game(new URLSearchParams(location.search).get('id'))||window.BacklogGames[0];
    const trailer=window.BacklogGameTrailers?.[game.id];if(!trailer||!/^[-\w]{11}$/.test(trailer.videoId))return;
    const el=ui.element,dialog=el('dialog','trailer-dialog');dialog.setAttribute('aria-labelledby','trailer-dialog-title');
    const heading=el('div','trailer-dialog-heading'),copy=el('div'),title=el('h2','',game.title);title.id='trailer-dialog-title';copy.append(el('span','eyebrow','WATCH TRAILER'),title,el('p','social-small',trailer.channel));
    const close=el('button','trailer-close','×');close.type='button';close.setAttribute('aria-label','Close trailer');heading.append(copy,close);
    const stage=el('div','trailer-video-stage'),loading=el('p','trailer-loading','Loading trailer…');loading.setAttribute('role','status');stage.append(loading);
    const footer=el('div','trailer-dialog-footer'),note=el('span','','Prefer to watch on YouTube?'),external=el('a','social-button social-button-quiet','Open on YouTube ↗');external.href=trigger.href;external.target='_blank';external.rel='noopener noreferrer';footer.append(note,external);dialog.append(heading,stage,footer);document.body.append(dialog);
    let iframe=null;
    trigger.addEventListener('click',event=>{
        if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        event.preventDefault();dialog.showModal();
        iframe=el('iframe');iframe.title=game.title+' trailer on YouTube';iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
        iframe.src='https://www.youtube-nocookie.com/embed/'+trailer.videoId+'?autoplay=1&rel=0';
        iframe.addEventListener('load',()=>{loading.hidden=true;},{once:true});loading.hidden=false;stage.append(iframe);close.focus();
    });
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{iframe?.remove();iframe=null;loading.hidden=false;trigger.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
})();
