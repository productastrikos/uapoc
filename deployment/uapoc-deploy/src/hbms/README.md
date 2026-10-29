# HBMS port

The HBMS building-management screens, ported from `D:\Work\poc\Long than\Long than`
into the TAMS/UPOC app. The rule for the port was: **HBMS logic and workflow,
UPOC look**.

## Where it lives

Terminal & Passenger → **Building Management**. It replaced the earlier
`src/bms/BmsScreen`, which is kept on disk but is no longer routed. The console
renders its own tab bar inline rather than through the shared `ConsoleTabs`,
because that portals into the header's single tab slot, which the Terminal
console it now sits inside already owns.

## What changed, and why

### Design tokens, not rewritten styles
The source screens are largely inline-styled against their own token set
(`--app-*`, `--ds-*`, `--kpi-*`). Rather than rewrite several thousand lines of
inline style, [hbms.css](hbms.css) redefines those tokens in TAMS colours and
scopes them to `.hbms-root`, which [HbmsConsole](HbmsConsole.tsx) mounts. The
layout and logic are byte-for-byte the source's; only what the tokens resolve to
changed. Hard-coded slate/blue/indigo values were remapped to the `sim` /
`simteal` ramps already used by `src/simulations` for exactly this purpose.

`IncidentManagement` was the one light-theme screen in the source; its ramp
indices are mirrored and its form controls given explicit dark surfaces.

### No react-router
The source addressed screens by route (`/sop`, `/work-orders?subsystem=pas`,
`/subsystem/5` with `location.state`). [store/useHbmsStore.ts](store/useHbmsStore.ts)
carries every one of those hand-offs instead, so the cross-screen workflows
behave as they did:

| Source                                                    | Here                                    |
| --------------------------------------------------------- | --------------------------------------- |
| `navigate('/work-orders?subsystem=…&alertId=…')`            | `openWorkOrders({ subsystem, alertId })` |
| `navigate('/sop')` from Alert Details                      | `go('sop')`                              |
| `navigate('/assets?subsystem=SCADA&type=…&issue=…')`        | `openAssets({ subsystem, type, issue })` |
| `navigate('/subsystem/5', { state: { lbmsFocus } })`        | `openSubsystem('lbms', focus)`           |

Deep-link payloads are read once and cleared, matching the one-shot discipline
`useNavStore` already uses for console sub-tabs.

### No Leaflet
Two map surfaces, neither of which needs a map library.

**The LBMS zone map** ([components/LBMSFloorMap.tsx](components/LBMSFloorMap.tsx))
is the source's map with the source's choreography: grid of six levels → open a
level → click a zone marker → the plan zooms in and hands over to a room detail
view → click an AHU pin → the restricted parameter faceplate, draggable, as many
open at once as you like. Zone 23 on 1F is the one flagged zone, with the pulsing
alert marker on the grid that opens 1F already zoomed onto it.

The source drove that zoom with react-leaflet (`CRS.Simple` + `flyTo`); here the
plan sits on a CSS-transformed stage, so `flyTo(target, zoom)` becomes a
transform to the same point with the source's easing and timings
(`ZONE_FLY_HANDOVER_MS`, `ZONE_IMG_EXIT_MS`) kept, plus wheel-zoom, drag-pan and
explicit zoom buttons (Leaflet supplied those for free).

### The plan is data, not a picture
The source shipped one `zone_map_all_floor.jpg` and reused it for all six
levels, plus one `1F_zone_23.png` reused for every zone — so nothing on screen
told an operator which room they were in. [terminalPlan.ts](terminalPlan.ts)
replaces both with a room schedule per level, taken from
`research documents/Bali Airport BMS Research.md`:

| Level | What it holds |
| ----- | ------------- |
| PIT   | BHS sorting + HBS, chiller plants CRB-1/2/3, Main Power House 1 (3,465 kVA), Substation T1 (AFL 94.33 kVA), UPS, generators, STP (150 m3/day), fire pumps, BMS data centre |
| GF    | Arrival concourses, 26-counter immigration, 20-counter visa-on-arrival, baggage reclaim, customs, ground transport |
| 1F    | 96-counter international and 62-counter domestic check-in, 4 transit counters, security screening, departure immigration |
| 2F    | 11 international + 8 domestic gate lounges, duty free, food court (KEF/MAU interlock), CIP lounge |
| 3F    | AOCC, security control (2,800 CCTV), BMS control, FM200-protected server room, lounges, administration |
| 4F    | AHU plant rooms, PAU/MAU, SPF/SEF/EAF/FAF/KEF/TEF fan rooms, cooling towers, 155 kWp solar PV |

