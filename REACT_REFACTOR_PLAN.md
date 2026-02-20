# Plan: Frontend Framework Refactor - React + React Native

## Goal
Refactor VeloRail from vanilla JavaScript to React (web) with future React Native (mobile) support, styled to match Google Maps as closely as possible.

## Decisions Made
- **Framework**: React + React Native (Expo for mobile later)
- **Priority**: Web first, mobile later
- **Backend**: Keep routing algorithm client-side for now
- **Styling**: Match Google Maps UI/UX patterns

---

## Current State Analysis

**Codebase Size**: ~5,500 lines across 30+ modules

**Key Files to Refactor**:
| File | LOC | Complexity | Refactor Target |
|------|-----|------------|-----------------|
| `ui.js` | 849 | Very High | 15-20 React components |
| `routing.js` | 793 | Very High | Custom hook + service layer |
| `google_map.js` | 515 | High | React component wrapper |
| `geocoding.js` | 466 | Medium | Autocomplete component |
| `transit_data.js` | 940 | Low | Static data module (keep as-is) |
| `realtime/realtime_store.js` | ~80 | High | Zustand store |

---

## Target Architecture

```
src/
├── components/           # React UI components
│   ├── Map/
│   │   ├── MapContainer.tsx
│   │   ├── RouteOverlay.tsx
│   │   └── VehicleMarker.tsx
│   ├── Search/
│   │   ├── SearchCard.tsx
│   │   ├── PlaceAutocomplete.tsx
│   │   └── LocationStatus.tsx
│   ├── Results/
│   │   ├── ResultsSidebar.tsx
│   │   ├── RouteOption.tsx
│   │   └── RouteDetails.tsx
│   └── common/
│       ├── TimeSelector.tsx
│       ├── ModeSelect.tsx
│       └── Button.tsx
├── hooks/                # Custom React hooks
│   ├── useRouting.ts
│   ├── useGeolocation.ts
│   ├── useVehicleTracking.ts
│   └── useAutocomplete.ts
├── stores/               # Zustand state management
│   ├── routeStore.ts
│   ├── uiStore.ts
│   └── realtimeStore.ts
├── services/             # API layer (mostly existing code)
│   ├── routing.ts        # Extract from routing.js
│   ├── googleMaps.ts     # Extract from google_map.js
│   ├── geocoding.ts      # Extract from geocoding.js
│   └── directions.ts     # From google_directions.js
├── data/                 # Static data
│   ├── transitLines.ts
│   └── stations.ts
├── types/                # TypeScript definitions
│   └── index.ts
├── styles/               # CSS/styled-components
│   └── google-maps-theme.css
├── App.tsx
└── main.tsx
```

---

## Phase 1: Project Setup (Day 1-2)

### 1.1 Initialize React + TypeScript + Vite

```bash
npm create vite@latest velorail-react -- --template react-ts
```

### 1.2 Install Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@react-google-maps/api": "^2.20.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/google.maps": "^3.58.0"
  }
}
```

### 1.3 Project Structure
- Create folder structure as shown above
- Set up TypeScript configuration
- Configure Vite for environment variables

**Files to create**:
- `src/App.tsx`
- `src/main.tsx`
- `tsconfig.json` (update)
- `vite.config.ts` (update)

---

## Phase 2: State Management + Services (Day 3-5)

### 2.1 Create Zustand Stores

**Route Store** (`src/stores/routeStore.ts`):
```typescript
interface RouteState {
  routes: Route[];
  selectedRoute: Route | null;
  isLoading: boolean;
  error: string | null;
  searchParams: {
    start: Location | null;
    end: Location | null;
    mode: 'all' | 'bike' | 'walk' | 'driving';
    safety: 'balanced' | 'safe' | 'fast';
    departureTime: Date;
  };
  setRoutes: (routes: Route[]) => void;
  selectRoute: (route: Route) => void;
  setSearchParams: (params: Partial<SearchParams>) => void;
}
```

**UI Store** (`src/stores/uiStore.ts`):
```typescript
interface UIState {
  searchMode: 'collapsed' | 'expanded';
  sidebarOpen: boolean;
  isUsingGeolocation: boolean;
  currentLocation: Location | null;
}
```

**Realtime Store** (`src/stores/realtimeStore.ts`):
- Migrate existing `realtime_store.js` logic
- Add vehicle position subscriptions

### 2.2 Extract Service Layer

Move business logic from vanilla JS to service modules:

| From | To | Changes |
|------|-----|---------|
| `routing.js` | `services/routing.ts` | Add TypeScript, remove DOM deps |
| `google_map.js` | `services/googleMaps.ts` | Keep map utilities, remove DOM |
| `geocoding.js` | `services/geocoding.ts` | Add TypeScript |
| `google_directions.js` | `services/directions.ts` | Add TypeScript |

**Key**: Services should be pure functions with no React/DOM dependencies.

---

## Phase 3: Core Components (Day 6-12)

### 3.1 Map Components

**MapContainer.tsx**:
```typescript
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

