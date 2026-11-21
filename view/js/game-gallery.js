/* Screenshots oficiais locais; imagens ampliadas sem recorte. */
(() => {
    'use strict';
    const ui=window.BacklogUI,requested=new URLSearchParams(location.search).get('id');
    const game=window.BacklogGames.find(item=>item.id===requested)||window.BacklogGames[0];
    const gallery=window.BacklogGameGalleries?.[game.id],section=document.querySelector('#screenshots');
    if(!ui||!section||!gallery?.images.length)return;
    const el=ui.element,grid=section.querySelector('.game-gallery-grid'),source=section.querySelector('.game-gallery-source');
    source.href=gallery.source;source.title='Screenshots from '+gallery.edition;section.hidden=false;
    document.querySelector('.section-tabs a[href="#screenshots"]').hidden=false;
    const dialog=el('dialog','game-gallery-dialog');dialog.setAttribute('aria-label',game.title+' screenshots');
    const header=el('div','game-gallery-dialog-header'),heading=el('h2','',game.title),close=el('button','game-gallery-close','×');
    close.type='button';close.setAttribute('aria-label','Close screenshots');header.append(heading,close);
    const figure=el('figure','game-gallery-stage'),image=el('img'),feedback=el('p','game-gallery-feedback');
    image.decoding='async';feedback.setAttribute('role','status');figure.append(image,feedback);
    const footer=el('div','game-gallery-controls'),previous=el('button','game-gallery-step','← Previous'),next=el('button','game-gallery-step','Next →'),counter=el('span');
    previous.type=next.type='button';counter.setAttribute('aria-live','polite');footer.append(previous,counter,next);
    dialog.append(header,figure,footer);document.body.append(dialog);
    let index=0,opener=null,oldOverflow='';
    function show(value){
        index=(value+gallery.images.length)%gallery.images.length;
        image.alt=game.title+' — screenshot '+(index+1)+' of '+gallery.images.length;
        image.hidden=false;feedback.textContent='Loading screenshot…';image.src=ui.href('imagens/'+gallery.images[index].full);
        counter.textContent=(index+1)+' / '+gallery.images.length;previous.disabled=next.disabled=gallery.images.length<2;
    }
    image.addEventListener('load',()=>{feedback.textContent='';});
    image.addEventListener('error',()=>{image.hidden=true;feedback.textContent='This screenshot could not be loaded. Try the next image.';});
    function open(value,button){opener=button;oldOverflow=document.body.style.overflow;show(value);dialog.showModal();document.body.style.overflow='hidden';close.focus({preventScroll:true});}
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;opener?.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}});
    previous.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));
    gallery.images.forEach((shot,i)=>{
        const button=el('button','game-gallery-shot');button.type='button';button.setAttribute('aria-label','View '+game.title+' screenshot '+(i+1));
        const thumb=el('img');thumb.src=ui.href('imagens/'+shot.thumb);thumb.alt='';thumb.loading='lazy';thumb.decoding='async';
        const overlay=el('span','game-gallery-zoom','↗'),number=el('span','game-gallery-number',String(i+1).padStart(2,'0'));
        overlay.setAttribute('aria-hidden','true');number.setAttribute('aria-hidden','true');button.append(thumb,overlay,number);
        button.addEventListener('click',()=>open(i,button));grid.append(button);
    });
})();
