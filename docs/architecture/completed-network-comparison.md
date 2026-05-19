# Completed Network Comparison

VR-104 adds a comparison state model for the map layer panel without changing routing. The comparison mode is UI state layered over the existing Google Maps overlay registry and `mapOverlayStore` visibility map.

## State Model

The comparison mode has two values:

| Mode | Future overlay state | Meaning |
| --- | --- | --- |
| `present-only` | `future-projects: false` | Current Google Maps transit context without the official Future Transit overlay. |
| `present-plus-future` | `future-projects: true` | Current Google Maps transit context plus official planned, funded, or under construction project overlays. |

`present-only` is the default because future layers must stay opt in. Setting the comparison mode updates only the `future-projects` overlay. Toggling `future-projects` directly also updates the comparison mode, so the mode display and existing Future Transit toggle cannot drift apart.

The current Google transit layer remains the native Google Maps `TransitLayer`. The comparison mode does not merge current, visionary, nationalized, or future scenario state.

## Legend Behavior

The layer panel shows the active comparison label next to the active overlay count. The legend repeats the selected mode and, when future context is enabled, shows this service caveat:

> Future service is official planned, funded, or under construction overlay context, not current Google Maps operational service.

Individual legend entries still come from the shared overlay style registry. Official future projects keep their own line colors, patterns, confidence text, and provenance metadata.

## Routing Limitation

VR-104 does not alter route calculation. Google Maps remains the current operational service baseline for routing, and app-owned Future Transit overlays are visual context only. Any future routing comparison that uses planned or hypothetical services must be handled by a separate routing issue with explicit caveats and tests.
