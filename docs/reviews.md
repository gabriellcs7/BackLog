# Personal ratings and reviews

When signed out, each game has one personal review in this browser, stored under `backlog:review:<game-id>`. Ratings range from 0 to 5 in 0.5-star steps; null means no rating. A rating or written text is required, and text is limited to 3,000 characters. Saving, editing and deleting reviews never changes collection statuses. Signed-out reviews stay private in the browser. Once connected and signed in, saving a review publishes it to the account profile and the game’s community feed. Previously saved device reviews are never published automatically; they can be loaded as drafts using an explicit button.

The game page includes a Your review tab, keyboard-accessible native rating inputs (0, 0.5, 1, …, 5), a live text counter, a saved review preview, edit/cancel controls and inline delete confirmation. The summary shows your personal rating rather than a community average. Written content is rendered as text. Storage failures leave the editor contents intact.

Validated across all 40 games, with responsive layouts at 320, 390, 768 and 1440 pixels. Checked zero/rating-only/text-only reviews, save and reload, editing and cancellation, confirmed deletion, per-game isolation, existing collection statuses, cross-tab updates, malformed storage and storage failures.

Half-star ratings: select the left half of a star for a half-step, or its right half for a whole step. Arrow keys move in 0.5 steps. Saved reviews render partially filled stars and the numeric score. Previous integer ratings remain valid without migration.

Online community reviews support one like per person, unlike, paginated comments of up to 1,000 characters, deleting your own comments, and links to public player profiles. Server policies prevent editing another person’s content or liking your own review. See [Supabase setup](supabase.md).
