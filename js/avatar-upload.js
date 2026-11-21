/* Selecionar, arrastar ou colar uma foto usa o mesmo recorte e rascunho do perfil. */
(() => {
    'use strict';const input=document.getElementById('profile-photo'),api=window.BacklogProfileSocial,ui=window.BacklogUI;if(!input||!api||!ui)return;
    const el=ui.element,t=s=>window.BacklogI18n?.t(s)||s,field=input.parentElement;
    input.classList.add('avatar-upload-input');field.classList.add('avatar-upload-field');
    const zone=el('button','avatar-upload-dropzone');zone.type='button';zone.setAttribute('aria-label','Choose or drop a profile photo');
    const graphic=el('span','avatar-upload-icon','↥'),copy=el('span','avatar-upload-copy');copy.append(el('strong','','Drop your photo here'),el('small','','or choose a file'));
    const file=el('span','avatar-upload-file');file.hidden=true;file.dataset.noTranslate='';zone.append(graphic,copy);field.append(zone,file);
    zone.addEventListener('click',event=>{event.preventDefault();input.click();});
    let dragDepth=0;
    function leave(){dragDepth=0;zone.classList.remove('is-dragging');}
    function receive(files){leave();if(files.length!==1){document.getElementById('edit-profile-feedback').textContent=t('Choose one profile photo at a time.');return;}api.acceptPhoto(files[0]);}
    zone.addEventListener('dragenter',event=>{event.preventDefault();dragDepth++;zone.classList.add('is-dragging');});
    zone.addEventListener('dragover',event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';});
    zone.addEventListener('dragleave',event=>{event.preventDefault();dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)zone.classList.remove('is-dragging');});
    zone.addEventListener('drop',event=>{event.preventDefault();receive([...event.dataTransfer.files]);});
    zone.addEventListener('paste',event=>{const files=[...(event.clipboardData?.files||[])];if(files.length){event.preventDefault();receive(files);}});
    window.addEventListener('backlog-photo-stage',event=>{if(event.detail.status==='reset'){file.hidden=true;file.textContent='';leave();return;}if(event.detail.status==='ready'){file.hidden=false;file.textContent=event.detail.name+' · '+new Intl.NumberFormat(window.BacklogI18n?.locale||'en',{maximumFractionDigits:1}).format(event.detail.size/1024)+' KB';}});
    document.getElementById('profile-dialog').addEventListener('close',leave);
})();
