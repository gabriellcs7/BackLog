(() => {
 'use strict';const search=document.querySelector('#help-topic-search');if(!search)return;const topics=[...document.querySelectorAll('.project-question')],feedback=document.querySelector('#help-topic-feedback'),t=s=>window.BacklogI18n?.t(s)||s,normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function filter(){const query=normalize(search.value.trim());let count=0;for(const topic of topics){const match=normalize(topic.textContent).includes(query);topic.hidden=!match;if(query&&match)topic.open=true;else if(!query)topic.open=false;if(match)count++;}feedback.textContent=count?'':t('No help topics match your search.');}
 search.addEventListener('input',filter);window.addEventListener('backlog-language-change',filter);filter();
})();