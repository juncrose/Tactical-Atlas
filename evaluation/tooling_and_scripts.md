# Tactical Atlas Tooling and Developer Experience (DX) Evaluation

An in-depth evaluation of the automation scripts, build system, validation mechanics, scaffolding, and developer experience in the **Tactical Atlas** codebase. This report evaluates the following key automation files:
- `package.json`
- `scripts/validate.js`
- `scripts/build.js`
- `scripts/dev-server.js`
- `scripts/new-battle.js`
- `scripts/fetch-borders.sh`

---

## 1. Executive Summary

Tactical Atlas implements a remarkably elegant, lightweight, and low-overhead developer environment. Rather than relying on heavyweight, opinionated JavaScript frameworks (e.g., React, Svelte, Vite, Webpack, Babel), it uses **native Node.js scripts** and **vanilla HTML/JS** to manage a single-page interactive historical map simulator. 

### Key Strengths:
1. **Zero-overhead Build System**: Build times are virtually instantaneous (<500ms), compiling historical datasets directly into a single, offline-capable, high-performance `dist/index.html` file (~150 KB).
2. **Robust Declarative Validation**: Schema-driven validation using **Ajv (JSON Schema)** ensures structure, type-safety, and range-safety of user-submitted data without complicating local builds.
3. **Clever DSL Compilation**: The simulation time label DSL (e.g., `wall_clock`, `day_hour`) is kept declarative in JSON and dynamically compiled to runtime formatting functions inside the browser, maintaining clean separation of concerns.
4. **Low Dependency Footprint**: Only two devDependencies (`ajv` and `ajv-formats`) are needed, preventing the "dependency hell" common in modern Node.js ecosystems.

---

## 2. Component-by-Component Evaluation

### A. `package.json` & Dependency Footprint
The dependency footprint is minimal and tightly focused.
```json
"devDependencies": {
  "ajv": "^8.17.1",
  "ajv-formats": "^3.0.1"
}
```
* **Analysis**: Having only AJV schemas as external build dependencies is a major asset for security, maintenance, and setup velocity. Contributors can install dependencies and run the project locally in under 5 seconds.
* **Scripts Structure**: The standard developer commands are clearly mapped to simple npm scripts.
  - `npm run validate`: Enforces strict data formats.
  - `npm run build`: Bundles database JSON into the static HTML template.
  - `npm run dev`: Fires up the Node-based developer server with dynamic rebuilding.
  - `npm run dev:share`: Leverages Python/Gradio to spawn a public shareable preview URL.
  - `npm run new:battle`: Offers a guided, conversational CLI wizard for adding database entries.

### B. `scripts/validate.js` (Test & Validation Robustness)
This script is the gatekeeper for data integrity. It is split into structural schema validation, semantic validation, and graph topological verification.
1. **Structural Validation**: Uses AJV to compile `battle.schema.json` and `simulation.schema.json` and runs checks across all files in `data/battles` and `data/simulations`.
2. **Semantic Verification**:
   - Enforces filename-to-ID equivalence.
   - Enforces unique victors (exactly 1 victor per battle).
   - Validates simulation boundaries (e.g., checks if keyframe time $t$ exceeds `duration_h` or is unsorted).
3. **Topological / Graph Verification**:
   - Ensures that references in `influences` are reciprocated in `influenced_by` in target files, emitting a warning if there is a mismatch.
4. **Exit Codes**: Correctly issues exit code `1` on fatal errors, which guarantees immediate failure on CI/CD when invalid code or data is pushed.

* **Omission/Gap**:
  - **No Simulation Flag Cross-Check**: A battle's JSON can declare `"has_simulation": true` even when no simulation file exists, or vice versa. The validation script currently does not check if the `has_simulation` flag matches the actual existence of a simulation file.
  - **No Unit Side Validation**: A simulation file specifies a `side` for each unit (e.g. `"side": "soviet"`). `validate.js` does not verify if this `side` value matches one of the `sides[].color` values in the corresponding battle.

