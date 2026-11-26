/* Authenticated private feedback, with an honest file export for device profiles. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        account = window.BacklogAccount,
        el = ui.element,
        t = (s) => window.BacklogI18n?.t(s) || s,
        main = document.querySelector('main');
    if (!main) return;
    const section = el('section', 'project-help-bottom feedback-entry');
    section.id = 'feedback';
    const entrytitle = el('h2'),
        entrycopy = el('p'),
        open = el('button', 'social-button social-button-primary');
    open.type = 'button';
    section.append(entrytitle, entrycopy, open);
    main.append(section);
    const dialog = el('dialog', 'component-dialog feedback-dialog');
    dialog.dataset.noTranslate = '';
    dialog.setAttribute('aria-labelledby', 'site-feedback-title');
    const header = el('div', 'component-dialog-heading'),
        title = el('h2');
    title.id = 'site-feedback-title';
    const close = el('button', 'component-dialog-close', '×');
    close.type = 'button';
    close.dataset.componentClose = '';
    header.append(title, close);
    const intro = el('p', 'component-dialog-intro'),
        form = el('form'),
        reasons = el('fieldset', 'feedback-reasons'),
        legend = el('legend', 'visually-hidden');
    reasons.append(legend);
    const categories = [
            ['issue', 'Something is broken'],
            ['image', 'Wrong game image'],
            ['suggestion', 'A suggestion'],
            ['other', 'Something else'],
        ],
        choices = [];
    for (const [value, label] of categories) {
        const wrap = el('label', 'feedback-reason'),
            radio = el('input');
        radio.type = 'radio';
        radio.name = 'feedback-category';
        radio.value = value;
        radio.required = true;
        radio.checked = value === 'issue';
        const text = el('span');
        wrap.append(radio, text);
        reasons.append(wrap);
        choices.push({ text, label });
    }
    const label = el('label', 'feedback-text-label'),
        input = el('textarea');
    input.id = 'site-feedback-message';
    input.maxLength = 500;
    input.minLength = 10;
    input.required = true;
    input.rows = 4;
    label.htmlFor = input.id;
    const foot = el('div', 'component-dialog-footer'),
        note = el('span'),
        count = el('span'),
        privacy = el('p', 'feedback-privacy'),
        actions = el('div', 'social-actions feedback-actions'),
        cancel = el('button', 'social-button'),
        send = el('button', 'social-button social-button-primary');
    cancel.type = 'button';
    cancel.dataset.componentClose = '';
    send.type = 'submit';
    actions.append(cancel, send);
    foot.append(note, count);
    const status = el('p', 'social-feedback');
    status.setAttribute('role', 'status');
    input.setAttribute('aria-describedby', 'feedback-message-status');
    status.id = 'feedback-message-status';
    const success = el('div', 'feedback-success');
    success.hidden = true;
    const mark = el('div', 'feedback-success-mark', '✓'),
        successTitle = el('h3'),
        successCopy = el('p'),
        again = el('button', 'social-button');
    again.type = 'button';
    success.append(mark, successTitle, successCopy, again);
    form.append(reasons, label, input, foot, privacy, actions, status);
    dialog.append(header, intro, form, success);
    document.body.append(dialog);
    const lifecycle = window.BacklogComponentDialog.mount(dialog);
    let busy = false,
        lastOwner = account.user?.id || 'local',
        outcome = '';
    function render() {
        entrytitle.textContent = t('Help us improve BackLog.');
        entrycopy.textContent = t('Report a problem, flag an image, or share a suggestion.');
        open.textContent = t('Send feedback');
        title.textContent = t('Help us improve.');
        close.setAttribute('aria-label', t('Close'));
        intro.textContent = t('Found something? We would like to know.');
        legend.textContent = t('Feedback category');
        choices.forEach((c) => (c.text.textContent = t(c.label)));
        label.textContent = t('Tell us a little more');
        input.placeholder = t('What happened? What could be better?');
        note.textContent = t('Use 10 to 500 characters.');
        count.textContent = input.value.length + ' / 500';
        cancel.textContent = t('Cancel');
        send.textContent = t(
            busy ? 'Sending…' : account.user ? 'Send feedback' : 'Download message'
        );
        send.disabled = busy || account.loading || input.value.trim().length < 10;
        privacy.textContent = t(
            account.user
                ? 'Your message is private and can only be read by the project maintainer.'
                : 'Without signing in, download your message to share it yourself. Nothing is sent automatically.'
        );
        again.textContent = t('Write another message');
        successTitle.textContent = t(
            outcome === 'sent' ? 'Thanks for your feedback.' : 'Message file prepared.'
        );
        successCopy.textContent = t(
            outcome === 'sent'
                ? 'Your message was saved in the private project inbox.'
                : 'Your message was prepared as a text file. No message was sent.'
        );
    }
    open.addEventListener('click', () => {
        render();
        lifecycle.open(open);
        if (!success.hidden) again.focus();
        else input.focus();
    });
    input.addEventListener('input', render);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (busy || account.loading || !form.reportValidity()) return;
        const message = input.value.trim();
        if (message.length < 10) {
            status.textContent = t('Use 10 to 500 characters.');
            input.focus();
            return;
        }
        const owner = account.user?.id || 'local',
            category = form.elements['feedback-category'].value;
        busy = true;
        status.textContent = '';
        for (const node of form.querySelectorAll('input,textarea,button')) node.disabled = true;
        render();
        try {
            if (account.user) {
                await account.submitFeedback(category, message);
                outcome = 'sent';
            } else {
                const text = 'BackLog feedback\nCategory: ' + category + '\n\n' + message + '\n';
                const url = URL.createObjectURL(
                        new Blob([text], { type: 'text/plain;charset=utf-8' })
                    ),
                    a = el('a');
                a.href = url;
                a.download = 'backlog-feedback.txt';
                document.body.append(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                outcome = 'download';
            }
            if ((account.user?.id || 'local') !== owner) return;
            input.value = '';
            form.hidden = true;
            success.hidden = false;
            render();
            again.focus();
        } catch (error) {
            if ((account.user?.id || 'local') === owner) {
                status.textContent = t(
                    error.message || 'Could not send feedback. Please try again.'
                );
                input.focus();
            }
        } finally {
            busy = false;
            for (const node of form.querySelectorAll('input,textarea,button'))
                node.disabled = false;
            render();
        }
    });
    again.addEventListener('click', () => {
        form.hidden = false;
        success.hidden = true;
        outcome = '';
        status.textContent = '';
        render();
        input.focus();
    });
    window.addEventListener('backlog-account-change', () => {
        const owner = account.user?.id || 'local';
        if (owner !== lastOwner) {
            lastOwner = owner;
            input.value = '';
            form.hidden = false;
            success.hidden = true;
            status.textContent = '';
            if (dialog.open) lifecycle.close();
        }
        render();
    });
    window.addEventListener('backlog-language-change', render);
    account.ready.then(render);
    render();
})();
