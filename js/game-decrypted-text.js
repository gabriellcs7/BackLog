/* Decrypted Text: a small native effect on the cyberpunk game labels. */
(() => {
    'use strict';
    const id = new URLSearchParams(location.search).get('id');
    if (
        ![
            'cyberpunk-2077',
            'cyberpunk-2077-phantom-liberty',
            'watch-dogs',
            'watch-dogs-2',
            'watch-dogs-legion',
        ].includes(id)
    )
        return;
    const label = document.querySelector('.hero-heading > .eyebrow');
    if (!label) return;
    const motion = window.BacklogMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const visual = document.createElement('span');
    visual.className = 'decrypted-label';
    visual.dataset.noTranslate = '';
    visual.setAttribute('aria-hidden', 'true');
    const accessible = document.createElement('span');
    accessible.className = 'decrypted-label-accessible';
    accessible.dataset.noTranslate = '';
    label.replaceChildren(
        label.querySelector('i') || document.createElement('i'),
        visual,
        accessible
    );
    const glyphs = '01#$_/[]ABCDEF';
    let timer = 0,
        source = '',
        seen = false,
        running = false;
    function restore() {
        clearTimeout(timer);
        timer = 0;
        running = false;
        visual.textContent = source;
        label.classList.remove('is-decrypting');
    }
    function translate() {
        source = window.BacklogI18n?.t('GAME OVERVIEW') || 'GAME OVERVIEW';
        accessible.textContent = source;
        visual.style.width = '';
        restore();
        visual.style.width = visual.getBoundingClientRect().width + 'px';
    }
    function play() {
        if (motion.matches || document.hidden || running) return;
        running = true;
        let step = 0;
        label.classList.add('is-decrypting');
        const tick = () => {
            if (motion.matches || document.hidden) return restore();
            const revealed = Math.floor(step++ / 2);
            visual.textContent = [...source]
                .map((char, i) =>
                    char === ' ' || i < revealed
                        ? char
                        : glyphs[Math.floor(Math.random() * glyphs.length)]
                )
                .join('');
            if (revealed >= source.length) return restore();
            timer = setTimeout(tick, 35);
        };
        tick();
    }
    label.addEventListener('pointerenter', play);
    label.addEventListener('pointerdown', play, { passive: true });
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && !seen) {
                seen = true;
                play();
            }
        },
        { threshold: 0.8 }
    );
    observer.observe(label);
    motion.addEventListener('change', restore);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) restore();
    });
    window.addEventListener('backlog-language-change', translate);
    window.addEventListener('pagehide', () => {
        restore();
        observer.disconnect();
    });
    translate();
})();