const MapContainer: React.FC = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  if (!isLoaded) return <MapSkeleton />;

  return (
    <GoogleMap
      mapContainerClassName="map-fullscreen"
      center={LA_CENTER}
      zoom={11}
      options={darkMapOptions}
    >
      <RouteOverlay />
      <VehicleMarker />
    </GoogleMap>
  );
};
```

**RouteOverlay.tsx**:
- Polylines for route legs
- Station markers
- Start/end markers

**VehicleMarker.tsx**:
- Animated vehicle position
- Real-time tracking subscription

### 3.2 Search Components

**SearchCard.tsx** - Main search container with two states:
- Collapsed: Destination only + location status
- Expanded: Start + destination + options

**PlaceAutocomplete.tsx**:
- Google Places integration
- Debounced search
- Keyboard navigation

**LocationStatus.tsx**:
- Geolocation state display
- Click to expand search

### 3.3 Results Components

**ResultsSidebar.tsx**:
- Slide-in panel animation
- Route options list
- Selected route details

**RouteOption.tsx**:
- Single route card
- Duration, mode icons
- Future route styling

**RouteDetails.tsx**:
- Leg-by-leg breakdown
- Wait times, transfers
- Safety indicators

---

## Phase 4: Google Maps Styling (Day 13-15)

### 4.1 Match Google Maps UI Patterns

**Search Card (Google Maps style)**:
```css
.search-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  font-family: Roboto, Arial, sans-serif;
  /* Google uses white cards, not dark */
}

.search-input {
  border: none;
  padding: 12px 16px;
  font-size: 16px;
  width: 100%;
}

.search-input:focus {
  outline: none;
}
```

**Route Cards (Google Maps style)**:
```css
.route-option {
  padding: 16px;
  border-bottom: 1px solid #e8eaed;
  cursor: pointer;
}

.route-option:hover {
  background: #f8f9fa;
}

.route-option.selected {
  background: #e8f0fe;
  border-left: 4px solid #1a73e8;
}

.route-duration {
  font-size: 18px;
  font-weight: 500;
  color: #202124;
}

