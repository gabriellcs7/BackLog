/* Marcos do próprio BackLog, calculados a partir dos registros visíveis atuais. */
(() => {
    'use strict';const ui=window.BacklogUI,el=ui.element,t=s=>window.BacklogI18n?.t(s)||s;
    const definitions=[
        {id:'first-rating',name:'First rating',description:'Rate your first game.',key:'ratings',goal:1,icon:'star'},
        {id:'first-review',name:'First words',description:'Write your first review.',key:'written',goal:1,icon:'pen'},
        {id:'critic',name:'Critic',description:'Write reviews for 10 games.',key:'written',goal:10,icon:'pen'},
        {id:'finisher',name:'Game finisher',description:'Complete or platinum 5 games.',key:'completed',goal:5,icon:'trophy'},
        {id:'explorer',name:'Explorer',description:'Log 25 different games.',key:'logged',goal:25,icon:'compass'},
        {id:'curator',name:'Public curator',description:'Create 3 public game lists.',key:'lists',goal:3,icon:'list'}
    ];
    const paths={star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z',pen:'m5 15 10-10 4 4L9 19l-5 1ZM13 7l4 4',trophy:'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5m-4 2h8m-6-2h4',compass:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-6-3-2 5-4 1 2-5Z',list:'M9 5h12M9 12h12M9 19h12M3 5h1m-1 7h1m-1 7h1'};
    function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]);svg.append(path);return svg;}
    function header(){const heading=el('div','insight-heading'),copy=el('div'),title=el('h2','','Profile milestones');title.id='profile-milestones-title';copy.append(title,el('p','',"Based on this profile's current visible records."));heading.append(copy);return heading;}
    function render(host,counts){
        host.hidden=false;host.replaceChildren();const section=el('section','insight-card profile-milestones');section.setAttribute('aria-labelledby','profile-milestones-title');const heading=header(),unlocked=definitions.filter(d=>Number(counts[d.key])>=d.goal).length,summary=el('span','milestone-summary',unlocked+' / '+definitions.length+' '+t('Unlocked'));summary.dataset.noTranslate='';heading.append(summary);
        const grid=el('div','milestone-grid');
        for(const definition of definitions){const value=Math.max(0,Number(counts[definition.key])||0),progress=Math.min(value,definition.goal),achieved=value>=definition.goal,card=el('article','achievement-tile'+(achieved?' is-unlocked':''));card.dataset.milestone=definition.id;card.dataset.value=value;
            const medal=el('div','achievement-medal');medal.append(icon(definition.icon));
            const copy=el('div','achievement-copy'),name=el('h3','',t(definition.name)),description=el('p','',t(definition.description));copy.append(name,description);
            const badge=el('span','achievement-state',t(achieved?'Unlocked':'Locked'));const top=el('div','achievement-top');top.append(medal,copy);
            const footer=el('div','achievement-footer');footer.append(badge,el('span','achievement-value',progress+' / '+definition.goal));const bar=el('div','achievement-progress');bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',t(definition.name));bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',definition.goal);bar.setAttribute('aria-valuenow',progress);const fill=el('span');fill.style.width=progress/definition.goal*100+'%';bar.append(fill);card.append(top,footer,bar);grid.append(card);
        }
        section.append(heading,grid);host.append(section);
    }
    function error(host){host.hidden=false;host.replaceChildren();const section=el('section','insight-card profile-milestones');section.append(header(),el('p','social-feedback','Could not load profile milestones.'));host.append(section);}
    window.BacklogAchievements={render,error};
})();