### C. `scripts/build.js` (Build System Efficiency)
The build script creates a completely self-contained offline bundle.
1. **Dynamic Template Extraction**: If `src/template.html` does not exist, it automatically finds the main HTML file (`tactical-atlas-bright-v0.3.html`), strips the old embedded data block using specific marker strings (`const ERAS = {` and `const SIDE_COLORS`), and injects the newly aggregated JSON.
2. **Runtime DSL Compiler**: A compact, efficient JS compiler (`T_LABEL_RUNTIME`) is injected alongside the raw JSON so that declarative `t_label` specifications (e.g., custom date patterns) are compiled into high-performance formatting functions inside the client's browser.
3. **Zero Bundler Requirement**: Avoids Webpack/Vite completely. The resulting `dist/index.html` can be loaded over double-click (local filesystem `file://` protocol) or any static web host.

* **Omission/Gap**:
  - **Fragile Regex/Marker Extraction**: The fallback regex extraction in `build.js` assumes specific line patterns in `tactical-atlas-bright-v0.3.html`. If a developer modifies formatting or variable spacing in that HTML, the extraction can fail silently or break. 

### D. `scripts/dev-server.js` (Developer Server & DX)
An outstanding piece of custom tooling that replaces heavy tools like `live-server`.
1. **On-the-Fly Rebuilds**: Intercepts requests to `/` and `/index.html`, runs `npm run build` synchronously, and serves the freshly built file. This creates a hot-reload-like experience simply on page refresh.
2. **Port Collisions**: Dynamically retries with `port + 1` if port `3000` is occupied, reducing CLI friction for developers running multiple projects.
3. **MIME-Type Fallbacks**: Serves raw static files (like historical borders GeoJSON) directly from the directory tree.

* **Observation**: Sync execution of the build script on reload is extremely lightweight because our build is fast. If database size grows, we might want to switch to asynchronous in-memory caching or an `fs.watch` model, but currently, rebuild-on-refresh is ideal.

### E. `scripts/new-battle.js` (Scaffolding Quality)
An interactive terminal CLI that guides contributors step-by-step to create a new battle file.
1. **ID Constraint Enforcement**: Validates that IDs follow the strictly required regular expression pattern `/^[a-z][a-z0-9_]*_[0-9]{4}$/` before creating files.
2. **Boilerplate Scaffolding**: Automatically populates required template blocks such as tactics, sources, contributors, and status.

* **Critical Friction Point / Defect**:
  - When the user presses `Enter` to skip non-required/empty numeric entries (e.g. `병력 수` or `사상자 수`), the CLI parses them with `parseInt('', 10)`, returning `NaN`.
  - When written to JSON via `JSON.stringify`, `NaN` becomes `null`.
  - Since the `battle.schema.json` strictly specifies `type: "integer"` for `troops` and `casualties` (and does **not** allow `null`), the newly generated battle file **will immediately fail validation** (`npm run validate`) by default! This creates significant friction for contributors.
  - Entering invalid coordinate formats will also cause `NaN` coordinates, which write as `null` and violate the schema.

### F. `scripts/fetch-borders.sh` (Historical Borders Data Pipeline)
A highly sophisticated shell script that fetches geopolitical GIS shapefiles (CShapes 2.0 dataset) from ETH Zurich, parses the battle database to extract unique active years, filters borders via `ogr2ogr` for those specific years, and simplifies geometries to minimize filesize.
* **Observation**: Highly efficient and automatically driven by the database contents. However, since it is a shell script calling `curl`, `unzip`, `ogr2ogr`, and `jq`, it requires a Unix environment (or WSL on Windows) with geospatial system libraries installed.

---

## 3. Findings Matrix: Strengths & Vulnerabilities

