/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_ORS_API_KEY: string;
  readonly VITE_SWIFTLY_API_KEY: string;
  readonly VITE_SWIFTLY_TRIP_UPDATES_URL: string;
  readonly VITE_SWIFTLY_VEHICLE_POSITIONS_URL: string;
  readonly VITE_METROLINK_API_KEY: string;
  readonly VITE_METROLINK_VEHICLE_POSITIONS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
