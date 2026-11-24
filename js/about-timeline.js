/* Horizontal project journey; native scrolling, no external dependencies. */
(() => {
    'use strict';
    const section = document.querySelector('.story-scroll');
    if (!section) return;
    const track = section.querySelector('.story-track');
    const viewport = section.querySelector('.story-window');
    const sticky = section.querySelector('.story-sticky');
    const meter = section.querySelector('.story-meter i');
    const line = section.querySelector('.story-line i');
    const milestones = [...section.querySelectorAll('.story-milestone')];
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    let frame = null;

    function paint() {
        frame = null;
        const reduced = motion.matches;
        const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
        const distance = Math.max(1, section.offsetHeight - sticky.offsetHeight);
        const progress = reduced
            ? viewport.scrollLeft / Math.max(1, viewport.scrollWidth - viewport.clientWidth)
            : Math.max(0, Math.min(1, (stickyTop - section.getBoundingClientRect().top) / distance));
        const travel = Math.max(0, track.offsetWidth - viewport.clientWidth);
        if (!reduced) track.style.transform = `translateX(${-travel * progress}px)`;
        meter.style.width = `${progress * 100}%`;
        line.style.width = `${8 + progress * 92}%`;
        const edge = viewport.getBoundingClientRect().right - 25;
        for (const item of milestones) item.classList.toggle('revealed', reduced || item.getBoundingClientRect().left < edge);
    }
    function schedule() {
        if (frame === null) frame = requestAnimationFrame(paint);
    }
    function applyMotion() {
        section.classList.toggle('story-animated', !motion.matches);
        track.style.removeProperty('transform');
        viewport.scrollLeft = 0;
        schedule();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    viewport.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('backlog-language-change', schedule);
    motion.addEventListener('change', applyMotion);
    viewport.addEventListener('keydown', event => {
        if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        if (motion.matches) {
            const left = event.key === 'Home' ? 0 : event.key === 'End' ? viewport.scrollWidth
                : viewport.scrollLeft + (event.key === 'ArrowRight' ? 320 : -320);
            viewport.scrollTo({ left, behavior: 'instant' });
        } else {
            const start = section.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(sticky).top) || 0);
            const end = start + section.offsetHeight - sticky.offsetHeight;
            const top = event.key === 'Home' ? start : event.key === 'End' ? end
                : Math.max(start, Math.min(end, scrollY + (event.key === 'ArrowRight' ? 320 : -320)));
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(sticky);
    document.fonts?.ready.then(schedule);
    applyMotion();
})();
