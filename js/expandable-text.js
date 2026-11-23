/* Texto expansível e movimento padrão dos controles de ler/ver/carregar mais. */
(() => {
    'use strict';const t=s=>window.BacklogI18n?.t(s)||s,states=new Map();let serial=0,scheduled=false;
    const targets='.about-section>p,#profile-bio,#list-page-description,.glass-folder-description,.community-review-text,#review-saved-text,.home-review-copy';
    function reduced(){return window.BacklogMotion?.matches??matchMedia('(prefers-reduced-motion:reduce)').matches;}
    function measure(state){const {node,button,wrapper,lines}=state;if(!node.isConnected){states.delete(node);return;}if(!node.getClientRects().length){button.hidden=true;return;}const css=getComputedStyle(node),line=parseFloat(css.lineHeight)||parseFloat(css.fontSize)*1.7;state.limit=line*lines;wrapper.style.setProperty('--collapse-height',state.limit+'px');button.hidden=node.scrollHeight<=state.limit+2;}
    function mount(node,lines=4){if(states.has(node)||node.closest('a')&&node.tagName!=='A'||node.closest('dialog,.game-review-marquee,.review-wall-group'))return;
        const wrapper=document.createElement('div');wrapper.className='expandable-text';const button=document.createElement('button');button.type='button';button.className='expandable-toggle more-control';button.textContent=t('Read more');button.hidden=true;button.setAttribute('aria-expanded','false');if(!node.id)node.id='expandable-copy-'+(++serial);button.setAttribute('aria-controls',node.id);node.before(wrapper);wrapper.append(node,button);node.classList.add('expandable-body');
        const state={node,button,wrapper,lines,limit:0,expanded:false};states.set(node,state);
        button.addEventListener('click',()=>{const before=node.getBoundingClientRect().height;state.expanded=!state.expanded;wrapper.classList.toggle('is-expanded',state.expanded);button.setAttribute('aria-expanded',String(state.expanded));button.textContent=t(state.expanded?'Read less':'Read more');const after=state.expanded?node.scrollHeight:state.limit;if(!reduced())node.animate([{maxHeight:before+'px'},{maxHeight:after+'px'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});});measure(state);
        let width=0;new ResizeObserver(entries=>{const next=entries[0]?.contentRect.width;if(next!==width){width=next;measure(state);}}).observe(wrapper);
    }
    const morePattern=/^(read more|read less|see more|load more|show more|show less|ler mais|ler menos|ver mais|carregar mais|mostrar mais|mostrar menos)\b/i;
    function scan(){scheduled=false;for(const node of document.querySelectorAll(targets))mount(node,node.matches('.community-review-text')?8:node.id==='profile-bio'?3:4);for(const state of states.values())measure(state);
        for(const button of document.querySelectorAll('button,a.social-button,a.text-link')){if(button.closest('[data-no-translate],.library-card,.profile-review-card,.review-text-link'))continue;const text=button.textContent.trim();if(morePattern.test(text)){button.classList.add('more-control');button.classList.toggle('more-has-arrow',/[↗→↓↑]$/.test(text));}}
    }
    function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(scan);}}
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('backlog-language-change',()=>{for(const s of states.values())s.button.textContent=t(s.expanded?'Read less':'Read more');schedule();});window.addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);scan();window.BacklogExpandableText={mount};
})();
