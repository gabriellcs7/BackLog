/* Visualize the existing yearly genre counts; no additional data requests. */
(() => {
    'use strict';
    const ns = 'http://www.w3.org/2000/svg';
    const t = (value) => window.BacklogI18n?.t(value) || value;
    const defaults = [
        'Action',
        'Adventure',
        'Fighting',
        'Horror',
        'MOBA',
        'RPG',
        'Sandbox',
        'Shooter',
        'Sports',
        'Survival',
    ];
    function node(tag, attributes = {}, text) {
        const element = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
        if (text !== undefined) element.textContent = text;
        return element;
    }
    function render(host, genres) {
        if (!host) return;
        host.replaceChildren();
        host.dataset.noTranslate = '';
        if (!genres.length) {
            host.hidden = true;
            return;
        }
        host.hidden = false;
        const axes = genres.slice(0, 6).map(([name, count]) => ({ name, count }));
        for (const name of defaults) {
            if (axes.length === 6) break;
            if (!axes.some((axis) => axis.name === name)) axes.push({ name, count: 0 });
        }
        const maximum = Math.max(1, ...axes.map((axis) => axis.count));
        const scale = maximum > 4 ? Math.ceil(maximum / 4) * 4 : maximum;
        const svg = node('svg', {
            viewBox: '0 0 380 340',
            class: 'genre-radar-svg',
            role: 'group',
            'aria-label': t('Genre distribution'),
        });
        svg.append(node('title', {}, t('Genre distribution')));
        const position = (index, radius) => {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length;
            return [190 + Math.cos(angle) * radius, 160 + Math.sin(angle) * radius];
        };
        const points = (radius) =>
            axes.map((_, index) => position(index, radius).join(',')).join(' ');
        const rings = Math.min(4, scale);
        for (let ring = 1; ring <= rings; ring++) {
            const radius = (ring / rings) * 100;
            svg.append(
                node('polygon', {
                    points: points(radius),
                    class: 'genre-radar-grid',
                    'aria-hidden': 'true',
                })
            );
            svg.append(
                node(
                    'text',
                    {
                        x: 196,
                        y: 160 - radius + 12,
                        class: 'genre-radar-scale',
                        'aria-hidden': 'true',
                    },
                    String((scale * ring) / rings)
                )
            );
        }
        axes.forEach((axis, index) => {
            const [x, y] = position(index, 100);
            svg.append(
                node('line', {
                    x1: 190,
                    y1: 160,
                    x2: x,
                    y2: y,
                    class: 'genre-radar-axis',
                    'aria-hidden': 'true',
                })
            );
            const [lx, ly] = position(index, 132),
                label = t(axis.name);
            const text = node(
                'text',
                {
                    x: lx,
                    y: ly,
                    class: 'genre-radar-label',
                    'text-anchor':
                        index === 0 || index === 3 ? 'middle' : lx > 190 ? 'start' : 'end',
                    'dominant-baseline': 'middle',
                    'aria-hidden': 'true',
                },
                label
            );
            if (label.length > 11) text.setAttribute('font-size', '10.5');
            svg.append(text);
        });
        svg.append(
            node('polygon', {
                points: axes
                    .map((axis, index) => position(index, (axis.count / scale) * 100).join(','))
                    .join(' '),
                class: 'genre-radar-shape',
                'aria-hidden': 'true',
            })
        );
        const readout = document.createElement('p');
        readout.className = 'genre-radar-readout';
        readout.setAttribute('role', 'status');
        const hint = t('Hover or focus a point to see its count.');
        readout.textContent = hint;
        axes.forEach((axis, index) => {
            const [cx, cy] = position(index, (axis.count / scale) * 100);
            const label =
                t(axis.name) + ': ' + axis.count + ' ' + t(axis.count === 1 ? 'game' : 'games');
            const point = node('circle', {
                cx,
                cy,
                r: 4,
                class: 'genre-radar-point',
                tabindex: '0',
                role: 'img',
                'aria-label': label,
            });
            point.append(node('title', {}, label));
            const show = () => {
                readout.textContent = label;
                point.classList.add('is-active');
            };
            const hide = () => {
                point.classList.remove('is-active');
                if (!svg.contains(document.activeElement)) readout.textContent = hint;
            };
            point.addEventListener('pointerenter', show);
            point.addEventListener('pointerleave', hide);
            point.addEventListener('focus', show);
            point.addEventListener('blur', hide);
            point.addEventListener('click', show);
            svg.append(point);
        });
        host.append(svg, readout);
    }
    window.BacklogGenreRadar = { render };
})();
