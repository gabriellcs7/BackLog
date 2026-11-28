/* A brief confirmation burst, triggered only after a successful review save. */
(() => {
    'use strict';
    let canvas = null, frame = 0;
    function reduced() {
        const mode = document.documentElement.dataset.presentationMotion;
        return mode === 'reduced' || (mode !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; canvas?.remove(); canvas = null; }
    function burst(target) {
        stop();
        if (reduced() || document.hidden || !target?.getClientRects().length) return;
        const rect = target.getBoundingClientRect();
        const x = Math.max(12, Math.min(innerWidth - 12, rect.left + rect.width / 2));
        const y = Math.max(12, Math.min(innerHeight - 12, rect.top + rect.height / 2));
        canvas = document.createElement('canvas'); canvas.className = 'click-spark-layer';
        canvas.setAttribute('aria-hidden', 'true');
        Object.assign(canvas.style, {position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'1500',pointerEvents:'none'});
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(innerWidth * dpr); canvas.height = Math.ceil(innerHeight * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) { stop(); return; }
        ctx.scale(dpr, dpr); document.body.append(canvas);
        const particles = Array.from({length:10}, (_, i) => ({angle:i * Math.PI / 5 + (Math.random() - .5) * .2, distance:30 + Math.random() * 18}));
        const start = performance.now();
        function draw(now) {
            const progress = Math.min(1, (now - start) / 520);
            if (progress >= 1 || reduced()) { stop(); return; }
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            ctx.strokeStyle = '#ffd21f'; ctx.globalAlpha = 1 - progress; ctx.lineWidth = 2; ctx.lineCap = 'round';
            const ease = 1 - (1 - progress) ** 3;
            for (const particle of particles) {
                const distance = particle.distance * ease, length = 8 * (1 - progress);
                const dx = Math.cos(particle.angle), dy = Math.sin(particle.angle);
                ctx.beginPath(); ctx.moveTo(x + dx * distance, y + dy * distance); ctx.lineTo(x + dx * (distance + length), y + dy * (distance + length)); ctx.stroke();
            }
            frame = requestAnimationFrame(draw);
        }
        frame = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', stop);
    document.addEventListener('visibilitychange', () => {if (document.hidden) stop();});
    window.addEventListener('backlog-preferences-change', () => {if (reduced()) stop();});
    window.BacklogClickSpark = Object.freeze({burst, stop});
})();
