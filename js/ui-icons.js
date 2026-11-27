/* Small shared icon set for review, list and mobile navigation controls. */
(() => {
    'use strict';
    const shapes = {
        bold: '<path d="M7 3h6a5 5 0 0 1 0 10H7m0 0h7a4 4 0 0 1 0 8H7V3"/>',
        italic: '<path d="M10 3h9M5 21h9M15 3 9 21"/>',
        link: '<path d="m10 13 4-4m-6 2-3 3a4 4 0 0 0 6 6l3-3m-4-9 3-3a4 4 0 0 1 6 6l-3 3"/>',
        edit: '<path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/>',
        share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 11 6-4m-6 6 6 4"/>',
        copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
        download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
        profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
        activity: '<path d="M2 12h4l3-8 5 16 3-8h5"/>',
        games: '<path d="M7 7h10c4 0 7 12 3 12-2 0-3-4-5-4H9c-2 0-3 4-5 4C0 19 3 7 7 7Z"/><path d="M7 9v5m-2-2h4m6-1h.1m3 2h.1"/>',
        backlog: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
        diary: '<path d="M5 3h14v18H5ZM8 7h8m-8 5h8m-8 5h5"/>',
    };
    function icon(name) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        for (const [key, value] of Object.entries({
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.7',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'aria-hidden': 'true',
            focusable: 'false',
        }))
            svg.setAttribute(key, value);
        svg.innerHTML = shapes[name] || '';
        return svg;
    }
    window.BacklogIcons = Object.freeze({ icon });
})();
