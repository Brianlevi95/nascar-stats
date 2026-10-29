# Shared Home Improvement Projects

The Home Improvement Projects tab embeds https://larcom-home-projects.booradley95.chatgpt.site and offers a full-tab link. GitHub Pages serves the race notebook; the Sites application stores shared project records in a Cloudflare D1 database. No GitHub credentials are sent to visitors.

## Family use
- Add a project, or pin a suggestion to confirm it.
- Confirmed projects remain pinned until completed. Move the queue using the up/down arrows.
- Edit materials, tasks, tutorial links, measurements, notes, and status. Click **Save for everyone** in the editor. Queue arrows and card status changes save immediately.
- Refresh the shared board to see another person's edits. It also refreshes when revisiting the window outside the editor.
- Concurrent edits use a revision check; stale saves are rejected. Close/discard the draft, refresh, and review the latest project before editing again.
- Completed projects remain available to view or reopen. Export backup downloads shared project records as JSON.
- Anyone with the URL can read and edit this board, as requested. Names are optional attribution, not verified identities.

## Content updates
The five starter cards are suggestions, not assumed personal commitments. Add a confirmed DIY project directly, or give the assistant the relevant project conversation/details to research and add. This board does not automatically read other chats. Retail planning currently uses ZIP 62221, not a stored home address. Stock and prices are not represented as verified.

The backend's Sites project ID is appgprj_6ae2cf1502c081919b5ef3c4f31800d9. Its source is maintained separately with the Sites source/publish workflow; do not replace shared records with local browser storage. Local implementation checkout: C:/Users/Levi/Documents/Codex/2026-10-28/home-projects. The D1 schema is in db/schema.ts and migrations are in drizzle/. Preserve published migration history. GitHub updates to this integration must preserve the latest main branch and use an expected-head check.
