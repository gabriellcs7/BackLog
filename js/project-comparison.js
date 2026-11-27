/* The browser's range input supplies pointer, touch and keyboard controls. */
(() => {
    'use strict';
    const slider = document.getElementById('project-comparison-slider');
    if (!slider) return;
    const stage = slider.closest('.project-image-compare');
    const t = (value) => window.BacklogI18n?.t(value) || value;
    function update() {
        const value = Math.max(0, Math.min(100, Number(slider.value) || 0));
        stage.style.setProperty('--comparison-split', value + '%');
        slider.setAttribute(
            'aria-valuetext',
            value + '% ' + t('First version') + ' / ' + (100 - value) + '% ' + t('Current version')
        );
    }
    slider.addEventListener('input', update);
    window.addEventListener('backlog-language-change', update);
    update();
})();
