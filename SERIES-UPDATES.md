All five stats views and Dad's Corner support Cup, O'Reilly/Xfinity, and Trucks. Each series uses isolated results since 2022 and its own coverage date. XFINITY is the stable dataset code for the series now branded O'Reilly.

Refresh all three result datasets with Node 22 or newer:

    node scripts/export-series.mjs PATH_TO_v_analysis.csv

Review all generated data files and data/series-index.json before publishing. Missing races are not reconstructed. Never replace Cup stats.json with mixed-series rows. The index lets new season files be added without changing the UI loader.

Qualifying snapshots are data/qualifying.json (Cup), data/qualifying-xfinity.json, and data/qualifying-truck.json. Use the same verified raceDate, track, status, sourceUrl and rows schema for each. Empty snapshots show that results have not yet been published; no times are invented. The scheduled briefing checks qualifying for all three series within each race's two-day window.

Larcom League remains the supplied NASCAR Fantasy league. Weather and Football are shared sections rather than racing-series statistics.