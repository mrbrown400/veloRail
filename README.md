# VeloRail

VeloRail is a Los Angeles car-free routing and transit planning app. It uses Google Maps for the base map, map gestures, places, directions, and overlay rendering, then layers VeloRail-owned future, visionary, freight, and conversion proposal data on top.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm `>=10`
- A `.env` file with `VITE_GOOGLE_MAPS_API_KEY`

Copy `.env.example` to `.env` and fill in the keys you have. Google Maps is required for the main app. The optional keys improve real-time and bike routing behavior.

## Run Locally

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build and run the production preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Open:

```text
http://127.0.0.1:4173/
```

## Test

Run the standard quality gate:

```bash
npm run quality
```

This runs Node tests, style linting, TypeScript checks, and the production build.

Run browser smoke tests:

```bash
npm run test:browser
```

Run the browser smoke tests in a visible Chrome window:

```bash
npm run test:browser:headed
```

The browser tests build the app, start a preview server on `127.0.0.1:4174`, and check user-facing flows such as route-search feedback and bike-settings popover visibility. Install the Playwright browser once if your machine has not already done so:

```bash
npx playwright install chromium
```

To test against an already-running app, pass a URL:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:browser
```

## Current User Flow

1. Open the app.
2. Click the location/status row to expand the route card if only the destination field is visible.
3. Enter a start and destination. Selecting suggestions is best, but typed locations are geocoded when you press Find Route.
4. Press Find Route.
5. Use the layer chips on the map to toggle current transit, future projects, visionary concepts, nationalized rail, and bicycling overlays.
