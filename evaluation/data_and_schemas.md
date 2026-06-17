# Data Structure and Schema Evaluation Report: Tactical Atlas

This report presents a comprehensive evaluation of the data structures, schemas, and validation architecture of the **Tactical Atlas** project. It analyzes `data/index.json`, `data/eras.json`, files under `data/battles/` and `data/simulations/`, as well as `schemas/battle.schema.json` and `schemas/simulation.schema.json`.

---

## 1. Executive Summary

Tactical Atlas utilizes a structured, JSON-based declarative data model designed to represent historical military engagements and time-series operational movements. By coupling static battle summaries with keyframe-based simulation timelines, the project achieves an interactive, lightweight, and highly performant web-based map simulation.

### Key Strengths:
* **Declarative Simulation DSL:** Representing units and their coordinates over a timeline via JSON keyframes is a brilliant design. It enables contributors without programming experience to easily create, edit, and submit detailed military animations.
* **Offline-First & High Performance:** Compiling all static database entries into a single portable HTML file (`dist/index.html`) using Leaflet makes the entire map work offline with zero external database overhead.
* **Strong Structural Foundations:** The validation pipeline (`scripts/validate.js`) uses AJV (Another JSON Schema Validator) to ensure schema compliance before pull requests are merged, maintaining high data integrity.

### Primary Areas for Improvement:
1. **Schema Gaps:** Certain runtime-relevant fields (e.g., `troop_unit` and `partial`) are missing from the formal schemas, leaving them unvalidated and undocumented.
2. **Enum Inconsistencies & Client Coupling:** Faction attributes, color mappings, and visual representations are tightly coupled and hardcoded in the client-side code (`tactical-atlas-bright-v0.3.html`), rather than being driven entirely by declarative data config.
3. **Validation Gaps:** The validation script does not cross-reference unit sides in simulations with battle side colors, check if coordinates fall within map boundaries, or enforce chronological phase sorting.
4. **Limitations of the Simulation DSL:** The current timeline engine is point-based (0D) and struggles to natively represent non-linear paths, tactical overlays (such as advance arrows or frontlines), and non-hourly campaigns without major manual workarounds.

---

## 2. Schema Coverage Analysis

We conducted a deep programmatic comparison between the actual JSON data files and their respective schemas. Our findings identified a highly robust foundation but revealed minor, critical coverage gaps.

### A. Root and Nested Property Gaps

| Data Scope | Field Name | Status | Location Used in Code / Data | Detailed Finding & Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Battle** | `sides[].troop_unit` | **Missing from Schema** | `data/battles/midway_1942.json`, parsed in `tactical-atlas-bright-v0.3.html` at line 2517 | Enables substituting the default `"명"` (soldiers) count with custom troop units (e.g., `"항모"` for aircraft carriers). Because it is not in the schema, it is undocumented and vulnerable to being broken. |
| **Simulation** | `units[].keyframes[].partial` | **Missing from Schema** | `data/simulations/midway_1942.json`, parsed in `tactical-atlas-bright-v0.3.html` | Controls rendering a "partially destroyed/heavy damage" status on NATO tactical icons. Bypasses schema validation and is undocumented for future contributors. |

### B. Enum & Value Definition Gaps
A severe discrepancy exists between the permitted `sides[].color` enums in the schema and the actual factions mapped in the frontend Leaflet visualizer:

1. **Schema-Only Factions:** `battle.schema.json` permits `["soviet", "rok", "pva", "british", "french"]` as side colors. However, **none** of these are defined in the frontend's hardcoded `SIDE_COLORS` or `FRIENDLY_SIDES` maps! If a contributor uses `"pva"`, it will pass schema validation but fail at runtime, defaulting to friendly Blue colors and icons.
2. **Frontend-Only Factions:** The frontend defines and uses `"russian"` (used in the `tannenberg_1914.json` simulation), but `"russian"` is **not** a permitted value in the battle schema side color enum (which defines `"soviet"` instead).

---

## 3. Validation Capability

The validation suite under `scripts/validate.js` is incredibly clean, fast, and plays a major role in keeping the database stable. It correctly validates JSON structure, checks bidirectional relationship graphs (`influences`/`influenced_by`), and ensures chronological ordering of unit keyframes. 

However, there are several **critical validation gaps** that let logical errors slip through:

### A. Major Validation Gaps
1. **No Faction / Side Cross-Validation:** 
   The simulation unit side values (e.g., `"german"`, `"russian"`, `"un"`, `"kpa"`) are not validated against the side colors defined in their parent battle files (`"blue"` and `"red"`). There is no check verifying that simulation units belong to a valid faction in that specific battle.
