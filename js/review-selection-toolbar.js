/* Contextual shortcuts reuse the existing review editor and its serializer. */
(() => {
    'use strict';
    const editor = document.getElementById('review-rich-text');
    const box = editor?.closest('.rich-review-editor');
    if (!box || !window.BacklogIcons) return;
    const t = (value) => window.BacklogI18n?.t(value) || value;
    const toolbar = document.createElement('div');
    toolbar.className = 'review-selection-toolbar';
    toolbar.hidden = true;
    toolbar.dataset.noTranslate = '';
    toolbar.setAttribute('role', 'toolbar');
    box.after(toolbar);
    const controls = [];
    let frame = 0;

    function currentRange() {
        const selected = getSelection();
        if (
            !selected?.rangeCount ||
            selected.isCollapsed ||
            editor.contentEditable !== 'true' ||
            box.hidden ||
            editor.closest('form')?.inert ||
            document.querySelector('dialog[open]')
        )
            return null;
        const range = selected.getRangeAt(0);
        return editor.contains(range.startContainer) && editor.contains(range.endContainer)
            ? range
            : null;
    }

    function update() {
        frame = 0;
        const range = currentRange();
        if (!range) {
            toolbar.hidden = true;
            return;
        }
        const rect = range.getBoundingClientRect();
        const view = window.visualViewport;
        const left = view?.offsetLeft || 0,
            top = view?.offsetTop || 0;
        const width = view?.width || innerWidth,
            height = view?.height || innerHeight;
        if (rect.bottom < top || rect.top > top + height) {
            toolbar.hidden = true;
            return;
        }
        // Save the range using the editor's own selection handler.
        editor.dispatchEvent(new Event('keyup'));
        toolbar.hidden = false;
        const x = Math.max(
            left + 8,
            Math.min(
                left + width - toolbar.offsetWidth - 8,
                rect.left + rect.width / 2 - toolbar.offsetWidth / 2
            )
        );
        const preferred = rect.top - toolbar.offsetHeight - 10;
        const y =
            preferred >= top + 8
                ? preferred
                : Math.min(rect.bottom + 10, top + height - toolbar.offsetHeight - 8);
        toolbar.style.left = x + 'px';
        toolbar.style.top = Math.max(top + 8, y) + 'px';
        for (const { button, command } of controls) {
            const original = box.querySelector('[data-command="' + command + '"]');
            if (command !== 'link')
                button.setAttribute(
                    'aria-pressed',
                    original?.getAttribute('aria-pressed') || 'false'
                );
            button.disabled = Boolean(original?.disabled);
        }
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }
    for (const [command, glyph, label] of [
        ['bold', 'bold', 'Bold'],
        ['italic', 'italic', 'Italic'],
        ['link', 'link', 'Insert link'],
    ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'review-selection-tool';
        button.append(window.BacklogIcons.icon(glyph));
        button.addEventListener('pointerdown', (event) => event.preventDefault());
        button.addEventListener('click', () => {
            box.querySelector('[data-command="' + command + '"]')?.click();
            schedule();
        });
        toolbar.append(button);
        controls.push({ button, command, label });
    }
    toolbar.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let index = controls.findIndex((control) => control.button === document.activeElement);
        index =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? controls.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) %
                    controls.length;
        controls[index].button.focus();
    });
    document.addEventListener('selectionchange', schedule);
    document.addEventListener('keydown', (event) => {
        if (
            event.key === 'Escape' &&
            !toolbar.hidden &&
            (editor.contains(event.target) || toolbar.contains(event.target))
        ) {
            event.preventDefault();
            event.stopPropagation();
            getSelection()?.removeAllRanges();
            toolbar.hidden = true;
            editor.focus();
        }
    });
    document.addEventListener('pointerdown', (event) => {
        if (!box.contains(event.target) && !toolbar.contains(event.target)) toolbar.hidden = true;
    });
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    new MutationObserver(schedule).observe(editor, {
        attributes: true,
        attributeFilter: ['contenteditable'],
    });
    function localize() {
        toolbar.setAttribute('aria-label', t('Format selected text'));
        for (const { button, label } of controls) {
            button.title = t(label);
            button.setAttribute('aria-label', t(label));
        }
    }
    window.addEventListener('backlog-language-change', localize);
    localize();
})();
