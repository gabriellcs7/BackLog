/* Inspirado em Background Beams, de Manu Arora (21st.dev/Aceternity UI).
 * Geometria e animação próprias em SVG, adaptadas ao site sem React. */
(() => {
    'use strict';
    const host=document.querySelector('.background-beams');
    if(!host)return;
    const ns='http://www.w3.org/2000/svg';
    function svgElement(tag,attributes){const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node;}
    const svg=svgElement('svg',{viewBox:'0 0 1440 700',preserveAspectRatio:'xMidYMid slice',focusable:'false'});
    const defs=svgElement('defs',{});
    const gradient=svgElement('linearGradient',{id:'backlog-beam-gold',x1:'0%',y1:'0%',x2:'100%',y2:'100%'});
    for(const [offset,color,opacity] of [['0%','#a6892a','0'],['35%','#c8a83c','.45'],['70%','#ffd21f','1'],['100%','#fff0ab','0']])gradient.append(svgElement('stop',{offset,'stop-color':color,'stop-opacity':opacity}));
    defs.append(gradient);svg.append(defs);
    const tracks=svgElement('g',{}),lights=svgElement('g',{});
    for(let i=0;i<24;i++){
        const x=-520+i*83;
        const d=`M ${x} -100 C ${x+100} 120 ${x+280} 140 ${x+350} 330 S ${x+630} 600 ${x+920} 820`;
        tracks.append(svgElement('path',{d,class:'background-beams-track',pathLength:'1000','vector-effect':'non-scaling-stroke'}));
        const light=svgElement('path',{d,class:'background-beams-light',pathLength:'1000','vector-effect':'non-scaling-stroke'});
        light.style.setProperty('--beam-duration',`${16+(i*7)%13}s`);
        light.style.setProperty('--beam-delay',`${-((i*11)%29)}s`);
        lights.append(light);
    }
    svg.append(tracks,lights);host.append(svg);
    let visible=false;
    const motion=window.BacklogMotion||matchMedia('(prefers-reduced-motion:reduce)');
    function sync(){host.classList.toggle('is-running',visible&&!document.hidden&&!motion.matches);}
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'100px'});observer.observe(host);}else visible=true;
    document.addEventListener('visibilitychange',sync);
    motion.addEventListener?.('change',sync);
    sync();
})();
