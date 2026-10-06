# NASCAR Stats — Race notebook

## Family sections

**Fantasy League:** refreshes the hosted standings snapshot when visitors click Refresh league stats. Import a CSV containing `name,points,lastRacePoints` with `node scripts/import-fantasy.mjs standings.csv`, then publish `data/family.json`. Automatic external league syncing needs a confirmed provider and its API/export access; this initial version does not claim a live league connection. Set `fantasy.sourceUrl` to the league page for a direct link. Standings published here are visible to all visitors.

**Dad’s Corner:** edit `dad.title`, `dad.message`, `dad.favoriteDrivers` (exact driver names), and `dad.links` (objects with title/url) in `data/family.json`. Set `dad.updatedAt` when changing his briefing. Publish that file to update the tab. Notes support plain text and line breaks; HTML is escaped. This is a public personalized tab, not a password-protected area.

**Schedule:** `data/schedule.json` holds the 2026 Cup points-race dates from the local export, plus the remaining six races and start times/TV from NASCAR’s official February 10 schedule PDF, checked October 6, 2026. Historical start times are not yet populated. Exhibition events are not included. Update this file when NASCAR changes the schedule; times are Eastern Time and the official schedule link is always available.

**Weather:** users search a city or ZIP, select the matching location, and view seven days of highs/lows and precipitation chances from Open-Meteo. Set `weather.defaultLocation` in `data/family.json` for a suggested home location. No GPS permission or API key is needed. Requests send the search text/selected coordinates to Open-Meteo only when requested. Free service is for noncommercial use; review licensing if monetizing the site. Provider outages display an error rather than stale or invented forecasts.

Static, public NASCAR Cup Series explorer using the cleaned Stats Manager `v_analysis` export. No server, account, or database is required by visitors. Driver Lookup, Track Lookup, shared-race Head-to-Head, sortable leaderboards, season/track/type filters, and recent race finishing orders are included. Coverage is shown from the dataset, not inferred from today's date. Missing ratings are excluded from averages. Comparisons use only shared race starts.

## Update after a race

1. Run **UPDATE DATABASE** in the existing desktop Stats Manager.
2. Run `node scripts/export-data.mjs "C:\path\to\Stats Manager\exports\v_analysis.csv"` in this repository checkout (Node 22 or later).
3. Run `npm test`.
4. Commit and push the updated `data/stats.json` to `main`. GitHub Pages rebuilds automatically. Only race data is exported; local database, cache, and credentials stay on your computer.

The exporter validates required fields, numeric values, dates, and unique race/driver keys before atomically replacing the website data. Keep series codes if adding other series later; the current site covers Cup only and would need a series filter before mixing series.

## Desktop publisher integration path

After the desktop updater finishes rebuilding exports successfully, invoke the exporter above against its `exports/v_analysis.csv`. On successful validation, commit only `data/stats.json` and push to this repository. Authenticate through GitHub Desktop or a locally managed Git credential; never put tokens in website files. The existing desktop app is not modified by this project. Future integration can call this script as a subprocess and display validation/push status in its GUI. A failed update should leave the published dataset intact.

## Preview and Pages

Run `npm run preview`, then open http://127.0.0.1:4173. Run `npm test` for data and comparison checks. GitHub Pages is configured for **Deploy from a branch → main → / (root)**. Relative asset paths work under `/nascar-stats/`. No build step is needed. Google Fonts is optional; local font fallbacks work if unavailable.

## Data provenance

Initial snapshot: the user's latest Stats Manager v0.5 `v_analysis.csv` export, generated October 6, 2026. The export includes DriverAverages source URLs. The website displays that local snapshot and does not scrape sources or claim results are live. Independent fan project, not affiliated with NASCAR.
