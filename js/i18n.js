/* Tradução reversível da interface; nunca grava texto traduzido nos dados do usuário. */
(() => {
    'use strict';
    const catalog=window.BacklogPortuguese||{},reverse=Object.fromEntries(Object.entries(catalog).map(([en,pt])=>[pt,en])),originals=new WeakMap(),attributes=new WeakMap();
    const excluded='script,style,svg,code,pre,textarea,input,[contenteditable], [data-no-translate],.player-link,.game-review-marquee-body,.profile-review-card p,.profile-review-card h3,.community-review-text,.comment-text,.diary-review-text,.diary-excerpt,.diary-review p,.diary-game-title,.notification-game-name,.notification-sentence strong,.game-review-marquee-identity .player-link,.account-dropdown-identity strong,#profile-name,#profile-bio,#profile-location,#profile-website,#list-title,#list-description,.game-list-card h3,.game-list-card p.list-description,.library-card h3,.discover-card h3,#game-title,.game-logo,.home-review-body,.review-wall-text,.comment-heading .player-link';
    let scheduled=false;
    const language=()=>window.BacklogPreferences?.get().language||'en';
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function translate(value,depth=0){
        if(typeof value!=='string'||!value.trim())return value;
        const leading=value.match(/^\s*/)[0],trailing=value.match(/\s*$/)[0],source=reverse[value.trim()]||value.trim();
        if(language()==='en')return leading+source+trailing;
        let result=catalog[source];
        if(result===undefined){
            const arrow=source.match(/^(.*?)(\s*[↗→↓↑.]*)$/);if(arrow&&catalog[arrow[1]])result=catalog[arrow[1]]+arrow[2];
        }
        if(result===undefined&&depth<2&&source.includes(' · '))result=source.split(' · ').map(part=>translate(part,depth+1)).join(' · ');
        if(result===undefined&&source.endsWith(' · BackLog'))result=translate(source.slice(0,-10),1)+' · BackLog';
        if(result===undefined){let m;
            if((m=source.match(/^Played in (\d{4})$/)))result='Jogados em '+m[1];
            else if((m=source.match(/^(All|Unread|Comments|Likes) (\d+)$/)))result=translate(m[1],1)+' '+m[2];
            else if((m=source.match(/^(\d+) (games?|reviews?|ratings?|likes?|comments?|followers?|lists?|entries|results)$/))){const words={game:['jogo','jogos'],review:['review','reviews'],rating:['avaliação','avaliações'],like:['curtida','curtidas'],comment:['comentário','comentários'],follower:['seguidor','seguidores'],list:['lista','listas'],entries:['registro','registros'],results:['resultado','resultados']},key=m[2].replace(/s$/,'');result=m[1]+' '+(words[key]||words[m[2]])[Number(m[1])===1?0:1];}
            else if((m=source.match(/^(\d+) min ago$/)))result='há '+m[1]+' min';
            else if((m=source.match(/^(\d+) hours ago$/)))result='há '+m[1]+' h';
            else if((m=source.match(/^Notifications, (\d+) unread$/)))result='Notificações, '+m[1]+' não lidas';
            else if((m=source.match(/^(\d+) unread notifications$/)))result=m[1]+' notificações não lidas';
            else if((m=source.match(/^(\d+(?:\.\d+)?) out of 5 stars$/)))result=m[1].replace('.',',')+' de 5 estrelas';
            else if((m=source.match(/^(\d+)(?:st|nd|rd|th) review$/)))result=m[1]+'ª review';
            else if((m=source.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/)))result=catalog[m[1]]+' de '+m[2];
            else if((m=source.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/))){const date=new Date(Number(m[3]),months.indexOf(m[1]),Number(m[2]),12);result=new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(date);}
            else if((m=source.match(/^(Edit date for|Remove diary entry for|Choose favorite game|View profile of|Like review by|Unlike review by|Mark notification from|Open notification for) (.+)$/))){const prefix={'Edit date for':'Alterar data de','Remove diary entry for':'Remover registro de','Choose favorite game':'Escolher jogo favorito','View profile of':'Ver perfil de','Like review by':'Curtir review de','Unlike review by':'Descurtir review de','Mark notification from':'Marcar como lida a notificação de','Open notification for':'Abrir notificação de'};result=prefix[m[1]]+' '+m[2];}
        }
        return leading+(result??source)+trailing;
    }
    function skip(node){return Boolean(node.parentElement?.closest(excluded));}
    function text(node){if(skip(node)||!node.nodeValue.trim())return;let record=originals.get(node);if(!record||node.nodeValue!==record.last)record={source:node.nodeValue,last:null};const next=translate(record.source);record.last=next;originals.set(node,record);if(node.nodeValue!==next)node.nodeValue=next;}
    function scan(){scheduled=false;if(!document.body)return;observer.disconnect();
        for(const option of document.querySelectorAll('option:not([value])'))option.setAttribute('value',option.textContent);
        const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())text(node);
        for(const element of document.querySelectorAll('[placeholder],[aria-label],[title]')){if(element.closest(excluded)&&!element.matches('input,textarea'))continue;let records=attributes.get(element);if(!records){records={};attributes.set(element,records);}for(const name of ['placeholder','aria-label','title']){const current=element.getAttribute(name);if(!current)continue;let record=records[name];if(!record||current!==record.last)record={source:current};const next=translate(record.source);record.last=next;records[name]=record;if(current!==next)element.setAttribute(name,next);}}
        document.documentElement.lang=language();observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
    }
    function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(scan);}}
    const observer=new MutationObserver(schedule);
    window.BacklogI18n=Object.freeze({t:translate,get language(){return language();},get locale(){return language();},refresh:schedule});
    window.addEventListener('backlog-language-change',scan);scan();
})();
