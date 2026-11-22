# Section candidates (backup)

Four candidate sections built for slot 2 (right after the hero). **D · Guest view** was chosen and lives in
`new-landing/section-guest-view.{css,js}`. The others are kept here for later sections:

- **A · How it works** – "Live in 5 minutes. Three steps, no training." (3 animated step cards)
- **B · Why InstaDine** – "Your guests are waiting. Your waiter is running." (chaos cards collapse into one QR)
- **C · 1¢ vs subscription** – "$49 a month, or 1¢ an order?" (comparison + live savings slider)

To preview any of them again, load `sections-preview.css` + `sections-preview.js` on the page; the script
inserts all four after the hero with an A–D switcher. Each section's markup is a separate constant (A, B, C, D)
in the JS and its styles are grouped by letter in the CSS, so a single one can be lifted out.
