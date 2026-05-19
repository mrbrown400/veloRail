# VR-306 / VR-307 / VR-308 Responsive, Accessibility, And Polish Pass

## Responsive Decisions

- Desktop keeps route results on the left, the layer panel on the lower right, and metadata on the upper right.
- Tablet and mobile keep the map primary by turning route results into a bottom sheet and moving metadata to a bottom panel.
- Mobile metadata hides the layer panel while open so controls do not stack over the same map area.
- Route fit bounds reserve desktop side-panel space and mobile bottom-sheet space so selected routes are not framed under app panels.

## Accessibility Fixes

- Route results, metadata panels, layer groups, and route search feedback now use stable labelled regions or descriptions.
- Overlay metadata can be dismissed with Escape as well as the close button.
- Critical custom controls have focus-visible rings and live feedback where state changes should be announced.
- Route search exposes busy state and ties feedback text to the form and submit button.

## Visual Changes

- Long route labels and descriptions wrap instead of pushing durations or buttons out of their containers.
- Results panel headers stay visible inside scrolling panels.
- A compact results reopen button appears when route options exist and the results panel is closed.
- Metadata headers are sticky inside the metadata panel, with source rows wrapping cleanly.
- Mobile spacing uses fixed responsive breakpoints rather than viewport-scaled type.

## Remaining Limits

Google Maps base-map gestures, native map-feature focus order, and native info-window focus remain controlled by the Maps runtime. VeloRail-owned panels now provide labelled metadata and keyboard dismissal, but deeper map-object keyboard traversal would need a separate Google Maps accessibility investigation.