2. **No Coordinate/Boundary Validation:**
   * Coordinates in `coords` and keyframe `pos` are checked simply as general numbers. They are not checked for standard geographical bounds (`[-90, 90]` for latitude, `[-180, 180]` for longitude).
   * Keyframe positions are not verified against the simulation's initial viewport `bounds` or the battle's representative `coords`. Typos (such as swapping latitude/longitude) will pass validation but place units in the middle of the ocean or in Antarctica.
3. **No Timeline / Phase Validation:**
   * Phase times (`phases[].t`) are not checked to see if they exceed the simulation's `duration_h`.
   * The phases array is not validated for chronological sorting. If phases are declared out of order, UI rendering timeline ticks will break.
4. **No Automated Index Sync Verification:**
   The `data/index.json` file contains extensive duplicate battle summaries (`name`, `era`, `coords`, `has_simulation`, etc.). If a contributor adds a battle and runs `npm run validate`, the script does not check whether `index.json` is synced. The index will instantly drift out of sync unless manually updated.

---

## 4. JSON Structure Suitability for Historical Simulations

The keyframe-based declarative DSL represents a balanced trade-off between performance and representational accuracy. Below is an architectural analysis of its suitability:

### A. Strengths
* **Highly Optimized Interpolation:** Calculating a unit’s coordinate `pos = before.pos + (after.pos - before.pos) * ratio` at render-time is extremely light on CPU/GPU, ensuring smooth 60fps animations even on low-end mobile devices.
* **High Narrative Value:** By mapping discrete historical statuses, operational orders, and tactical objectives directly to temporal keyframes, the data structure successfully tells a chronological "story" of the unit's actions.
* **Declarative Timeline DSL:** Isolating the UI formatting of time (such as `h_plus`, `wall_clock`, `day_hour`, and `date_hour`) into clean declarative configurations in `t_label` is highly elegant and extensible.

