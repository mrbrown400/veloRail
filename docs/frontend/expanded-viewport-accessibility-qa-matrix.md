# Expanded Viewport And Accessibility QA Matrix

Issue: MBR-93
Branch: `khbrown400/mbr-93-add-expanded-viewport-and-accessibility-qa-matrix`
Scope: QA matrix and deterministic browser coverage for expanded viewport and accessibility checks. This does not change the Google Maps runtime, map provider, route algorithms, or launch-readiness gate for MBR-64.

## Decision Summary

MBR-93 is a follow-up QA surface, not a launch blocker for MBR-64. The current required browser suite remains Chromium-only through `playwright.config.ts`; WebKit is not added as a required CI project here because the repo currently has one Chromium project and no owner-supported WebKit gate.

The durable split is:

- Automated: deterministic Chromium Playwright checks for app-owned layout, focus, ARIA state, viewport bounds, and reduced-motion behavior where the DOM gives stable signals.
- Manual: screen-reader behavior, physical-device touch, true Google Maps attribution/native-control visual overlap, and map object hit testing where automation would depend on pixels, live map internals, or private Google DOM.
- Accepted follow-ups: WebKit, axe, physical-device signoff, and real map hit-testing can be scheduled separately if the owner wants them in a later release gate.

## Automated Coverage Added For MBR-93

Command:

```bash
npm run test:browser:required -- --grep @MBR-93
```

Tests:

| Test tag | Viewport | Surface | Automated assertion | Limit |
| --- | --- | --- | --- | --- |
| `@MBR-93` | 1440 by 900 | Search, layer panel, metadata panel, map safe areas | App-owned panels are visible, stay inside the viewport, do not collide with the search panel, and leave conservative right/bottom safe edges for Google controls and attribution. | Does not inspect private Google DOM or prove pixel-perfect attribution clearance. |
| `@MBR-93` | 768 by 900 | Transition from desktop panels to compact search repair, layer trigger, and bottom sheet | Destination-only submit expands origin repair, search and route action remain in viewport, layer trigger exposes `aria-expanded`, layer sheet opens with heading focus, and focus returns on close. | Does not simulate a physical tablet browser chrome or touch gestures. |
| `@MBR-93` | 768 by 900 | Reduced motion | With `prefers-reduced-motion: reduce`, the app-owned layer transition is reduced while the sheet remains usable. | Does not validate OS-level vestibular settings outside Playwright media emulation. |

Existing coverage that remains relevant:

| Existing tag | Coverage already present |
| --- | --- |
| `@VR-306`, `@VR-308` | 390 by 844 mobile metadata and overlay panel viewport bounds. |
| `@MBR-86`, `@VR-306`, `@VR-307` | 430 by 932 route sheet state switching, selected route persistence, close, and reopen behavior. |
| `@MBR-87` | Mobile layer trigger, sheet open/close, viewport bounds, and focus return at 390 by 844. |
| `@MBR-88` | Bike settings popover has named controls and Escape focus return. |
| `@VR-307` | Metadata Escape dismissal and keyboard metadata path focus return. |
| `@VR-303`, `@VR-104`, `@VR-305` | Layer grouping, legend, comparison mode sync, metadata provenance, and source-link visibility. |

## Viewport Matrix

| Viewport | Required surfaces | Automated status | Manual status | Pass condition |
| --- | --- | --- | --- | --- |
| 1440 by 900 desktop | Map, search, route results when available, layer panel, metadata panel, native Google controls, attribution | New `@MBR-93` app-owned panel and safe-edge check. Existing route-result tests cover result panel behavior when routes render. | Browser screenshot review should confirm Google zoom controls and attribution remain visible with route results plus layer or metadata open. | No incoherent overlap, clipped primary actions, hidden Google attribution, or hidden native controls. |
| 768 px width transition | Search panel, compact Layers trigger, layer sheet, route sheet transition behavior | New `@MBR-93` transition check. Existing mobile layer and route-sheet tests cover narrower states. | Manual Browser review should verify touch-sized controls and that the visual transition from side panel to bottom surface feels coherent. | Layer panel moves behind compact trigger, opens as a bottom sheet, stays in viewport, and restores focus. |
| 430 by 932 mobile | Search, route results, route detail, layer trigger, metadata, bike settings | Existing `@MBR-86` route sheet coverage. | Manual phone-size review for keyboard-safe search, touch comfort, and route detail scroll. | One bottom surface is active at a time, route context is recoverable, and actions are reachable. |
| 390 by 844 mobile | Narrow phone overlap, metadata, layer sheet, search repair, route action, attribution safety | Existing `@VR-306`, `@VR-308`, and mobile route-search assertions. | Manual phone-size review for Google attribution/native controls and visual keyboard behavior. | Primary controls stay in viewport, metadata and layers do not clip, and attribution remains visible. |

## Surface Matrix

