/* Corações animam somente depois de a API confirmar a curtida. */
(() => {
    'use strict';
    window.BacklogLikeEffects = {
        render(button, liked, count, label) {
            liked = Boolean(liked);
            const was = button.dataset.likeState;
            button.dataset.likeState = String(liked);
            button.classList.add('like-burst-control');
            const heart = document.createElement('span');
            heart.className = 'like-burst-heart';
            heart.textContent = liked ? '♥' : '♡';
            heart.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.textContent =
                (liked ? 'Liked' : 'Like') + ' · ' + Number(count || 0).toLocaleString('en');
            button.replaceChildren(heart, text);
            button.setAttribute(
                'aria-label',
                (liked ? 'Unlike' : 'Like') + ' ' + label + ', ' + Number(count || 0) + ' likes'
            );
            if (
                was === 'false' &&
                liked &&
                !(
                    window.BacklogMotion?.matches ??
                    matchMedia('(prefers-reduced-motion:reduce)').matches
                )
            ) {
                heart.classList.add('is-bursting');
                for (let i = 0; i < 6; i++) {
                    const spark = document.createElement('i');
                    spark.style.setProperty('--spark-angle', i * 60 + 'deg');
                    heart.append(spark);
                }
                const cleanup = () => {
                    heart.classList.remove('is-bursting');
                    heart.querySelectorAll('i').forEach((n) => n.remove());
                };
                heart.addEventListener('animationend', cleanup, { once: true });
                setTimeout(cleanup, 500);
            }
        },
    };
})();
