/* Aviso discreto de novidades; não altera o feed até a pessoa clicar. */
(() => {
    'use strict';const ui=window.BacklogUI,t=s=>window.BacklogI18n?.t(s)||s;
    function create(onOpen){const host=ui.element('div','new-items-host'),button=ui.element('button','new-items-pill');button.hidden=true;button.type='button';const icon=ui.element('span','','↑'),label=ui.element('span');label.setAttribute('aria-live','polite');label.setAttribute('aria-atomic','true');icon.setAttribute('aria-hidden','true');button.append(icon,label);host.append(button);let count=0,plus=false;
        function draw(){label.textContent=count+(plus?'+':'')+' '+t(count===1?'new activity':'new activities');button.setAttribute('aria-label',label.textContent+' · '+t('View latest'));}
        button.addEventListener('click',async()=>{button.disabled=true;try{await onOpen();}finally{button.disabled=false;}});
        window.addEventListener('backlog-language-change',draw);
        return {host,set(next,more=false){const was=button.hidden;count=next;plus=more;button.hidden=!count;draw();if(was&&count&&!(window.BacklogMotion?.matches??matchMedia('(prefers-reduced-motion:reduce)').matches))button.animate([{opacity:0,transform:'translateY(-8px) scale(.95)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});}};
    }
    window.BacklogNewItems={create};
})();
