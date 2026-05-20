---
name: vr-002-overlay-architecture-plan
---

## decision

Centralize map overlay registration around Google Maps overlay instances. Keep Google Maps as the base renderer, keep first-party transit as the current layer, and add scenario proposal groups as Google Maps polylines and markers managed by a shared registry.

## scope

Add overlay definitions, visibility state, renderer lifecycle, sample proposal overlays, focused tests, and architecture notes. Do not replace the current GoogleMap surface, routing services, or proposal data schema.

## contracts

Each overlay declares id, label, scenario kind, deterministic render order, default visibility, and a Google Maps factory that returns setVisible and dispose lifecycle hooks.

## performance

Initial proposal overlays are small local examples. Large LA-wide geometry sets should be chunked by layer group, simplified before rendering, gated by min and max zoom, and moved to Data layer or viewport-aware loading before adding thousands of polylines or station markers.
