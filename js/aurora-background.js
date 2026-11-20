/* Fundo compartilhado inspirado no Aurora Background de Manu Arora.
 * Usa apenas CSS local; não intercepta cliques nem altera o conteúdo das páginas. */
(() => {
    'use strict';
    if(document.querySelector('.site-aurora'))return;
    const aurora=document.createElement('div');
    aurora.className='site-aurora';
    aurora.setAttribute('aria-hidden','true');
    document.body.prepend(aurora);
    const motion=window.BacklogMotion||matchMedia('(prefers-reduced-motion:reduce)');
    function sync(){aurora.classList.toggle('is-running',!document.hidden&&!motion.matches);}
    motion.addEventListener?.('change',sync);
    document.addEventListener('visibilitychange',sync);
    sync();
})();