| Surface | Automated checks | Manual checks | Notes |
| --- | --- | --- | --- |
| Route search | Existing combobox, field repair, route feedback, and mobile action bounds tests. | Screen reader announces labels, field errors, resolving status, degraded fallback, and route calculation status in a useful order. | Manual screen-reader order matters more than static DOM presence. |
| Route results | Existing route option selected state, detail state, close/reopen, and 430 by 932 sheet checks. | Keyboard-only route review, screen-reader route-card naming, and touch scroll on a physical phone. | Automation uses available route data and should not invent unsupported fare, platform, alert, or live-arrival facts. |
| Layer controls | Existing grouping, active counts, legend, comparison sync, mobile sheet, and new 768 transition checks. | Screen-reader pass for pressed state, legend expanded state, and long labels/descriptions. | Google Maps remains the base renderer; VeloRail owns only overlay controls and metadata. |
| Metadata | Existing synthetic metadata event checks for provenance, source links, Escape dismissal, focus return, and mobile bounds. | Screen-reader pass for heading, source boundary, details list, disclaimer, source links, and close behavior. | Real polyline clickability remains manual because it depends on live Google map object hit testing. |
| Search bike settings | Existing named-control, Escape, and popover bounds tests. | Touch target and screen-reader review for slider/value changes on a real device. | No new bike routing behavior is introduced by MBR-93. |
| Google native controls and attribution | New app-owned safe-edge assertions avoid obvious control lanes. | Manual visual check must confirm actual zoom control and attribution are visible because their DOM and layout are Google-owned. | Do not restyle, hide, remove, or assert private implementation details of Google attribution. |
| Keyboard and focus | Existing focus checks for origin repair, bike settings, layers, metadata, route details, and route reopen. | Full keyboard pass through search, route results, layer controls, metadata, source links, Escape priority, and focus return. | Trap focus only for modal surfaces; persistent map panels should preserve access. |
| Reduced motion | New Playwright media-emulation check for app-owned layer transition. | Manual OS/browser reduced-motion review if a release requires visual signoff. | Current CSS reduces transitions globally under `prefers-reduced-motion: reduce`. |

## Screen-Reader Matrix

These checks are manual for MBR-93 because useful screen-reader QA depends on announcement timing, reading order, virtual cursor behavior, and browser/OS combinations that Playwright role assertions cannot prove.

| Flow | Manual check | Expected result |
| --- | --- | --- |
| Collapsed destination submit with missing origin | Navigate to destination, submit, and listen after origin repair opens. | Origin field is identified, field error is announced, and destination context remains understandable. |
| Autocomplete | Type a query, move through suggestions, Escape, and Tab away. | Combobox/listbox state, active option, loading/error/no-result state, and dismissal are announced without trapping focus. |
| Route results | Calculate a route, move through route options, open itinerary, close, and reopen. | Selected state and route detail context are clear, and focus returns to the reopen affordance after close. |
| Layers and legend | Open layers at mobile and desktop widths, toggle overlays, open legend, close layers. | Pressed states, expanded state, group labels, active counts, and focus return are announced. |
| Metadata | Open metadata from the keyboard-accessible feature list, review details and sources, close with Escape. | Heading, source boundary, disclaimer, details, links, and close instructions are discoverable. |
| Bike settings | Open settings, adjust speed/weight controls, close with Escape. | Control names, values, and focus return are clear. |

## Physical-Device And Touch Matrix

These checks stay manual unless a later issue introduces a supported device-lab or remote-browser gate.

| Device class | Required checks | Expected result |
| --- | --- | --- |
| Small phone near 390 by 844 | Search repair, autocomplete, route sheet half/full, layers, metadata, and bike settings. | Primary actions are reachable, touch targets feel at least 48 by 48 CSS pixels, and visual keyboard does not hide required recovery actions. |
| Large phone near 430 by 932 | Route option review, itinerary scroll, close/reopen, metadata source links. | Sheet transitions preserve route context and do not obscure Google attribution or required controls. |
| Tablet/compact width near 768 px | Layers trigger, bottom sheet, search card, route results, metadata. | The app has clearly transitioned from desktop side-panel behavior to compact/bottom-surface behavior. |

## Axe Decision

MBR-93 does not add `@axe-core/playwright`.

Rationale:

- The repo does not currently include axe, and adding a new devDependency would expand the verification surface beyond the smallest required QA artifact.
- Google Maps injects internal DOM that can create scanner noise outside VeloRail ownership.
- The highest-value accessibility gaps for this issue are screen-reader announcement order, focus restoration, touch behavior, and Google controls/attribution coexistence, which require manual or targeted layout checks.

If axe is adopted later, keep it targeted to stable app-owned roots such as route search, route results, layer panel, metadata panel, and bike settings after Maps loads. Do not treat Google Maps internal DOM findings as VeloRail-owned failures unless an app-owned wrapper causes the issue.

## Accepted Follow-Ups

| Follow-up | Why it remains separate |
| --- | --- |
| WebKit required browser project | Current Playwright config has only Chromium; adding required WebKit needs owner support for CI/runtime stability. |
| Axe automation | Needs dependency review and carefully scoped app-owned roots to avoid Google Maps scanner noise. |
| Physical-device pass | Requires real browser chrome, touch, keyboard, and assistive technology behavior that desktop Playwright does not prove. |
| Real Google polyline hit testing | Live map-object interaction is valuable but brittle for CI; the existing synthetic metadata event remains the deterministic regression seam. |
| Pixel-perfect Google attribution/native-control overlap | Should be confirmed by Browser screenshot or human visual review, not private Google DOM assertions. |
