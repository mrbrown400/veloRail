# MBR-104 LADOT Commuter Express source audit

Review date: 2026-06-06

## Decision

Use a bounded static first pass for LADOT Commuter Express re-integration, then keep GTFS import and realtime/shape work in follow-up scope.

The first active-app implementation should migrate only the LADOT Commuter Express route shells already represented in the legacy dataset when they can be matched to LADOT's current Commuter Express route list. Treat the legacy `src/transit_data.js` records as seed data for route identity, coarse corridor endpoints, and a provisional service-window model, not as authoritative stop-by-stop schedules or shapes.

## Sources checked

- Legacy VeloRail data: `src/transit_data.js`, Commuter Express block beginning at `LADOT CE 142` and ending before `Union/Bunker Shuttle`.
- Active VeloRail data model: `src/data/transitLines.ts`, which currently contains Metro rail/light-rail lines only and no LADOT Commuter Express records.
- LADOT Transit website (`https://www.ladottransit.com/`), checked 2026-06-06: the global navigation and Commuter Express page list current Commuter Express routes 142, 409, 419, 422, 423, 431, 437, 438, 439, 448, 534, 549, 573, and 574, plus a separate Union Station/Bunker Hill Shuttle entry.
- LADOT Transit Commuter Express overview (`https://www.ladottransit.com/commuterexpress/`), checked 2026-06-06: describes Commuter Express as limited-stop service, links users to Google's trip planner, lists travel-time summaries for the current route set, notes route 142 holiday operation, and documents fare zones for the same route set.
- LADOT GTFS feed metadata (`https://mobilitydatabase.org/feeds/gtfs/mdb-1210`), checked 2026-06-06 through MobilityDatabase: feed `mdb-1210` is marked official, producer URL is `https://ladotbus.com/gtfs`, route count is 66 bus routes, quality report was updated 2026-05-17, official verification was updated 2025-04-30, and the published service date range is 2025-12-20 through 2027-02-28. Direct command-line fetch from this environment returned HTTP 403 from the proxy, so this audit uses the catalog metadata and LADOT website, not a parsed local GTFS snapshot.

## Legacy inventory

| Legacy key | Legacy route type | Legacy coarse corridor | Legacy service model | Source confidence for first-pass inclusion | First-pass disposition |
| --- | --- | --- | --- | --- | --- |
| `LADOT CE 142` | `commuter_express` | San Pedro Ports O'Call to Long Beach Transit Gallery | Daily all-day window; 30-minute peak/off-peak frequency | High for route identity; medium for endpoint names and hours | Include. This is on LADOT's current route list and is the only CE route with explicit daily/holiday-style behavior in the legacy model. Re-check exact schedule before exposing detailed departure promises. |
| `LADOT CE 409` | `commuter_express` | Glendale College to Union Station | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes AM travel to East Glendale/Downtown and PM travel toward Glendale/Montrose/Tujunga/Sunland/Lake View Terrace/Sylmar, so legacy endpoints are too narrow and should be broadened in display copy or verified from route page/GTFS before detailed stop logic. |
| `LADOT CE 419` | `commuter_express` | Chatsworth Station to Union Station | Weekday AM/PM peak only; 30-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list and overview describe Chatsworth-to-Downtown service. |
| `LADOT CE 422` | `commuter_express` | Thousand Oaks / Warner Center / Universal City to 7th St/Metro Center | Weekday AM/PM peak only; 30-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes Hollywood, San Fernando Valley, Agoura Hills, Thousand Oaks, and Downtown directionality, so first-pass data should avoid overclaiming a single bidirectional stop pattern. |
| `LADOT CE 423` | `commuter_express` | Thousand Oaks / Encino Park & Ride / USC / Union Station | Weekday AM/PM peak only; 30-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes Downtown/USC and Encino/Calabasas/Agoura Hills/Thousand Oaks. |
| `LADOT CE 431` | `commuter_express` | Westwood to Union Station | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT overview lists Westwood/Palms to the Financial District. |
| `LADOT CE 437` | `commuter_express` | Venice / Culver City to 7th St/Metro Center | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes Culver City/Marina del Rey/Venice and Downtown. |
| `LADOT CE 438` | `commuter_express` | Redondo Beach / Harbor Gateway to Union Station | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT overview lists Redondo Beach/Hermosa Beach/Manhattan Beach/El Segundo to the Financial District. |
| `LADOT CE 439` | `commuter_express` | El Segundo / Douglas Station to Union Station | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes AM to El Segundo and PM to Downtown, so this route has reverse-commute directionality that follow-up routing must model explicitly. |
| `LADOT CE 448` | `commuter_express` | Rancho Palos Verdes to Union Station | Weekday AM/PM peak only; 30-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT overview lists Rancho Palos Verdes/Rolling Hills Estates/Harbor City to the Financial District. |
| `LADOT CE 534` | `commuter_express` | West LA / Sepulveda-National to Union Station | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT overview lists Downtown LA, Century City, Westwood, and Union Station travel pairs. |
| `LADOT CE 549` | `commuter_express` | Pasadena / Glendale / Encino | Weekday AM/PM peak only; 30-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes Burbank/Glendale/Pasadena to/from Glendale/Burbank/Encino. |
| `LADOT CE 573` | `commuter_express` | Encino Park & Ride to Century City | Weekday AM/PM peak only; 20-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes Mission Hills/Encino to Westwood/Century City. Legacy omits Mission Hills and Westwood in its coarse stop list. |
| `LADOT CE 574` | `commuter_express` | Granada Hills / Encino Park & Ride / LAX City Bus Center | Weekday AM/PM peak only; 30-minute peak frequency | High for route identity; medium for endpoints; low/medium for exact peak windows | Include. Current LADOT list describes Sylmar/Granada Hills/Encino to LAX/El Segundo. Legacy omits Sylmar and El Segundo in its coarse stop list. |
| `Union/Bunker Shuttle` | `shuttle` | Union Station to Bunker Hill | Weekday window; 5-minute peak and 10-minute off-peak frequency | High for existence; not a Commuter Express route type in legacy | Exclude from MBR-103 first pass. It appears adjacent to the Commuter Express route list and fare table, but the legacy type is `shuttle` and MBR-104 is scoped to commuter express, not all LADOT services. Track separately if downtown shuttle routing becomes a product goal. |
| LAX FlyAway block after the CE/shuttle records | bus/airport service, not commuter express | Airport express service | Separate from LADOT CE | Out of scope | Exclude. Not part of LADOT Commuter Express re-integration. |

