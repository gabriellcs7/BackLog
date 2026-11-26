/* Valores em centavos, moeda brasileira e origem visível. */
(() => {
    'use strict';
    const prices = window.BacklogGamePrices,
        t = (s) => window.BacklogI18n?.t(s) || s;
    const money = (cents) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    };
    function amount(p) {
        return !p || p.status === 'unverified'
            ? t('Price not confirmed')
            : p.status === 'free'
              ? t('Free to play')
              : money(p.finalCents);
    }
    function fill(node) {
        const p = prices[node.dataset.gamePrice];
        node.replaceChildren();
        const value = el('strong', 'game-price-value', amount(p));
        value.dataset.noTranslate = '';
        node.append(value);
        if (node.dataset.priceDetail !== 'true') {
            if (p?.bundle) node.prepend(el('span', 'game-price-kind', t('Bundle') + ' · '));
            return;
        }
        if (p?.status !== 'unverified' && p?.store) {
            const store = el('p', 'game-price-store', p.store + ' · ' + p.platform);
            store.dataset.noTranslate = '';
            node.append(store);
            const edition = el('p', 'game-price-edition', p.edition);
            edition.dataset.noTranslate = '';
            node.append(edition);
        }
        if (p?.bundle)
            node.append(
                el('p', 'social-small', t('Price for the collection, not an individual game.'))
            );
        if (p?.alternativeEdition)
            node.append(el('p', 'social-small', t('Price refers to the edition shown above.')));
        if (node.dataset.gamePrice === 'poppy-playtime')
            node.append(
                el('p', 'social-small', t('Chapter 1 is free. Other chapters are sold separately.'))
            );
        if (p?.checkedAt) {
            const date = new Intl.DateTimeFormat(window.BacklogI18n?.locale || 'en', {
                dateStyle: 'medium',
                timeZone: 'UTC',
            }).format(new Date(p.checkedAt));
            const checked = el('p', 'game-price-checked', t('Checked on') + ' ' + date);
            checked.dataset.noTranslate = '';
            node.append(checked);
        }
        node.append(
            el(
                'p',
                'social-small',
                t(
                    p?.status === 'unverified'
                        ? 'A reliable price for this edition could not be confirmed.'
                        : 'Prices may change. Confirm the price in the store.'
                )
            )
        );
        if (p?.source) {
            const link = el('a', 'social-button', t('Visit source') + ' ↗');
            link.href = p.source;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            node.append(link);
        }
    }
    function create(id, detail = false) {
        const node = el('div', detail ? 'game-price-detail' : 'catalog-price');
        node.dataset.gamePrice = id;
        if (detail) node.dataset.priceDetail = 'true';
        fill(node);
        return node;
    }
    window.addEventListener('backlog-language-change', () => {
        for (const n of document.querySelectorAll('[data-game-price]')) fill(n);
    });
    window.BacklogPrices = Object.freeze({ create });
})();