### B. Limitations & Suitability Issues
* **Linear Pathing Assumption:** Real-world maneuver warfare is dictated by terrain, roads, rivers, and mountains. Linear interpolation moves units in straight lines. Forcing a unit to follow a realistic winding path requires inserting dozens of redundant keyframes, bloated with dummy status/order fields.
* **0D Point-Only Abstraction:** High-level tactical units (divisions, corps, armies) are represented as single map markers (0-dimensional points). Real military battles are fought over frontlines, perimeters, and flanking corridors. Point-markers fail to capture the geographic reality of a break-through, an encirclement (like Tannenberg's double envelopment), or a defensive perimeter (like the Pusan Perimeter).
* **No Vector / Visual Overlays in Schema:** Military maps rely extensively on visual annotations: **advance vectors (arrows), defensive lines, artillery fire arcs, and pocket perimeters**. Currently, the simulation schema has no concept of lines, arrows, or polygons. This forces the map to either remain empty of strategic context or requires hardcoding custom drawings in the client code.
* **Rigid Hourly Resolution Constraint:** The `duration_h` property forces the entire timeline to be represented in hours (`minimum: 0.5`). This is perfect for 1-5 day engagements (like Midway or Inchon), but makes it highly awkward to represent:
  * **Short tactical clashes** lasting minutes (e.g., modern aerial dogfights).
  * **Long campaigns** lasting months or years (e.g., Battle of Verdun or Stalingrad), where using hours leads to extremely large, unreadable numbers.

---

## 5. Data Consistency and Redundancy

The data structures exhibit a few structural inconsistencies and design redundancies:

1. **Index Redundancy:** `data/index.json` duplicates almost all metadata fields of individual battle files. This redundancy is highly prone to sync lag.
2. **Factions vs. Colors Mismatch:** Battle files define generic opposing sides using standard NATO colors (`blue` vs `red`). However, simulations map units to specific historical nations/factions (`german`, `russian`, `un`, etc.). This creates a cognitive gap between the static summary of a battle and its active simulation.
3. **Draft-07 Coordinate Representation:** The array structure of coordinates `[latitude, longitude]` lacks type safety. It does not enforce that the first element is latitude and the second is longitude, leaving the system prone to positional transposition.

---

## 6. Extensibility and Tight Coupling

The project has reached a point where expanding its scope (e.g., adding battles, custom factions, or multi-language options) is bottle-necked by **tight coupling with client-side code**:

* **Hardcoded Visual Factions:** The `SIDE_COLORS`, `FRIENDLY_SIDES`, and `sideLabel` maps are hardcoded directly in the client javascript (`tactical-atlas-bright-v0.3.html`). Introducing a new war era or battle (e.g., Vietnam War with `"viet_cong"` and `"us_macv"`) is impossible by data editing alone. Contributors are forced to modify core HTML/JS rendering code.
* **Fixed App-6 Symbol Mapping:** The NATO APP-6 icons are constructed dynamically inside the client code via custom inline SVG shapes (`makeNatoSymbol`). There is no declarative way in the data schemas to configure custom frames, markers, or composite symbols.
* **Rigid Localization Schema:** The data models support Korean and English by splitting fields (e.g., `name` vs `name_en`, or `ko` vs `en` inside `tactics`). If the project expands to other languages (e.g., French, Japanese, or German), it will require breaking schema modifications across all JSON files, rather than utilizing a clean, scalable localization map.

---

## 7. Actionable Recommendations & Architectural Roadmap

To scale Tactical Atlas into a world-class, bulletproof, and highly extensible historical database, we recommend the following step-by-step roadmap:

### Phase 1: Fix Schema Coverage & Clean Up Enums (High Priority)
1. **Amend `schemas/battle.schema.json`:**
   Add the `troop_unit` field to the battle side schema definition:
   ```json
   "troop_unit": {
     "type": "string",
     "description": "병력 규모 단위 재정의 (기본값: 명. 예: 항모, 사단)"
   }
   ```
2. **Amend `schemas/simulation.schema.json`:**
   Add the `partial` boolean field to the keyframe schema definition:
   ```json
   "partial": {
     "type": "boolean",
     "description": "이 시점에 부대의 일부(예: 다수 척 중 일부)가 파괴/대파되었는지 여부"
   }
   ```
3. **Align Schema Enums with Code:**
   In `schemas/battle.schema.json`, add `"russian"` to the side color enum. In the frontend HTML, ensure that `"soviet"`, `"rok"`, `"pva"`, `"british"`, and `"french"` are fully registered under `SIDE_COLORS` and `FRIENDLY_SIDES` to prevent silent fallback and styling bugs.

### Phase 2: Upgrade `validate.js` to Close Logical Gaps (Medium Priority)
1. **Implement Coordinate Tuple Checks:**
   Enhance `battle.schema.json` using JSON Schema Draft-07 tuple syntax to restrict coordinates:
   ```json
   "coords": {
     "type": "array",
     "items": [
       { "type": "number", "minimum": -90, "maximum": 90, "description": "위도" },
       { "type": "number", "minimum": -180, "maximum": 180, "description": "경도" }
     ],
     "additionalItems": false,
     "minItems": 2,
     "maxItems": 2
   }
   ```
2. **Implement Phase Timeline Checks:**
   Add logic in `validate.js` to ensure that:
   * `phases` are strictly sorted chronologically (`p.t >= p_prev.t`).
   * No phase time `t` exceeds the simulation's `duration_h`.
3. **Implement Boundary Proximity Checks:**
   Add validation checking that all keyframe positions (`pos`) lie reasonably close (e.g., within 5-10 degrees) to the simulation's initial viewport `bounds` to instantly capture latitude-longitude transposition errors.
4. **Implement Automatic Sync Checks for `index.json`:**
   Add a block in `validate.js` that compiles a temporary index in memory from individual battle/simulation files and asserts that `data/index.json` matches it 100%. If they differ, fail the build.

### Phase 3: Decouple Visual Configuration (Low Priority / Architectural Win)
1. **Introduce a Central Faction Registry (`data/factions.json`):**
   Move all hardcoded visual configuration out of client-side code into a dedicated registry. This file will map faction keys directly to colors, friendliness, multi-lingual labels, and NATO icon symbols:
   ```json
   {
     "german_ww1": {
       "label_ko": "독일 제국군",
       "label_en": "German Imperial Army",
       "friendly": true,
       "stroke": "#1a3d5f",
       "fill": "#2c5d8f"
     },
     "russian_ww1": {
       "label_ko": "러시아 제국군",
       "label_en": "Imperial Russian Army",
       "friendly": false,
       "stroke": "#6b1e1e",
       "fill": "#a83232"
     }
   }
   ```
   Modify `build.js` to inject this registry into the client, making the entire visual framework completely data-driven and extensible.

### Phase 4: Extend the Simulation DSL with Visual Overlays (Future Roadmap)
1. **Support Declarative Tactical Drawings (Polylines/Polygons):**
   To move beyond single point markers, introduce a `features` array in `simulation.schema.json` representing tactical advance vectors, boundaries, and frontlines using standard GeoJSON features mapped to a timeline:
   ```json
   "features": [
     {
       "id": "german_envelopment_arrow",
       "type": "arrow",
       "color": "blue",
       "t_start": 24,
       "t_end": 72,
       "coordinates": [[53.92, 20.3], [53.70, 20.1], [53.40, 20.2]]
     }
   ]
   ```
   This would allow the map to render professional military movement arrows and frontline circles directly from JSON, drastically raising the tactical fidelity of the simulations.
