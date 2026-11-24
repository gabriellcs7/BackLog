/* Animate the existing details elements without changing their icons or markup. */
(() => {
    'use strict';
    const topics = [...document.querySelectorAll('.project-question')];
    if (!topics.length) return;
    document.documentElement.classList.add('help-answer-motion-ready');
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Map();
    function stop(topic, settle) {
        const state = active.get(topic); if (!state) return;
        active.delete(topic); state.animations.forEach(animation => animation.cancel());
        if (settle) topic.open = state.expanded;
        topic.classList.remove('help-question-animating');
    }
    for (const topic of topics) {
        const summary = topic.querySelector('summary'), answer = topic.querySelector(':scope > div');
        if (!summary || !answer) continue;
        summary.addEventListener('click', event => {
            if (event.defaultPrevented) return;
            if (motion.matches || !topic.animate) { stop(topic, true); return; }
            event.preventDefault();
            const expanded = !(active.get(topic)?.expanded ?? topic.open);
            const from = topic.getBoundingClientRect().height;
            stop(topic, false); topic.classList.add('help-question-animating'); topic.open = true;
            const style = getComputedStyle(topic);
            const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
            const to = expanded ? topic.getBoundingClientRect().height : summary.getBoundingClientRect().height + border;
            const height = topic.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
            const reveal = answer.animate(expanded
                ? [{ opacity: 0, transform: 'translateY(-6px)', filter: 'blur(3px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }]
                : [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(2px)' }],
            { duration: expanded ? 300 : 160, easing: 'ease-out', fill: 'both' });
            const state = { expanded, animations: [height, reveal] }; active.set(topic, state);
            Promise.all(state.animations.map(animation => animation.finished)).then(() => {
                if (active.get(topic) === state) stop(topic, true);
            }, () => {});
        });
    }
    motion.addEventListener('change', () => { if (motion.matches) for (const topic of [...active.keys()]) stop(topic, true); });
    document.querySelector('#help-topic-search')?.addEventListener('input', () => { for (const topic of [...active.keys()]) stop(topic, false); }, { capture: true });
    window.addEventListener('backlog-language-change', () => { for (const topic of [...active.keys()]) stop(topic, false); });
})();
