/* Preferências locais; nenhuma chave de sessão ou dado da coleção é alterado. */
(() => {
    'use strict';
    const key = 'backlog:preferences:v1',
        defaults = {
            language: 'en',
            background: true,
            cardGlow: true,
            publicLists: false,
            notificationLikes: true,
            notificationComments: true,
            notificationFollowers: true,
        };
    function read() {
        try {
            const stored = JSON.parse(localStorage.getItem(key) || '{}'),
                next = { ...defaults };
            for (const name of Object.keys(defaults))
                if (
                    name === 'language'
                        ? ['en', 'pt-BR'].includes(stored[name])
                        : typeof stored[name] === 'boolean'
                )
                    next[name] = stored[name];
            return next;
        } catch {
            return { ...defaults };
        }
    }
    let value = read(),
        persistent = true;
    function apply() {
        const html = document.documentElement;
        html.lang = value.language;
        html.dataset.siteLanguage = value.language;
        html.dataset.background = String(value.background);
        html.dataset.cardGlow = String(value.cardGlow);
    }
    function emit(previous) {
        apply();
        window.dispatchEvent(
            new CustomEvent('backlog-preferences-change', { detail: { ...value, persistent } })
        );
        if (previous.language !== value.language)
            window.dispatchEvent(
                new CustomEvent('backlog-language-change', { detail: { language: value.language } })
            );
    }
    function set(name, next) {
        if (
            !(name in defaults) ||
            (name === 'language' ? !['en', 'pt-BR'].includes(next) : typeof next !== 'boolean')
        )
            throw Error('Invalid preference.');
        const previous = { ...value };
        value = { ...value, [name]: next };
        persistent = true;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            persistent = false;
        }
        emit(previous);
        return persistent;
    }
    function reset() {
        const previous = { ...value };
        value = { ...defaults };
        persistent = true;
        try {
            localStorage.removeItem(key);
        } catch {
            persistent = false;
        }
        emit(previous);
        return persistent;
    }
    window.addEventListener('storage', (event) => {
        if (event.key === key || event.key === null) {
            const previous = value;
            value = read();
            emit(previous);
        }
    });
    window.BacklogPreferences = Object.freeze({
        get: () => ({ ...value }),
        set,
        reset,
        get persistent() {
            return persistent;
        },
    });
    apply();
})();
