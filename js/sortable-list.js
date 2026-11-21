/* Reordena o rascunho pelo puxador; os dados só são gravados em Save list. */
(() => {
    'use strict';
    window.BacklogSortable={attach(container,onMove){
        let drag=null,frame=0;const dialog=container.closest('dialog');
        function clear(){cancelAnimationFrame(frame);frame=0;if(drag){drag.row.style.transform='';drag.row.classList.remove('is-sorting');}container.querySelectorAll('.sort-drop-before,.sort-drop-after').forEach(n=>n.classList.remove('sort-drop-before','sort-drop-after'));drag=null;}
        function target(){if(!drag)return;const others=[...container.children].filter(n=>n!==drag.row),index=others.filter(n=>{const r=n.getBoundingClientRect();return drag.y>r.top+r.height/2;}).length;drag.to=index;container.querySelectorAll('.sort-drop-before,.sort-drop-after').forEach(n=>n.classList.remove('sort-drop-before','sort-drop-after'));const next=others[index];if(next)next.classList.add('sort-drop-before');else others.at(-1)?.classList.add('sort-drop-after');}
        function scroll(){if(!drag)return;if(drag.moved){const rect=dialog.getBoundingClientRect(),edge=52,speed=drag.y<rect.top+edge?-9:drag.y>rect.bottom-edge?9:0;if(speed){dialog.scrollTop+=speed;target();}}frame=requestAnimationFrame(scroll);}
        container.addEventListener('pointerdown',event=>{const handle=event.target.closest('.sort-game-handle');if(!handle||event.button!==0)return;const row=handle.closest('[data-game]');drag={id:row.dataset.game,row,handle,pointer:event.pointerId,start:event.clientY,y:event.clientY,to:[...container.children].indexOf(row),moved:false};handle.setPointerCapture(event.pointerId);frame=requestAnimationFrame(scroll);});
        container.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.pointer)return;drag.y=event.clientY;if(Math.abs(drag.y-drag.start)>6)drag.moved=true;if(!drag.moved)return;event.preventDefault();drag.row.classList.add('is-sorting');drag.row.style.transform=`translateY(${drag.y-drag.start}px)`;target();});
        container.addEventListener('pointerup',event=>{if(!drag||event.pointerId!==drag.pointer)return;const {id,to,moved}=drag;clear();if(moved)onMove(id,to);});
        for(const type of ['pointercancel','lostpointercapture'])container.addEventListener(type,clear);
        container.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){event.preventDefault();event.stopPropagation();clear();return;}const handle=event.target.closest('.sort-game-handle');if(!handle||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const row=handle.closest('[data-game]'),index=[...container.children].indexOf(row),to=event.key==='Home'?0:event.key==='End'?container.children.length-1:index+(event.key==='ArrowUp'?-1:1);onMove(row.dataset.game,to);});
        dialog.addEventListener('close',clear);
    }};
})();
