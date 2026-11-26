/* Calendário de datas que preserva os campos nativos, valores ISO e validação. */
(() => {
    'use strict';
    const t = (s) => window.BacklogI18n?.t(s) || s,
        locale = () => window.BacklogI18n?.locale || 'en';
    const el = (tag, cls = '', text) => {
        const n = document.createElement(tag);
        n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    };
    const iso = (d) =>
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0');
    function parse(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
        const d = new Date(value + 'T12:00:00');
        return Number.isFinite(d.getTime()) && iso(d) === value ? d : null;
    }
    const instances = [];
    let active = null;
    function enhance(input) {
        if (input.dataset.calendarEnhanced) return;
        input.dataset.calendarEnhanced = 'true';
        const wrap = el('span', 'calendar-field'),
            trigger = el('button', 'calendar-trigger', '▦');
        trigger.type = 'button';
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-expanded', 'false');
        if (!input.hasAttribute('aria-label') && input.labels?.[0])
            input.setAttribute('aria-label', input.labels[0].textContent.trim());
        input.before(wrap);
        wrap.append(input, trigger);
        const panel = el('div', 'date-calendar');
        panel.id = 'date-calendar-' + instances.length;
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.dataset.noTranslate = '';
        trigger.setAttribute('aria-controls', panel.id);
        const native = typeof panel.showPopover === 'function';
        if (native) panel.setAttribute('popover', 'auto');
        (input.closest('dialog') || document.body).append(panel);
        let month = new Date(),
            opened = false,
            focusDate = null;
        const today = () => parse(window.BacklogDiary?.today() || iso(new Date())),
            allowed = (d) =>
                d &&
                (!parse(input.min) || iso(d) >= input.min) &&
                (!parse(input.max) || iso(d) <= input.max);
        function position() {
            if (!opened) return;
            const r = wrap.getBoundingClientRect();
            panel.style.width = Math.min(310, innerWidth - 24) + 'px';
            const height = panel.offsetHeight;
            panel.style.left =
                Math.max(12, Math.min(innerWidth - panel.offsetWidth - 12, r.left)) + 'px';
            panel.style.top =
                (innerHeight - r.bottom > height + 14
                    ? r.bottom + 8
                    : Math.max(12, r.top - height - 8)) + 'px';
        }
        function close(restore = false) {
            opened = false;
            if (native && panel.matches(':popover-open')) panel.hidePopover();
            panel.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (active === control) active = null;
            if (restore) trigger.focus({ preventScroll: true });
        }
        function choose(d) {
            if (!allowed(d)) return;
            input.value = iso(d);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            close(true);
        }
        function button(label, handler, cls = '') {
            const b = el('button', cls, label);
            b.type = 'button';
            b.addEventListener('click', handler);
            return b;
        }
        function render(restore = false) {
            const focused = focusDate;
            panel.replaceChildren();
            panel.setAttribute('aria-label', t('Choose a date'));
            trigger.setAttribute('aria-label', t('Open calendar'));
            const header = el('div', 'date-calendar-header'),
                previous = button('‹', () => moveMonth(-1)),
                next = button('›', () => moveMonth(1));
            previous.setAttribute('aria-label', t('Previous month'));
            next.setAttribute('aria-label', t('Next month'));
            const selectors = el('div', 'date-calendar-selectors'),
                select = el('select'),
                year = el('input');
            select.dataset.nativeSelect = '';
            select.setAttribute('aria-label', t('Month'));
            year.type = 'number';
            year.min = String(parse(input.min)?.getFullYear() || 1900);
            year.max = String(parse(input.max)?.getFullYear() || 9999);
            year.value = String(month.getFullYear());
            year.setAttribute('aria-label', t('Year'));
            for (let m = 0; m < 12; m++) {
                const option = el(
                    'option',
                    '',
                    new Intl.DateTimeFormat(locale(), { month: 'long' }).format(
                        new Date(2024, m, 1, 12)
                    )
                );
                option.value = String(m);
                select.append(option);
            }
            select.value = String(month.getMonth());
            select.addEventListener('change', () => {
                month = new Date(month.getFullYear(), Number(select.value), 1, 12);
                render();
            });
            year.addEventListener('change', () => {
                const n = Number(year.value);
                if (!Number.isInteger(n) || n < Number(year.min) || n > Number(year.max)) {
                    year.value = String(month.getFullYear());
                    return;
                }
                month = new Date(n, month.getMonth(), 1, 12);
                render();
            });
            selectors.append(select, year);
            header.append(previous, selectors, next);
            const min = parse(input.min),
                max = parse(input.max);
            previous.disabled = Boolean(
                min && new Date(month.getFullYear(), month.getMonth(), 0, 12) < min
            );
            next.disabled = Boolean(
                max && new Date(month.getFullYear(), month.getMonth() + 1, 1, 12) > max
            );
            const weekdays = el('div', 'date-calendar-weekdays');
            for (let i = 0; i < 7; i++)
                weekdays.append(
                    el(
                        'span',
                        '',
                        new Intl.DateTimeFormat(locale(), { weekday: 'narrow' }).format(
                            new Date(2024, 0, 1 + i, 12)
                        )
                    )
                );
            const grid = el('div', 'date-calendar-days');
            grid.setAttribute('role', 'group');
            grid.setAttribute(
                'aria-label',
                new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(month)
            );
            const start = (new Date(month.getFullYear(), month.getMonth(), 1, 12).getDay() + 6) % 7;
            for (let i = 0; i < start; i++) grid.append(el('span', 'date-calendar-blank'));
            const count = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate(),
                selected = input.value,
                valid = [];
            for (let day = 1; day <= count; day++) {
                const date = new Date(month.getFullYear(), month.getMonth(), day, 12),
                    value = iso(date),
                    b = button(String(day), () => choose(date), 'date-calendar-day');
                b.dataset.date = value;
                b.disabled = !allowed(date);
                b.setAttribute(
                    'aria-label',
                    new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(date)
                );
                b.setAttribute('aria-pressed', String(value === selected));
                if (value === iso(today())) b.setAttribute('aria-current', 'date');
                b.tabIndex = -1;
                if (!b.disabled) valid.push(b);
                grid.append(b);
            }
            const preferred =
                valid.find((b) => b.dataset.date === (focused || selected)) ||
                valid.find((b) => b.dataset.date === iso(today())) ||
                valid[0];
            if (preferred) preferred.tabIndex = 0;
            const shortcuts = el('div', 'date-calendar-shortcuts'),
                yesterday = today();
            yesterday.setDate(yesterday.getDate() - 1);
            const now = button(t('Today'), () => choose(today())),
                before = button(t('Yesterday'), () => choose(yesterday)),
                dismiss = button(t('Close'), () => close(true));
            now.disabled = !allowed(today());
            before.disabled = !allowed(yesterday);
            shortcuts.append(before, now, dismiss);
            panel.append(header, weekdays, grid, shortcuts);
            position();
            if (restore) preferred?.focus({ preventScroll: true });
        }
        function moveMonth(delta) {
            month = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12);
            focusDate = null;
            render();
        }
        function open() {
            if (input.disabled || input.readOnly) return;
            active?.close();
            let date = parse(input.value) || today();
            if (parse(input.min) && date < parse(input.min)) date = parse(input.min);
            if (parse(input.max) && date > parse(input.max)) date = parse(input.max);
            focusDate = iso(date);
            month = new Date(date.getFullYear(), date.getMonth(), 1, 12);
            opened = true;
            active = control;
            panel.hidden = false;
            render();
            trigger.setAttribute('aria-expanded', 'true');
            if (native) panel.showPopover();
            position();
            panel.querySelector('.date-calendar-day[tabindex="0"]')?.focus({ preventScroll: true });
        }
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            opened ? close(true) : open();
        });
        panel.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                close(true);
                return;
            }
            const current = event.target.closest('[data-date]');
            if (!current) return;
            const date = parse(current.dataset.date);
            let next = null;
            const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
            if (event.key in deltas) {
                next = new Date(date);
                next.setDate(next.getDate() + deltas[event.key]);
            } else if (event.key === 'Home' || event.key === 'End') {
                next = new Date(date);
                const weekday = (date.getDay() + 6) % 7;
                next.setDate(date.getDate() + (event.key === 'Home' ? -weekday : 6 - weekday));
            } else if (event.key === 'PageUp' || event.key === 'PageDown') {
                const m = event.key === 'PageUp' ? -1 : 1,
                    target = new Date(date.getFullYear(), date.getMonth() + m, 1, 12);
                target.setDate(
                    Math.min(
                        date.getDate(),
                        new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate()
                    )
                );
                next = target;
            }
            if (next) {
                event.preventDefault();
                if (!allowed(next)) return;
                focusDate = iso(next);
                month = new Date(next.getFullYear(), next.getMonth(), 1, 12);
                render(true);
            }
        });
        panel.addEventListener('toggle', (event) => {
            if (event.newState === 'closed' && opened) {
                opened = false;
                panel.hidden = true;
                trigger.setAttribute('aria-expanded', 'false');
                if (active === control) active = null;
            }
        });
        document.addEventListener('pointerdown', (event) => {
            if (opened && !panel.contains(event.target) && !wrap.contains(event.target)) close();
        });
        input.closest('dialog')?.addEventListener('close', () => close());
        const control = {
            close,
            position,
            refresh() {
                trigger.disabled = input.disabled || input.readOnly;
                trigger.setAttribute('aria-label', t('Open calendar'));
                if (opened) render();
            },
        };
        instances.push(control);
        control.refresh();
    }
    document.querySelectorAll('input[type="date"]').forEach(enhance);
    window.addEventListener('resize', () => active?.position());
    window.addEventListener('scroll', () => active?.position(), { passive: true });
    window.addEventListener('backlog-language-change', () => instances.forEach((c) => c.refresh()));
})();
