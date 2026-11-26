/* Explicit collection actions only; automatic status on review save stays untouched. */
(() => {
    'use strict';
    const api = window.Backlog,
        account = window.BacklogAccount;
    let active = null,
        timer,
        serial = 0,
        queue = Promise.resolve();
    const owner = () => account?.user?.id || 'local',
        pt = () => window.BacklogPreferences?.get().language === 'pt-BR';
    const box = document.createElement('aside');
    box.className = 'status-undo-toast';
    box.hidden = true;
    box.dataset.noTranslate = '';
    box.setAttribute('aria-label', 'Collection update');
    const check = document.createElement('span');
    check.className = 'status-undo-check';
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div'),
        message = document.createElement('strong'),
        name = document.createElement('small'),
        live = document.createElement('span');
    live.className = 'visually-hidden';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    copy.append(message, name);
    const undo = document.createElement('button'),
        dismiss = document.createElement('button');
    undo.type = dismiss.type = 'button';
    undo.className = 'status-undo-button';
    dismiss.className = 'status-undo-dismiss';
    dismiss.textContent = '×';
    box.append(check, copy, undo, dismiss, live);
    document.body.append(box);
    function hide() {
        clearTimeout(timer);
        active = null;
        box.hidden = true;
    }
    function arm() {
        clearTimeout(timer);
        if (
            active &&
            !active.busy &&
            !box.matches(':hover') &&
            !box.contains(document.activeElement)
        )
            timer = setTimeout(hide, 12000);
    }
    function labels() {
        undo.textContent = pt() ? 'Desfazer ↶' : 'Undo ↶';
        dismiss.setAttribute('aria-label', pt() ? 'Fechar aviso' : 'Dismiss notification');
        box.setAttribute('aria-label', pt() ? 'Atualização da coleção' : 'Collection update');
    }
    function show(data) {
        clearTimeout(timer);
        active = data;
        box.hidden = false;
        undo.hidden = false;
        undo.disabled = dismiss.disabled = false;
        labels();
        const status = api.statusOptions.find((s) => s.id === data.next);
        message.textContent = status
            ? (pt() ? 'Status: ' : 'Status: ') +
              (window.BacklogI18n?.t(status.label) || status.label)
            : pt()
              ? 'Removido da coleção'
              : 'Removed from collection';
        name.textContent = data.title;
        live.textContent = message.textContent + '. ' + data.title;
        arm();
    }
    async function change(id, next, who, ticket) {
        await account?.ready;
        await api.statusReady;
        if (owner() !== who) throw Error('Your account changed. Please try again.');
        const before = api.getStatus(id)?.id || null;
        if (before === next) return;
        const date =
            who === 'local' ? localStorage.getItem('backlog:status-date:local:' + id) : null;
        if (next) await api.setStatus(id, next);
        else await api.removeStatus(id);
        if (owner() === who && ticket === serial && (api.getStatus(id)?.id || null) === next)
            show({
                id,
                next,
                before,
                owner: who,
                date,
                title: window.BacklogGames.find((g) => g.id === id)?.title || id,
                busy: false,
            });
    }
    undo.addEventListener('click', async () => {
        const action = active;
        if (!action || action.busy) return;
        clearTimeout(timer);
        action.busy = true;
        undo.disabled = dismiss.disabled = true;
        const task = queue
            .catch(() => {})
            .then(async () => {
                try {
                    await account?.ready;
                    await api.statusReady;
                    if (
                        active !== action ||
                        owner() !== action.owner ||
                        (api.getStatus(action.id)?.id || null) !== action.next
                    ) {
                        hide();
                        return;
                    }
                    if (action.before) await api.setStatus(action.id, action.before);
                    else await api.removeStatus(action.id);
                    if (owner() !== action.owner || active !== action) return;
                    if (action.owner === 'local' && action.before) {
                        const k = 'backlog:status-date:local:' + action.id;
                        if (action.date) localStorage.setItem(k, action.date);
                        else localStorage.removeItem(k);
                        window.dispatchEvent(new Event('backlog-change'));
                    }
                    message.textContent = pt() ? 'Alteração desfeita' : 'Change undone';
                    live.textContent = message.textContent;
                    undo.hidden = true;
                    action.busy = false;
                    dismiss.disabled = false;
                    dismiss.focus({ preventScroll: true });
                    arm();
                } catch {
                    if (active === action) {
                        action.busy = false;
                        message.textContent = pt()
                            ? 'Não foi possível desfazer. Tente novamente.'
                            : 'Could not undo. Please try again.';
                        live.textContent = message.textContent;
                        undo.disabled = dismiss.disabled = false;
                        undo.focus({ preventScroll: true });
                    }
                }
            });
        queue = task;
        await task;
    });
    dismiss.addEventListener('click', hide);
    box.addEventListener('pointerenter', () => clearTimeout(timer));
    box.addEventListener('pointerleave', arm);
    box.addEventListener('focusin', () => clearTimeout(timer));
    box.addEventListener('focusout', () => setTimeout(arm, 0));
    window.addEventListener('backlog-account-change', () => {
        ++serial;
        hide();
    });
    function invalidate() {
        if (
            active &&
            !active.busy &&
            (owner() !== active.owner || (api.getStatus(active.id)?.id || null) !== active.next)
        )
            hide();
    }
    window.addEventListener('backlog-change', invalidate);
    window.addEventListener('storage', invalidate);
    window.addEventListener('backlog-language-change', () => {
        labels();
    });
    function request(id, next) {
        const who = owner(),
            ticket = ++serial;
        hide();
        const task = queue.catch(() => {}).then(() => change(id, next, who, ticket));
        queue = task;
        return task;
    }
    window.BacklogStatusActions = {
        setStatus: (id, status) => request(id, status),
        removeStatus: (id) => request(id, null),
    };
})();
