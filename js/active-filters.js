/* The native selects and search remain the source of truth. */
(() => {
    'use strict';
    const search = document.querySelector('#site-search'),
        genre = document.querySelector('#genre-filter'),
        status = document.querySelector('#status-filter'),
        sort = document.querySelector('#sort-games');
    if (!genre || !status || !sort) return;
    const bar = document.createElement('div');
    bar.className = 'catalog-active-filters';
    bar.setAttribute('role', 'group');
    bar.dataset.noTranslate = '';
    document.querySelector('#game-results').before(bar);
    const pt = () => window.BacklogPreferences?.get().language === 'pt-BR',
        t = (s) => window.BacklogI18n?.t(s) || s;
    function render() {
        bar.replaceChildren();
        bar.setAttribute('aria-label', pt() ? 'Filtros ativos' : 'Active filters');
        const entries = [];
        if (search.value.trim())
            entries.push({
                label: (pt() ? 'Pesquisa: ' : 'Search: ') + search.value.trim(),
                remove: () => {
                    search.value = '';
                    search.dispatchEvent(new Event('input', { bubbles: true }));
                },
                control: search,
            });
        for (const select of [genre, status])
            for (const option of select.selectedOptions)
                if (option.value !== 'all')
                    entries.push({
                        label: t(option.textContent.trim()),
                        remove: () => {
                            option.selected = false;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                        },
                        control: select.parentElement.querySelector('.multi-filter-trigger'),
                    });
        if (sort.value !== 'featured')
            entries.push({
                label: t(sort.selectedOptions[0].textContent.trim()),
                remove: () => {
                    sort.value = 'featured';
                    sort.dispatchEvent(new Event('change', { bubbles: true }));
                },
                control:
                    sort.closest('.site-select')?.querySelector('.site-select-trigger') || sort,
            });
        bar.hidden = !entries.length;
        entries.forEach((entry, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'catalog-filter-badge';
            button.setAttribute(
                'aria-label',
                (pt() ? 'Remover filtro: ' : 'Remove filter: ') + entry.label
            );
            const label = document.createElement('span'),
                cross = document.createElement('span');
            label.textContent = entry.label;
            cross.textContent = '×';
            cross.setAttribute('aria-hidden', 'true');
            button.append(label, cross);
            button.addEventListener('click', () => {
                entry.remove();
                (
                    bar.querySelectorAll('.catalog-filter-badge')[
                        Math.min(index, entries.length - 2)
                    ] ||
                    entry.control ||
                    search
                ).focus({ preventScroll: true });
            });
            bar.append(button);
        });
        if (entries.length) {
            const clear = document.createElement('button');
            clear.type = 'button';
            clear.className = 'catalog-filter-clear';
            clear.textContent = pt() ? 'Limpar filtros' : 'Clear filters';
            clear.addEventListener('click', () => {
                search.value = '';
                for (const s of [genre, status]) for (const o of s.options) o.selected = false;
                sort.value = 'featured';
                genre.dispatchEvent(new Event('change', { bubbles: true }));
                search.focus({ preventScroll: true });
            });
            bar.append(clear);
        }
    }
    window.addEventListener('backlog-catalog-render', render);
    window.addEventListener('backlog-language-change', render);
    render();
})();
