/* Formato de reviews próprio: texto simples antigo permanece literal; HTML nunca é interpretado. */
(() => {
    'use strict';
    const marker='#!backlog-review-v1\n',spoilerMarker='#!backlog-spoiler-v1\n';
    const t=s=>window.BacklogI18n?.t(s)||s,languageHandlers=new WeakMap();
    window.addEventListener('backlog-language-change',()=>{for(const node of document.querySelectorAll('.spoiler-preview'))node.textContent=t('This review contains spoilers.');});
    const isSpoiler=value=>String(value||'').startsWith(spoilerMarker);
    const unwrap=value=>isSpoiler(value)?String(value).slice(spoilerMarker.length):String(value||'');
    const withSpoiler=(value,flag)=>{const text=unwrap(value).trim();return text&&flag?spoilerMarker+text:text;};
    const el=tag=>document.createElement(tag),esc=s=>String(s).replace(/[\\*_\[\]]/g,'\\$&');
    function url(value){try{const parsed=new URL(value);return ['https:','http:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password?parsed.href:null;}catch{return null;}}
    function inline(source,parent,depth=0){
        if(depth>8){parent.append(document.createTextNode(source));return;}let i=0,buffer='';
        const flush=()=>{if(buffer){parent.append(document.createTextNode(buffer));buffer='';}};
        while(i<source.length){
            if(source[i]==='\\'&&i+1<source.length){buffer+=source[i+1];i+=2;continue;}
            const token=source.startsWith('**',i)?'**':source[i]==='_'?'_':null;
            if(token){const end=source.indexOf(token,i+token.length);if(end>i+token.length){flush();const n=el(token==='**'?'strong':'em');inline(source.slice(i+token.length,end),n,depth+1);parent.append(n);i=end+token.length;continue;}}
            if(source[i]==='['){const mid=source.indexOf('](',i+1),end=mid<0?-1:source.indexOf(')',mid+2);if(mid>i&&end>mid){const dest=url(source.slice(mid+2,end));if(dest){flush();const a=el('a');a.href=dest;a.target='_blank';a.rel='noopener noreferrer';inline(source.slice(i+1,mid),a,depth+1);parent.append(a);i=end+1;continue;}}}
            buffer+=source[i++];
        }flush();
    }
    function fragment(value){const root=el('div'),source=unwrap(value);if(!source.startsWith(marker)){root.textContent=source;root.style.whiteSpace='pre-wrap';return root;}
        const lines=source.slice(marker.length).split('\n');let list=null,kind='',paragraph=null;
        for(const line of lines){const match=line.match(/^(- |\d+\. )(.*)$/),quote=line.startsWith('> '),heading=line.startsWith('## ');
            if(match){paragraph=null;const type=match[1]==='- '?'ul':'ol';if(!list||kind!==type){list=el(type);root.append(list);kind=type;}const li=el('li');inline(match[2],li);list.append(li);continue;}
            list=null;kind='';if(!line.trim()){paragraph=null;continue;}
            if(quote||heading){paragraph=null;const n=el(quote?'blockquote':'h3');inline(line.slice(quote?2:3),n);root.append(n);continue;}
            if(!paragraph){paragraph=el('p');root.append(paragraph);}else paragraph.append(el('br'));inline(line,paragraph);
        }return root;
    }
    function plain(value){value=unwrap(value);if(!String(value||'').startsWith(marker))return String(value||'');const root=fragment(value);function text(n){if(n.nodeType===3)return n.textContent;return [...n.childNodes].map(text).join('')+(['P','DIV','LI','H3','BLOCKQUOTE','BR'].includes(n.tagName)?'\n':'');}return text(root).trim();}
    function render(node,value,options={}){
        const old=languageHandlers.get(node);if(old){window.removeEventListener('backlog-language-change',old);languageHandlers.delete(node);}const flagged=isSpoiler(value),source=unwrap(value);node.classList.add('formatted-review');node.dataset.noTranslate='';
        function draw(revealed){node.replaceChildren();node.dataset.spoilerHidden=String(flagged&&!revealed);if(flagged&&!revealed){const next=(node.closest('.expandable-text')||node).nextElementSibling;if(next?.classList.contains('review-link-previews')){next.hidden=true;next.replaceChildren();}}node.style.whiteSpace=source.startsWith(marker)?'normal':'pre-wrap';
            if(flagged){const notice=el('div');notice.className='review-spoiler-notice';const title=el('strong');title.textContent=t('Contains spoilers');notice.append(title);
                const text=el('p');text.textContent=t(revealed?'You chose to reveal this review.':'This review contains spoilers.');notice.append(text);const button=el('button');button.type='button';button.className='spoiler-reveal';button.textContent=t(revealed?'Hide spoilers':'Show review');button.setAttribute('aria-expanded',String(revealed));button.addEventListener('click',()=>{draw(!revealed);node.querySelector('.spoiler-reveal')?.focus({preventScroll:true});});notice.append(button);node.append(notice);
            }
            if(!flagged||revealed){const root=fragment(source);node.append(...root.childNodes);}
        }
        let revealed=Boolean(options.reveal);draw(revealed);
        if(flagged){const update=()=>{if(!node.isConnected){window.removeEventListener('backlog-language-change',update);return;}draw(node.dataset.spoilerHidden!=='true');};window.addEventListener('backlog-language-change',update);languageHandlers.set(node,update);}
    }
    function serialize(root){
        function walk(node){if(node.nodeType===3)return esc(node.textContent);if(node.nodeType!==1)return '';const tag=node.tagName,body=[...node.childNodes].map(walk).join('');
            if(['SCRIPT','STYLE','IFRAME','OBJECT'].includes(tag))return '';
            if(tag==='BR')return '\n';if(['B','STRONG'].includes(tag))return '**'+body+'**';if(['I','EM'].includes(tag))return '_'+body+'_';
            if(tag==='A'){const dest=url(node.getAttribute('href'));return dest?'['+body+']('+dest.replace(/\)/g,'%29')+')':body;}
            if(tag==='UL'||tag==='OL')return '\n'+[...node.children].filter(n=>n.tagName==='LI').map((n,i)=>(tag==='OL'?(i+1)+'. ':'- ')+[...n.childNodes].map(walk).join('').trim()).join('\n')+'\n';
            if(tag==='BLOCKQUOTE')return '\n'+body.trim().split('\n').filter(Boolean).map(s=>'> '+s).join('\n')+'\n';
            if(/^H[1-6]$/.test(tag))return '\n## '+body.trim()+'\n';if(tag==='P'||tag==='DIV')return body+'\n';return body;
        }
        const text=[...root.childNodes].map(walk).join('').replace(/\n{3,}/g,'\n\n').trim();if(!root.textContent.trim())return '';
        const rich=Boolean(root.querySelector('strong,b,em,i,ul,ol,blockquote,h1,h2,h3,h4,h5,h6,a'));
        return rich?marker+text:(root.innerText??root.textContent).replace(/\r/g,'').trim();
    }
    window.BacklogReviewText=Object.freeze({marker,spoilerMarker,isSpoiler,unwrap,withSpoiler,fragment,plain,render,serialize,safeURL:url});
})();
