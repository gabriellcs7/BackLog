/* Menu da conta inspirado no Profile Dropdown de Kokonut UI. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount;
    const link = document.querySelector('#navigation a[href$="profile.html"]');
    if (!link || !ui || !account) return;
    const el = ui.element,
        wrap = el('span', 'nav-account-control'),
        toggle = el('button', 'nav-account-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open account menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'account-dropdown');
    link.before(wrap);
    wrap.append(toggle, link);
    const panel = el('div', 'account-dropdown');
    panel.id = 'account-dropdown';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Your account');
    document.body.append(panel);
    function close(restore = false) {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (restore) toggle.focus();
    }
    function position() {
        const rect = toggle.getBoundingClientRect();
        panel.style.left =
            Math.max(12, Math.min(rect.left, innerWidth - panel.offsetWidth - 12)) + 'px';
        panel.style.top =
            Math.min(rect.bottom + 12, Math.max(12, innerHeight - panel.offsetHeight - 12)) + 'px';
    }
    function render() {
        const profile = account.getState().profile;
        toggle.replaceChildren(ui.avatar(profile, 'nav-profile-avatar'));
        const identity = el('div', 'account-dropdown-identity');
        identity.append(
            ui.avatar(profile),
            el('strong', '', profile.display_name || 'Player'),
            el('small', '', account.user ? 'Your BackLog account' : 'Device profile')
        );
        const nav = el('nav');
        nav.setAttribute('aria-label', 'Account shortcuts');
        for (const [label, path] of [
            ['Your profile', 'view/profile.html'],
            ['Your lists', 'view/profile-lists.html'],
            ['Your diary', 'view/diary.html'],
            ['Want to play', 'view/want-to-play.html'],
            ['Settings', 'view/settings.html'],
        ]) {
            const a = el('a', '', label);
            a.href = ui.href(path);
            if (path === 'view/settings.html') a.classList.add('account-settings-link');
            nav.append(a);
        }
        const feedback = el('p', 'account-dropdown-feedback');
        feedback.setAttribute('role', 'alert');
        panel.replaceChildren(identity, nav);
        if (account.user) {
            const out = el('button', '', 'Sign out');
            out.type = 'button';
            out.disabled = account.loading;
            out.addEventListener('click', async () => {
                out.disabled = true;
                feedback.textContent = '';
                try {
                    await account.signOut();
                    close(true);
                } catch (error) {
                    feedback.textContent = error.message || 'Could not sign out. Try again.';
                    out.disabled = false;
                }
            });
            panel.append(out);
        } else {
            const login = el('a', 'account-dropdown-login', 'Sign in ↗');
            login.href = ui.href('view/profile.html#account');
            panel.append(login);
        }
        panel.append(feedback);
        if (!panel.hidden) position();
    }
    toggle.addEventListener('click', () => {
        if (!panel.hidden) {
            close();
            return;
        }
        render();
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        position();
    });
    toggle.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (panel.hidden) toggle.click();
            panel.querySelector('a,button')?.focus();
        }
    });
    panel.addEventListener('keydown', (event) => {
        const items = [...panel.querySelectorAll('a,button:not(:disabled)')];
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            let index = items.indexOf(document.activeElement);
            index =
                event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) %
                        items.length;
            items[index]?.focus();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !panel.hidden) {
            event.preventDefault();
            close(true);
        }
    });
    document.addEventListener('pointerdown', (event) => {
        if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target))
            close();
    });
    document.addEventListener('focusin', (event) => {
        if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target))
            close();
    });
    panel.addEventListener('click', (event) => {
        if (event.target.closest('a')) close();
    });
    window.addEventListener('resize', () => close());
    window.addEventListener('scroll', () => close(), { passive: true });
    window.addEventListener('backlog-account-change', render);
    account.ready.then(render);
    render();
})();
