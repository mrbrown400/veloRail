# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build to /dist
npm run preview   # Preview production build
```

No test or lint commands are configured.

## Architecture

VeloRail is a multi-modal transit routing app for Los Angeles, built with vanilla JavaScript, Leaflet, and Vite. It compares bike+rail, walk+rail, bus+rail, and driving routes.

### Module Structure

- **main.js** - Entry point; initializes map and UI
- **map.js** - Leaflet map setup, route drawing, transit line rendering
- **ui.js** - DOM event handlers, route comparison UI, mode icons
- **routing.js** - Core routing engine; finds nearest stations, calculates multi-leg routes
- **transit_data.js** - LA Metro rail lines (10) and LADOT Commuter Express (16+) with station coordinates
- **osrm.js** - OSRM API wrapper for bike/walk/drive routing
- **geocoding.js** - Nominatim API wrapper (appends "Los Angeles County" to queries)
- **elevation.js** - Open-Meteo API for elevation-adjusted bike speeds
- **bike_network.js** - Overpass API query for bike infrastructure overlay

### Data Flow

```
User input → geocode() → compareRoutes() → [4 route calculations] → UI renders options → drawRoute()
```

### External APIs (all free, no keys required)

- **Nominatim** - Geocoding
- **OSRM** (public demo server) - Routing engine
- **Open-Meteo** - Elevation data
- **Overpass** - OSM bike paths
- **CartoDB** - Base map tiles

### Routing Algorithm Notes

- `calculateRoute()` in routing.js handles multi-modal logic
- Transfer hubs: Union Station, 7th St/Metro Center
- Speed assumptions: bike 20 km/h (elevation-adjusted), walk 5 km/h, bus 15 km/h, rail 35 km/h
- Direct route thresholds: bike < 5km, walk < 1.5km

### Styling

Dark theme using CSS variables in style.css. No CSS framework.
