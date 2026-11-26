/* A máquina de escrever acompanha o salvamento real, sem simular sucesso. */
(() => {
    'use strict';
    const game = window.BacklogUI.game(new URLSearchParams(location.search).get('id'));
    if (!game?.id.startsWith('resident-evil-')) return;
    const form = document.getElementById('review-form'),
        button = form?.querySelector('button[type=submit]');
    if (!button) return;
    const icon = document.createElement('span');
    icon.className = 'review-typewriter';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
        '<svg viewBox="0 0 28 28" fill="none"><g class="typewriter-paper"><path d="M8 3h12v11H8z" fill="currentColor" opacity=".22"/><path d="M8 14V3h12v11M11 6h6M11 9h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></g><path d="m6 12-3 9v3h22v-3l-3-9H6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 21h18M8 24v1m12-1v1M4 12H2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect class="typewriter-key" x="8" y="15" width="3" height="2" rx=".5" fill="currentColor" style="--key-index:0"/><rect class="typewriter-key" x="12.5" y="15" width="3" height="2" rx=".5" fill="currentColor" style="--key-index:1"/><rect class="typewriter-key" x="17" y="15" width="3" height="2" rx=".5" fill="currentColor" style="--key-index:2"/><path d="M10 19h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    button.classList.add('review-save-themed');
    button.dataset.saveTheme = 'resident-evil';
    button.prepend(icon);
    let submitted = false;
    function state() {
        const active = Boolean(submitted && form.inert);
        button.classList.toggle('is-saving', active);
        button.setAttribute('aria-busy', String(active));
        if (!form.inert) submitted = false;
    }
    form.addEventListener('submit', () => {
        const chosen = form.querySelector('[name="review-rating"]:checked'),
            text = document.getElementById('review-text').value;
        if (!form.inert || (!chosen && !text.trim())) return;
        submitted = true;
        state();
    });
    new MutationObserver(state).observe(form, { attributes: true, attributeFilter: ['inert'] });
    state();
})();
