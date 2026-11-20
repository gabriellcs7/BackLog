/* Adaptação própria em SVG do Background Paths, de Kokonut UI.
 * Referência: https://21st.dev/@kokonutd/components/background-paths */
(() => {
    'use strict';
    if(document.querySelector('.site-background-paths'))return;
    const ns='http://www.w3.org/2000/svg';
    function svgElement(tag,attributes){const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node;}
    const host=document.createElement('div');
    host.className='site-background-paths';host.setAttribute('aria-hidden','true');
    const svg=svgElement('svg',{viewBox:'0 0 1440 900',preserveAspectRatio:'xMidYMid slice',focusable:'false'});
    for(let side=0;side<2;side++){
        const group=svgElement('g',side?{transform:'translate(1440 900) scale(-1 -1)',opacity:'.55'}:{});
        for(let i=0;i<24;i++){
            const d=`M -300 ${-160+i*15} C ${-240+i*5} ${280+i*7} ${420+i*6} ${760+i*6} ${1080+i*12} ${600+i*8} S ${1600+i*3} ${-100+i*8} 1810 ${-260+i*6}`;
            const line=svgElement('path',{d,pathLength:'1000','vector-effect':'non-scaling-stroke'});
            if(i%11===0)line.classList.add('path-gold');
            line.style.setProperty('--path-duration',`${38+(i*3)%17}s`);
            line.style.setProperty('--path-delay',`${-((i*7+side*13)%49)}s`);
            group.append(line);
        }
        svg.append(group);
    }
    host.append(svg);document.body.prepend(host);
    const motion=window.BacklogMotion||matchMedia('(prefers-reduced-motion:reduce)');
    function sync(){host.classList.toggle('is-running',!document.hidden&&!motion.matches);}
    motion.addEventListener?.('change',sync);
    document.addEventListener('visibilitychange',sync);
    sync();
})();
