/* Opções só abrem por ação explícita; copiar continua disponível em localhost. */
(() => {
    'use strict';
    const el=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    let panel=null,active=null;
    function close(restore=false){if(panel)panel.hidden=true;if(active){const button=active;active=null;button.setAttribute('aria-expanded','false');if(restore)button.focus();}}
    function position(){if(!active||panel.hidden)return;if(!active.isConnected){close();return;}const rect=active.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight){close();return;}const left=Math.max(12,Math.min(innerWidth-panel.offsetWidth-12,rect.left)),top=rect.bottom+10+panel.offsetHeight<innerHeight?rect.bottom+10:Math.max(12,rect.top-panel.offsetHeight-10);panel.style.left=left+'px';panel.style.top=top+'px';}
    function open(button,options){
        if(active===button&&!panel.hidden){close();return;}close();
        if(!panel){panel=el('div','share-options');panel.id='backlog-share-options';panel.setAttribute('role','group');panel.setAttribute('aria-label','Sharing options');document.body.append(panel);}
        const url=new URL(typeof options.url==='function'?options.url():options.url||location.href,location.href);
        if(!['http:','https:','file:'].includes(url.protocol))return;
        const title=typeof options.title==='function'?options.title():options.title||document.title;
        active=button;panel.replaceChildren(el('strong','','Share this page'));panel.hidden=false;button.setAttribute('aria-expanded','true');
        const field=el('input');field.readOnly=true;field.type='text';field.value=url.href;field.setAttribute('aria-label','Page address');
        const actions=el('div','share-option-actions'),message=el('p','social-small');message.setAttribute('role','status');
        const copy=el('button','social-button','Copy link');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url.href);message.textContent='Link copied!';}catch{field.focus();field.select();message.textContent='Copy the selected address with Ctrl+C or your device’s copy menu.';}});actions.append(copy);
        if(navigator.share){const native=el('button','social-button','More options ↗');native.type='button';native.addEventListener('click',async()=>{try{await navigator.share({title,url:url.href});}catch(error){if(error.name!=='AbortError')message.textContent='Could not open sharing options. You can copy the link instead.';}});actions.append(native);}
        const local=url.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(url.hostname);
        if(!local)for(const [label,address] of [['WhatsApp','https://wa.me/?text='+encodeURIComponent(title+' '+url.href)],['X','https://twitter.com/intent/tweet?text='+encodeURIComponent(title)+'&url='+encodeURIComponent(url.href)]]){const a=el('a','social-button',label);a.href=address;a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}
        panel.append(field,actions,message);if(local)panel.append(el('small','share-local-note','Local preview address'));
        position();copy.focus({preventScroll:true});
    }
    function mount(button,options={}){if(button.dataset.shareControl)return button;button.dataset.shareControl='true';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','backlog-share-options');button.addEventListener('click',()=>open(button,options));return button;}
    window.BacklogShare={mount,button(options){const button=el('button','social-button share-review-button','↗ Share');button.type='button';return mount(button,options);}};
    document.addEventListener('pointerdown',event=>{if(active&&!panel.contains(event.target)&&!active.contains(event.target))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();close(true);}});
    document.addEventListener('focusin',event=>{if(active&&!panel.contains(event.target)&&!active.contains(event.target))close();});
    window.addEventListener('resize',()=>close());window.addEventListener('scroll',position,{passive:true});
})();
