# GTFS Ingestion

VR-503 keeps static GTFS data as app-owned schedule/source data while preserving Google Maps as the default map rendering and live routing surface. The GTFS modules parse LA Metro feeds for stops, routes, trips, stop times, service calendars, and calendar exceptions so schedule tools and export pipelines can query official service data without replacing Google Maps routing.

## Current Feed Scope

Start with LA Metro:

- Metro Rail static GTFS: `https://gitlab.com/LACMTA/gtfs_rail/-/raw/master/gtfs_rail.zip`
- Metro Bus static GTFS: `https://gitlab.com/LACMTA/gtfs_bus/-/raw/master/gtfs_bus.zip`

`src/gtfs/gtfs_loader.js` also lists Metrolink as a later extension point, but `initGTFS()` currently refreshes `metro_rail` by default. Metrolink and Amtrak should use the same parser boundary when they are promoted into active imports.

Do not commit full GTFS zip files. Tests should use fixture-sized table strings or small generated zips.

## Parser Boundary

The testable parser API is:

- `parseGTFSFeedFiles(files, { sourceName })`: accepts an object or `Map` keyed by GTFS filename and returns parsed `routes`, `stops`, `trips`, `stopTimes`, `calendar`, `calendarDates`, and optional `feedInfo`.
- `parseGTFSZip(blob, { sourceName })`: extracts the same required files from a zip and delegates to `parseGTFSFeedFiles`.
- `summarizeGTFSFeed(gtfsData)`: returns feed date bounds and table counts for metadata.

Required files:

- `routes.txt`
- `stops.txt`
- `trips.txt`
- `stop_times.txt`
- `calendar.txt`
- `calendar_dates.txt`

The parser validates required columns, required values, GTFS dates, GTFS times, stop coordinates, service day flags, calendar exception types, and cross-file references from trips to routes/services and stop times to trips/stops. Errors use `GTFSParseError` and include the source name, GTFS file, row number when available, and field name when relevant.

## Store And Query APIs

`storeGTFSData(feedId, agency, gtfsData)` persists parsed feeds into IndexedDB stores for:

- `stops`
- `routes`
- `trips`
- grouped stop/service departures in `stop_times`
- trip stop sequences in `trip_stop_times`
- `calendar`
- `calendar_dates`
- `metadata`

App and export consumers can use:

- `getStops(feedId)`
- `getRoutes(feedId)`
- `getTrips(feedId)`
- `getTripsForRoute(feedId, routeId)`
- `getTripStopTimes(feedId, tripId)`
- `getAllTripStopTimes(feedId)`
- `getGTFSFeedSnapshot(feedId)`

Time-based schedule lookup stays in `src/gtfs/gtfs_query.js`, which uses the stored calendars and stop/service departure groups. `src/gtfs/stop_mapping.js` bridges VeloRail station names to LA Metro GTFS stop IDs, with dynamic lookup from loaded stops as a fallback.

## Refresh Process

For browser development, `initGTFS()` fetches the configured feed URL, parses it with `parseGTFSZip`, stores the result, and writes metadata. The current cache TTL is:

- Metro Rail: 24 hours
- Metro Bus: 7 days
- Metrolink extension point: 7 days

For a production refresh job, use the same parser API but fetch feeds server side or in a build/export step:

1. Download the current LA Metro GTFS zip from the source URL.
2. Pass the zip blob/buffer through `parseGTFSZip`.
3. Check the returned summary counts and feed date bounds.
4. Persist through `storeGTFSData` or export the parsed structures for downstream tooling.
5. Run `npm run quality`.

Because GTFS ingestion is custom source data, every new provider should document feed URL, publisher, expected refresh cadence, active file set, and any agency-specific stop mapping notes before wiring it into the app.