Around the building: 8 + 11 aerobridge stands on the airside face, the apron and
taxiway, the kerb and solar-canopy car park, and both terminals captioned with
their real footprints (65,800 m2 / 120,000 m2).
[components/TerminalFloorPlan.tsx](components/TerminalFloorPlan.tsx) draws it as
SVG, so one source serves a 200px thumbnail and a full-screen plan, and every
room is hit-testable. Zone markers sit in the room they serve, and name it.

### Real imagery — the Plan / Real map toggle
The map view switches between that schematic and **real satellite imagery of
Ngurah Rai**, with the rooms drawn on top:
[components/TerminalGeoMap.tsx](components/TerminalGeoMap.tsx) over MapLibre GL
and Esri's keyless tiles. No API key, no billing; attribution is shown as the
licence requires. [geo.ts](geo.ts) projects the plan onto the ground —
`ANCHOR` / `BEARING_DEG` / `SPAN_M` are the entire calibration, and nudging
those three moves every room, stand and pin together. They are a close fit
against the imagery, not a survey.

Two things that cost real time here and are worth knowing before touching it:

- **Carto's free dark basemap now stamps "API KEY REQUIRED" across its tiles.**
  Both layers come from Esri instead.
- **MapLibre's GeoJSON worker does not run in this build.** Raster tiles and DOM
  markers render fine, but every GeoJSON source — including a one-point probe —
  stays unloaded forever, with no error raised and `isStyleLoaded()` stuck
  false. So rooms and pins are projected with `map.project()` into an SVG layer
  synced to the camera rather than added as GeoJSON layers. The GeoJSON helpers
  in `geo.ts` are still there if the worker is ever fixed.

### 360 — real Google Street View
[components/PanoramaViewer.tsx](components/PanoramaViewer.tsx) embeds the
genuine Google panorama through the keyless Maps Embed URL
(`/maps/embed?pb=...`). DPS has indoor coverage, so the concourse scene is the
actual terminal interior, not a stand-in.

The embed is a **cross-origin iframe**: nothing can be drawn inside it and its
camera cannot be read, so hotspots cannot be pinned onto the image. They live in
a rail beside it instead — an alert row pulses, selecting a row rebuilds the
embed URL at that heading so the panorama turns to face the equipment, and
clicking one opens its detail card. Adding a scene is Share -> Embed a map in
Google Maps, then copying the pano id, lat/lng and heading out of the `pb=`
value into [panorama.ts](panorama.ts).

With a Maps JavaScript API key, `StreetViewPanorama` exposes `pov_changed` and
custom overlays, and the hotspots could move inside the image; the scene data
already carries everything that would need.

[components/NearbyCameras.tsx](components/NearbyCameras.tsx) answers what an
alarm actually raises — *what can see this room* — ranked by distance with
alert-covering cameras first and flagged as slewed, the behaviour the research
describes for the 2,800-camera fleet. Feeds are simulated; `streamUrl` in
[cameras.ts](cameras.ts) is the seam for a real one.

### All twelve subsystems first
[components/SubsystemOverviewGrid.tsx](components/SubsystemOverviewGrid.tsx) is
the console's landing view, ported from the source dashboard's Building
Subsystems grid: a card per subsystem with its availability bar, primary KPI,
live Last-Data-Received badge and segmented asset bar. The card opens the
subsystem, the alert count opens its alerts, and the asset bar opens the
register filtered to it. The "All" chip in the subsystem strip returns to it.

## Known gaps, carried over from the source

These are **not** port regressions — they do not work in HBMS either:

- **Alert → Incident is cosmetic.** "Mark as Incident" shows a toast; no record
  is created. Both "Create Incident" submit buttons have no handler.
- **SOP edits do not persist.** "Save SOP" closes its modal and writes nothing.
- **`Cancelled` work-order status** exists in the type with no UI path to set it.
- The only genuinely wired escalations are Alert → SOP, KPI → Work Orders,
  SCADA → Asset Register, and Asset row → Subsystem page.

Work orders persist to `localStorage` under `hbms_work_orders_v1`, as in the
source — the only persistence anywhere in this folder.

## Two layout numbers that had to change

The source ran full-viewport; inside the TAMS header/sidebar chrome there is
~9rem less height, and both of these clipped as written:

- `SubsystemPage`'s map went from `flex: 0 0 54%` to `46%`, so the six-column
  KPI grid (LBMS) keeps its bottom row.
- `LBMSAHUGrid`'s `gridAutoRows` gained a real floor (`minmax(292px, 320px)`),
  so a short container can no longer squash rows below the faceplate's own
  height and make cards overlap.

The level switcher also moved from a right-hand list to a strip in the map's HUD
row, because the list sat over the easternmost aerobridge stands.

## Not ported

Dead code in the source: `AlertCenter`, `AlertContext`, the six DBKU-legacy
`*Details` pages, the generator scripts, and the legacy-Dashboard-only hooks.
