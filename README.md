# NASCAR Stats — Race notebook

## Family sections

**Fantasy League:** Larcom League standings are a dated snapshot of the seven visible teams, with a direct link to the live league. The reload button refreshes published site data. Import a CSV containing `name,points,lastRacePoints` with `node scripts/import-fantasy.mjs standings.csv`, then publish `data/family.json`. No authenticated fantasy API integration is claimed; never commit session cookies or credentials.

**Dad’s Corner:** Ryan Blaney, Denny Hamlin, Joey Logano, Chase Briscoe, and Todd Gilliland have season-to-date summaries and next-track history computed from the existing export. The race date and exact track layout define the briefing. The export cutoff is always visible. Edit favorites, title, and plain-text note in `data/family.json`; publish it to update his page. This is a public personalized tab.

**Schedule:** `data/schedule.json` holds the 2026 Cup points-race dates from the local export, plus the remaining six races and start times/TV from NASCAR’s official February 10 schedule PDF, checked October 6, 2026. Historical start times are not yet populated. Exhibition events are not included. Update this file when NASCAR changes the schedule; times are Eastern Time and the official schedule link is always available.

**Weather:** opens automatically for ZIP 62221, using an approximate Belleville-area location (38.51, -89.90). Visitors can search other cities. Current conditions, seven-day daily outlook, and hourly day selectors include temperature, feels-like, humidity, precipitation, wind/gusts and direction. Historical reanalysis from Open-Meteo has daily and hourly tables and a 31-day maximum range, from 1940 through one week ago; it is clearly labeled as model estimates incorporating observations, not direct station measurements. Each request sends coordinates to Open-Meteo; city searches send the entered search text. No key or GPS permission is used. Review Open-Meteo licensing if monetizing.

Static, public NASCAR Cup Series explorer using the cleaned Stats Manager `v_analysis` export. No server, account, or database is required by visitors. Driver Lookup, Track Lookup, shared-race Head-to-Head, sortable leaderboards, season/track/type filters, and recent race finishing orders are included. Coverage is shown from the dataset, not inferred from today's date. Missing ratings are excluded from averages. Comparisons use only shared race starts.

## Qualifying updates

`data/qualifying.json` is race-scoped. Match `raceDate` and `track` to the schedule; include `updatedAt`, `status`, `sourceUrl`, and `rows` with `start,qualifyingPosition,car,driver,lapSeconds,speedMph`. Unknown lap times/speeds are null. Publish the complete verified field, distinguishing qualifying position from the starting grid and recording any penalties. The UI refuses a grid for a different date/layout. Never substitute qualifying order for results.

A Codex heartbeat named “Dad’s weekly NASCAR briefing” checks every six hours near race weekends, verifies official sources, and publishes verified qualifying snapshots and post-race fantasy standings. This runs locally through Codex and requires the app/host and connected account access to be available. It is not a GitHub-hosted live feed. Future runs cannot be guaranteed if the host is off or a source/login is unavailable. Normal website weather works independently in each visitor’s browser.

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

## Display time zone

All website times use US Central (America/Chicago), with daylight saving applied. NASCAR source schedule and qualifying strings may remain ET in data; the display converts them to CT. Weather queries explicitly request America/Chicago for hourly, daily, sunrise/sunset and archive dates, including searches for other locations. Update timestamps with a time are formatted in Central. Date-only update stamps remain dates.
