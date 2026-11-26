/* Estados vazios: mantém as mensagens e os links existentes. */
(() => {
    'use strict';
    const el = window.BacklogUI.element;
    function enhance(node) {
        if (
            node.querySelector('.empty-state-copy') ||
            !node.textContent.trim() ||
            /loading|could not|unavailable|error|try again/i.test(node.textContent)
        )
            return;
        const copy = el('span', 'empty-state-copy');
        while (node.firstChild) copy.append(node.firstChild);
        const icon = el('span', 'empty-state-icon', '◇');
        icon.setAttribute('aria-hidden', 'true');
        node.classList.add('backlog-empty-state');
        node.append(icon, copy);
    }
    function scan(root) {
        if (root.matches?.('p.social-empty')) enhance(root);
        root.querySelectorAll?.('p.social-empty').forEach(enhance);
    }
    scan(document);
    new MutationObserver((records) => {
        for (const record of records) {
            if (record.target instanceof Element && record.target.matches('p.social-empty'))
                enhance(record.target);
            for (const node of record.addedNodes) if (node instanceof Element) scan(node);
        }
    }).observe(document.body, { childList: true, subtree: true });
})();
