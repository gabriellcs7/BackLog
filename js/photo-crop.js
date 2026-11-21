/* Recorte local com zoom e prévia circular; só o perfil salvo envia a foto. */
(() => {
    'use strict';
    const el=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    window.BacklogPhotoCrop={open(image){return new Promise((resolve,reject)=>{
        const dialog=el('dialog','social-dialog photo-crop-dialog');dialog.setAttribute('aria-labelledby','photo-crop-title');
        const title=el('h2','','Adjust your photo');title.id='photo-crop-title';
        const help=el('p','social-small','Drag to position your photo. Use the slider to zoom, or arrow keys to move the image.');
        const canvas=el('canvas','photo-crop-canvas');canvas.width=canvas.height=384;canvas.tabIndex=0;canvas.setAttribute('aria-label','Photo position; use arrow keys to adjust');
        const label=el('label','','Zoom'),zoom=el('input');zoom.type='range';zoom.min='1';zoom.max='3';zoom.step='.01';zoom.value='1';label.append(zoom);
        const feedback=el('p','social-feedback');feedback.setAttribute('role','status');
        const actions=el('div','social-actions'),apply=el('button','social-button social-button-primary','Use photo'),cancel=el('button','social-button','Cancel'),reset=el('button','social-button social-button-quiet','Center');
        for(const b of [apply,cancel,reset])b.type='button';actions.append(apply,cancel,reset);dialog.append(title,help,canvas,label,feedback,actions);document.body.append(dialog);
        let x=0,y=0,drag=null,settled=false;const ctx=canvas.getContext('2d'),base=Math.max(384/image.width,384/image.height);
        function draw(){const scale=base*Number(zoom.value),w=image.width*scale,h=image.height*scale;x=Math.max(-(w-384)/2,Math.min((w-384)/2,x));y=Math.max(-(h-384)/2,Math.min((h-384)/2,y));ctx.clearRect(0,0,384,384);ctx.drawImage(image,(384-w)/2+x,(384-h)/2+y,w,h);}
        function done(value,error){if(settled)return;settled=true;dialog.close();dialog.remove();if(error)reject(error);else resolve(value);}
        zoom.addEventListener('input',draw);reset.addEventListener('click',()=>{x=y=0;zoom.value='1';draw();});
        canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,originX:x,originY:y};canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');});
        canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const ratio=384/canvas.getBoundingClientRect().width;x=drag.originX+(e.clientX-drag.x)*ratio;y=drag.originY+(e.clientY-drag.y)*ratio;draw();});
        for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;canvas.classList.remove('is-dragging');});
        canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();x+=(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)*10;y+=(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0)*10;draw();});
        cancel.addEventListener('click',()=>done(null));dialog.addEventListener('close',()=>done(null));
        apply.addEventListener('click',()=>{apply.disabled=true;feedback.textContent='Preparing photo…';canvas.toBlob(blob=>{if(settled)return;if(!blob||blob.type!=='image/webp'||blob.size>524288){done(null,new Error('Could not prepare this photo. Try another image.'));return;}done(blob);},'image/webp',.86);});
        dialog.showModal();draw();zoom.focus();
    });}};
})();