## First-pass route set

Ship these 14 route records in the active app once MBR-105/MBR-106 add the TypeScript data model fields needed for commuter-express operating windows:

- `LADOT CE 142`
- `LADOT CE 409`
- `LADOT CE 419`
- `LADOT CE 422`
- `LADOT CE 423`
- `LADOT CE 431`
- `LADOT CE 437`
- `LADOT CE 438`
- `LADOT CE 439`
- `LADOT CE 448`
- `LADOT CE 534`
- `LADOT CE 549`
- `LADOT CE 573`
- `LADOT CE 574`

Do not ship these in the commuter-express first pass:

- `Union/Bunker Shuttle`, because it is a shuttle record rather than `commuter_express` in legacy data and should not blur the commuter-express routing boundary.
- LAX FlyAway and any DASH, LA now, Metro Bus, municipal-bus, or airport-bus records, because MBR-103 explicitly asks to keep this scoped to LADOT Commuter Express.
- Any route variant, branch, exact stop pattern, GTFS `trip_id`, realtime vehicle feature, or precise headway not verified from LADOT route pages or a parsed GTFS snapshot.

## Migration boundary and provenance expectations

### Recommended implementation approach

Use a hybrid source posture with a static implementation:

1. **Static first pass now:** add a small TypeScript commuter-express dataset that contains route IDs, route family (`commuter_express`), high-level corridor labels, coarse endpoint/anchor coordinates, and provisional operating-window metadata. This is enough for time-aware inclusion/exclusion in active route comparisons without introducing GTFS ingestion risk into MBR-103.
2. **Source labels and confidence:** each route record should carry provenance notes or comments indicating `source: legacy seed + LADOT current route list`, `reviewed: 2026-06-06`, and confidence split between route identity and schedule/geometry detail.
3. **Do not overclaim precision:** route-result labels may say `LADOT Commuter Express 437 - weekday peak service` or similar, but should not imply exact departure times, live arrivals, branch selection, or stop-level paths unless that data is parsed from LADOT GTFS or route PDFs/pages.
4. **GTFS follow-up:** MBR-112 should evaluate importing LADOT's GTFS feed for exact stops, shapes, service calendars, exceptions, and route variants. The feed is discoverable and marked official in MobilityDatabase, but this audit did not parse it locally because direct fetches from this environment were blocked by HTTP 403.

### Known uncertainty

- The legacy AM/PM peak windows are plausible for commuter-express filtering, but this audit did not verify each route's exact trip times against route PDFs or GTFS. Use them as coarse gating only.
- Several legacy station arrays are incomplete relative to LADOT's current route descriptions: 409, 422, 573, and 574 in particular have broader named service areas on LADOT's site than the legacy stop anchors show.
- Route 439 is reverse-commute oriented in LADOT's route label (`A.M. to El Segundo`, `P.M. to Downtown`), so direction-aware filtering matters more than simply checking time-of-day.
- Route 142 behaves differently from most CE routes: LADOT notes holiday operation and the legacy data models it as daily all-day service. It should not be forced into the weekday peak-only schedule logic used by most other CE lines.
- The Union Station/Bunker Hill Shuttle is listed near Commuter Express on LADOT pages and fare material, but it should stay outside the first commuter-express route option unless a separate issue explicitly includes shuttles.

## Follow-up issue handoff

- **MBR-105** should extend `src/data/transitLines.ts` types or introduce a companion data module that can represent `commuter_express`, peak windows, day applicability, route direction notes, and source confidence without weakening existing rail data.
- **MBR-106** should migrate the 14 selected CE records only, preserve provenance fields/comments, and keep `Union/Bunker Shuttle` out of the commuter-express set.
- **MBR-107** should filter route options by weekday/weekend, AM/PM peak windows, and special handling for daily CE 142. It should also consider direction notes for routes like 439.
- **MBR-108/MBR-109** should label these as bus/commuter-express services and display uncertainty-safe copy such as `peak-period LADOT Commuter Express` rather than exact departures.
- **MBR-112** should parse or otherwise evaluate the LADOT GTFS feed before adding exact stops, shapes, service calendars, holiday exceptions, or realtime arrivals.