.route-mode {
  color: #5f6368;
  font-size: 14px;
}
```

**Color Palette (Google Maps)**:
```css
:root {
  --gm-blue: #1a73e8;
  --gm-green: #188038;
  --gm-red: #d93025;
  --gm-yellow: #f9ab00;
  --gm-text: #202124;
  --gm-secondary: #5f6368;
  --gm-border: #dadce0;
  --gm-background: #ffffff;
  --gm-hover: #f8f9fa;
  --gm-selected: #e8f0fe;
}
```

### 4.2 Typography (Google Maps uses Roboto)

```css
body {
  font-family: 'Roboto', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.heading-large { font-size: 22px; font-weight: 400; }
.heading-medium { font-size: 18px; font-weight: 500; }
.body-text { font-size: 14px; font-weight: 400; }
.caption { font-size: 12px; color: #5f6368; }
```

### 4.3 Component Styling Patterns

**Directions Panel** (like Google Maps):
- White background
- Fixed width: 408px
- Full height
- Shadow: `0 1px 3px rgba(60,64,67,.3)`

**Mode Icons** (Google style):
- Walking: `#5f6368`
- Transit: Line color
- Cycling: `#188038`
- Driving: `#1a73e8`

---

## Phase 5: Custom Hooks (Day 16-18)

### 5.1 useRouting Hook

```typescript
const useRouting = () => {
  const { searchParams, setRoutes, setLoading } = useRouteStore();

  const calculateRoutes = async () => {
    setLoading(true);
    try {
      const routes = await compareRoutes(
        searchParams.start,
        searchParams.end,
        searchParams.safety,
        searchParams.mode,
        searchParams.departureTime
      );
      setRoutes(routes);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return { calculateRoutes };
};
```

### 5.2 useGeolocation Hook

```typescript
const useGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  useEffect(() => {
    requestGeolocation()
      .then(loc => { setLocation(loc); setStatus('granted'); })
      .catch(() => setStatus('denied'));
  }, []);

  return { location, status, refresh: requestGeolocation };
};
```

### 5.3 useVehicleTracking Hook

```typescript
const useVehicleTracking = (transitLeg: TransitLeg | null) => {
  const [position, setPosition] = useState<VehiclePosition | null>(null);

  useEffect(() => {
    if (!transitLeg) return;

    const unsubscribe = subscribeToVehicle(transitLeg, setPosition);
    return () => unsubscribe();
  }, [transitLeg]);

  return position;
};
```

---

## Phase 6: Integration & Testing (Day 19-21)

### 6.1 Wire Up Components

- Connect stores to components
- Integrate Google Maps
- Add route drawing
- Enable vehicle tracking

### 6.2 Migration Verification

- [ ] Map loads with Google dark theme
- [ ] Search autocomplete works
- [ ] Route calculation returns results
- [ ] Routes draw correctly on map
- [ ] Sidebar shows route options
- [ ] Route selection updates map
- [ ] Vehicle tracking updates in real-time
- [ ] Geolocation works
- [ ] Time selector functions

### 6.3 Performance Optimization

- Memoize route polylines
- Lazy load sidebar content
- Debounce search inputs
- Optimize re-renders with React.memo

---

## File Change Summary

| Action | Files |
|--------|-------|
| **CREATE** | All files in new `src/` structure (~40 files) |
| **MIGRATE** | `routing.js` → `services/routing.ts` |
| **MIGRATE** | `geocoding.js` → `services/geocoding.ts` |
| **MIGRATE** | `google_map.js` → `services/googleMaps.ts` + `components/Map/` |
| **MIGRATE** | `ui.js` → Multiple React components |
| **MIGRATE** | `realtime/` → `stores/realtimeStore.ts` |
| **KEEP** | `transit_data.js`, `stations.js`, `schedule.js` (as data modules) |
| **DELETE** | `ui.js`, old `index.html` structure |

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@react-google-maps/api": "^2.20.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@googlemaps/js-api-loader": "^2.0.2",
    "gtfs-rt-bindings": "^4.9.0",
    "idb": "^8.0.3",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/google.maps": "^3.58.0",
    "typescript": "^5.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^7.2.0"
  }
}
```

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Setup | 2 days | React + TypeScript project skeleton |
| 2. State + Services | 3 days | Zustand stores, service layer |
| 3. Core Components | 7 days | All UI components |
| 4. Google Maps Styling | 3 days | Pixel-perfect Google Maps look |
| 5. Custom Hooks | 3 days | Routing, geolocation, vehicle tracking |
| 6. Integration | 3 days | Full working app, testing |

**Total: ~21 days (3 weeks)**

---

## Future: React Native (Phase 2)

After web refactor is complete:

1. **Expo Setup**: Initialize Expo project with shared packages
2. **Shared Logic**: Move stores and services to shared package
3. **Native Components**: Build React Native versions of UI components
4. **Native Maps**: Use `react-native-maps` for Google Maps
5. **Platform Testing**: iOS + Android testing

Estimated additional time: **4-5 weeks**

---

## Verification Checklist

After implementation:

1. **Visual Match**: Compare screenshots to Google Maps
2. **Functionality**: All existing features work
3. **Performance**: No regressions in route calculation time
4. **Real-time**: Vehicle tracking updates smoothly
5. **Mobile-ready**: Responsive design works on smaller screens
6. **Code Quality**: TypeScript types, no `any` usage
7. **Bundle Size**: Similar or smaller than current build