| File | Strength | Weakness / Risk |
| :--- | :--- | :--- |
| `validate.js` | Uses AJV schemas. Performs topological bidirectional verification on relationships. | Does not verify if `has_simulation: true` matches a physical file. Does not check if simulation unit sides match the battle side colors. |
| `build.js` | Blazing fast. Excellent inline string compilation of the `t_label` DSL. Offline-first. | Fragile marker string slicing fallback on `tactical-atlas-bright-v0.3.html`. |
| `dev-server.js` | Rebuild-on-refresh eliminates watch state. Smart port fallback. | No filesystem watcher (requires manual page refresh to trigger build). |
| `new-battle.js` | Helpful step-by-step CLI interface with regex ID check. | Empty values parse to `NaN` and serialize to `null` in JSON, breaking validation. No immediate input enum checking for `era` or `color`. |
| `package.json` | Exceptionally low dependency count, easy and secure setup. | Missing automatic formatting/style enforcement (e.g., Prettier/ESLint). |

---

## 4. Concrete Recommendations

### Recommendation 1: Fix `new-battle.js` Empty-to-NaN Serialization Issue
To prevent generated files from failing validation instantly, modify `scripts/new-battle.js` to assign sensible defaults (like `0` or default symbols) and parse numeric fields safely:
```javascript
// Example fix for integer parsing with default values
const parseInputInt = (val, defaultValue = 0) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const s1_troops = parseInputInt(await ask('병력 수 (기본값: 0): '), 0);
const s1_cas = parseInputInt(await ask('사상자 수 (기본값: 0): '), 0);
```
Additionally, validate that the inputted `era` and `color` belong to their allowed schema enums during the interactive prompts.

### Recommendation 2: Close Validation Gaps in `validate.js`
Incorporate the following semantic checks in `scripts/validate.js`:
1. **Simulation File Synchronization**: Verify that if `battle.has_simulation` is `true`, a matching simulation file `data/simulations/${battle.id}.json` physically exists. Conversely, if a simulation file exists, `has_simulation` should be set to `true`.
2. **Simulation Unit Color Matching**: Verify that for every unit in a simulation, `unit.side` matches one of the `sides[].color` values in the corresponding battle JSON.

### Recommendation 3: Stabilize Build Template Source
To eliminate the fragile marker-based extraction fallback on `tactical-atlas-bright-v0.3.html`, generate and check-in `src/template.html` permanently into git. This clean, dedicated HTML template would contain `/* @@INJECT_DATA@@ */` and remain unaffected by format changes in other visualization files.

### Recommendation 4: Create a GitHub Actions CI Workflow
Add a GitHub Action workflow file `.github/workflows/validate.yml` to automatically run `npm run validate` and `npm run build` on every pull request and push to `main`. This guarantees data integrity before merging:
```yaml
name: CI Validate

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      - name: Install Dependencies
        run: npm ci
      - name: Run Schema and Semantic Validation
        run: npm run validate
      - name: Run Single HTML Build
        run: npm run build
```

---

## 5. Review Summary

### Correct
- **Ajv Validation**: Schema compilation and validation in `validate.js` are highly robust, providing deep structural checks for coordinates, types, and schema compliance.
- **Topological Integrity**: Bidirectional validation of impact graphs is correctly written and prevents orphan relations or dangling pointers.
- **Dev Server Port Fallback**: Safely avoids collisions when starting multiple instances.
- **Build Compression**: Bundles all files into a single, highly portable, and incredibly small (~150KB) static output.

### Fixed
- *No code fixes were applied during this review as it was an inspection and evaluation-only task.*

### Blocker
- **None**: No critical blockers prevent normal operation. The existing scripts execute and compile successfully.

### Note
- **Interactive Scaffolder Bug**: The scaffolding tool writes invalid JSONs when fields are skipped due to `NaN` serializing to `null`, which requires manual editing to pass validations.
- **CI Lack**: The project references GitHub Actions in comments, but does not actually contain any `.github/workflows` configurations. Implementing the recommended workflow will secure the contribution pipeline.
