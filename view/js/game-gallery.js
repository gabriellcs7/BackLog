/* Screenshots oficiais locais; imagens ampliadas sem recorte. */
(() => {
    'use strict';
    const ui = window.BacklogUI,
        requested = new URLSearchParams(location.search).get('id');
    const game =
        window.BacklogGames.find((item) => item.id === requested) || window.BacklogGames[0];
    const gallery = window.BacklogGameGalleries?.[game.id],
        section = document.querySelector('#screenshots');
    if (!ui || !section || !gallery?.images.length) return;
    const el = ui.element,
        grid = section.querySelector('.game-gallery-grid'),
        source = section.querySelector('.game-gallery-source');
    source.href = gallery.source;
    source.title = 'Screenshots from ' + gallery.edition;
    section.hidden = false;
    document.querySelector('.section-tabs a[href="#screenshots"]').hidden = false;
    const dialog = el('dialog', 'game-gallery-dialog');
    dialog.setAttribute('aria-label', game.title + ' screenshots');
    const header = el('div', 'game-gallery-dialog-header'),
        heading = el('h2', '', game.title),
        close = el('button', 'game-gallery-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close screenshots');
    const zoom = el('button', 'game-gallery-step game-gallery-zoom-toggle');
    zoom.type = 'button';
    zoom.dataset.noTranslate = '';
    zoom.setAttribute('aria-pressed', 'false');
    const tools = el('div', 'game-gallery-tools');
    tools.append(zoom, close);
    header.append(heading, tools);
    const figure = el('figure', 'game-gallery-stage'),
        image = el('img'),
        feedback = el('p', 'game-gallery-feedback');
    figure.tabIndex = 0;
    image.decoding = 'async';
    feedback.setAttribute('role', 'status');
    figure.append(image, feedback);
    const footer = el('div', 'game-gallery-controls'),
        previous = el('button', 'game-gallery-step', '← Previous'),
        next = el('button', 'game-gallery-step', 'Next →'),
        counter = el('span');
    previous.type = next.type = 'button';
    counter.setAttribute('aria-live', 'polite');
    footer.append(previous, counter, next);
    const credit = el('a', 'game-gallery-credit', 'Image source ↗');
    credit.target = '_blank';
    credit.rel = 'noopener noreferrer';
    dialog.append(header, figure, footer, credit);
    document.body.append(dialog);
    let index = 0,
        opener = null,
        oldOverflow = '',
        zoomed = false,
        pan = null,
        dragged = false;
    const pt = () => window.BacklogPreferences?.get().language === 'pt-BR';
    function labels() {
        figure.setAttribute(
            'aria-label',
            pt()
                ? 'Imagem do jogo. Após ampliar, role para explorar.'
                : 'Game screenshot. After zooming, scroll to explore.'
        );
        zoom.textContent = pt()
            ? zoomed
                ? 'Reduzir'
                : 'Ampliar'
            : zoomed
              ? 'Zoom out'
              : 'Zoom in';
        zoom.setAttribute('aria-pressed', String(zoomed));
        image.setAttribute(
            'aria-label',
            pt() ? 'Clique para ampliar ou reduzir a imagem' : 'Click to zoom in or out'
        );
    }
    function resetZoom() {
        zoomed = false;
        figure.classList.remove('is-zoomed');
        figure.scrollLeft = figure.scrollTop = 0;
        pan = null;
        labels();
    }
    function toggleZoom() {
        if (image.hidden || !image.complete || !image.naturalWidth) return;
        const cx = (figure.scrollLeft + figure.clientWidth / 2) / (figure.scrollWidth || 1),
            cy = (figure.scrollTop + figure.clientHeight / 2) / (figure.scrollHeight || 1);
        zoomed = !zoomed;
        figure.classList.toggle('is-zoomed', zoomed);
        labels();
        if (zoomed) {
            figure.scrollLeft = cx * figure.scrollWidth - figure.clientWidth / 2;
            figure.scrollTop = cy * figure.scrollHeight - figure.clientHeight / 2;
        } else figure.scrollLeft = figure.scrollTop = 0;
    }
    zoom.addEventListener('click', toggleZoom);
    image.addEventListener('click', () => {
        if (!dragged) toggleZoom();
        dragged = false;
    });
    image.addEventListener('dragstart', (event) => event.preventDefault());
    figure.addEventListener('pointerdown', (event) => {
        dragged = false;
        if (!zoomed || event.pointerType === 'touch' || event.button !== 0) return;
        pan = {
            x: event.clientX,
            y: event.clientY,
            left: figure.scrollLeft,
            top: figure.scrollTop,
            id: event.pointerId,
        };
        figure.setPointerCapture(event.pointerId);
    });
    figure.addEventListener('pointermove', (event) => {
        if (!pan || pan.id !== event.pointerId) return;
        const x = event.clientX - pan.x,
            y = event.clientY - pan.y;
        if (Math.abs(x) + Math.abs(y) > 5) dragged = true;
        figure.scrollLeft = pan.left - x;
        figure.scrollTop = pan.top - y;
    });
    figure.addEventListener('pointerup', () => {
        pan = null;
    });
    figure.addEventListener('pointercancel', () => {
        pan = null;
    });
    // Captured pointer clicks land on the stage instead of the image.
    figure.addEventListener('click', (event) => {
        if (event.target === figure && zoomed && !dragged) toggleZoom();
    });
    window.addEventListener('backlog-language-change', labels);
    labels();
    function show(value) {
        resetZoom();
        index = (value + gallery.images.length) % gallery.images.length;
        image.alt = game.title + ' — screenshot ' + (index + 1) + ' of ' + gallery.images.length;
        zoom.disabled = true;
        image.hidden = false;
        feedback.textContent = 'Loading screenshot…';
        image.src = ui.href('imagens/' + gallery.images[index].full);
        credit.href = gallery.images[index].source || gallery.source;
        credit.textContent = (gallery.images[index].credit || gallery.edition) + ' ↗';
        counter.textContent = index + 1 + ' / ' + gallery.images.length;
        previous.disabled = next.disabled = gallery.images.length < 2;
    }
    image.addEventListener('load', () => {
        feedback.textContent = '';
        zoom.disabled = false;
    });
    image.addEventListener('error', () => {
        zoom.disabled = true;
        resetZoom();
        image.hidden = true;
        feedback.textContent = 'This screenshot could not be loaded. Try the next image.';
    });
    function open(value, button) {
        opener = button;
        oldOverflow = document.body.style.overflow;
        show(value);
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        close.focus({ preventScroll: true });
    }
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        resetZoom();
        document.body.style.overflow = oldOverflow;
        opener?.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            const r = dialog.getBoundingClientRect();
            if (
                event.clientX < r.left ||
                event.clientX > r.right ||
                event.clientY < r.top ||
                event.clientY > r.bottom
            )
                dialog.close();
        }
    });
    dialog.addEventListener('keydown', (event) => {
        if (!zoomed && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault();
            show(index + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });
    previous.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    gallery.images.forEach((shot, i) => {
        const button = el('button', 'game-gallery-shot');
        button.type = 'button';
        button.setAttribute('aria-label', 'View ' + game.title + ' screenshot ' + (i + 1));
        const thumb = el('img');
        thumb.src = ui.href('imagens/' + shot.thumb);
        thumb.alt = '';
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        const overlay = el('span', 'game-gallery-zoom', '↗'),
            number = el('span', 'game-gallery-number', String(i + 1).padStart(2, '0'));
        overlay.setAttribute('aria-hidden', 'true');
        number.setAttribute('aria-hidden', 'true');
        button.append(thumb, overlay, number);
        button.addEventListener('click', () => open(i, button));
        grid.append(button);
    });
})();
