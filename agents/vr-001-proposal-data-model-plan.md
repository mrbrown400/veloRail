---
name: vr-001-proposal-data-model-plan
---

## decision

Define a versioned app-owned transit proposal schema alongside existing operational TRANSIT_LINES data. Keep proposal geometry as GeoJSON LineString coordinates in [lon, lat] order and expose helper transforms to Google Maps LatLngLiteral paths and marker inputs.

## scope

Create proposal types, sample records, validation helpers, Google Maps adapter helpers, and schema documentation. Do not migrate existing operational routing data in VR-001.
