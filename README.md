# Psychedelic Collage Database

A curated, remixable database of psychedelic collage aesthetics, workflows, and building blocks for AI generative art, shader art, and JavaScript tooling.

---

## What This Is

This repo is a **structured knowledge base** (YAML-first, human-readable) for the psychedelic collage visual language — covering styles, techniques, palettes, print artifacts, typography treatments, shader building blocks, material references, and composable pipelines.

The intended use is **mix-and-match**: pick entries from different categories, cross-reference them via `compat.works_with` and pipeline `steps.use`, and wire them into generative art workflows in JS, GLSL/WebGL, or AI diffusion pipelines.

---

## Repository Layout

```
psychedelic_collage/
  db/
    _schema/
      tagsets.yaml            ← canonical tag axes for all entries
      entry.schema.yaml       ← universal entry schema documentation
    entries/
      styles/                 ← visual style definitions (analog zine, 60s poster, glitch…)
      techniques/             ← process techniques (cutout layering, kaleidoscope, masking…)
      palettes/               ← named color palettes with hex values
      motifs_subjects/        ← recurring imagery and compositional motifs
      composition/            ← layout and compositional frameworks
      typography/             ← type treatments and lettering styles
      materials_textures/     ← physical material properties and texture sources
      print_artifacts/        ← print process artifacts (halftone, ink bleed, xerox…)
      rendering_shader/       ← GLSL/WebGL shader blocks with code fragments
      pipelines/              ← multi-step composable workflows
      references/             ← reference works and archival sources
    indices/                  ← generated JSON indices (run tools/build_index.js)
  tools/
    build_index.js            ← scans YAML entries → emits JSON indices
  README.md
```

---

## Entry Format

Every entry is a single YAML file at `db/entries/<category>/<slug>.yaml`. All entries share the universal schema defined in `db/_schema/entry.schema.yaml`.

### Minimal example

```yaml
id: psc.style.analog_zine_xerox.v1
type: style
name: Analog Zine / Xerox Collage
summary: "Low-fi, high-energy collage aesthetic built from photocopied, cut, and pasted ephemera."
description: |
  Full description of the style...
tags:
  medium: [analog, hybrid]
  color: [monochrome]
  mood: [chaotic, aggressive]
  era: [70s, 90s_rave]
version: 1
created_at: "2026-04-10"
```

### Full entry shape (all optional fields)

```yaml
id: psc.<type>.<slug>.v<n>      # required — canonical psc. prefix
type: style                      # required — see tagsets.yaml for valid types
name: "Human Name"               # required
aliases: [alt_name, keyword]     # optional
summary: "One sentence."         # required
description: |                   # required — markdown welcome
  Longer notes...
tags:                            # required — axes from db/_schema/tagsets.yaml
  medium: [digital]
  color: [neon, acid]
  mood: [euphoric]
constraints:                     # optional
  do:   ["do this"]
  avoid: ["not this"]
parameters:                      # optional — for shader/tool entries
  - name: intensity
    type: float
    default: 0.5
    range: [0.0, 1.0]
compat:                          # optional — cross-references
  works_with: [psc.other.entry.v1]
  not_ideal_with: [psc.another.v1]
inputs:  [...]                   # optional — pipeline entries only
steps:   [...]                   # optional — pipeline entries only
outputs: [...]                   # optional — hints, code fragments, prompt fragments
colors:  [...]                   # optional — palette entries only
provenance:                      # optional
  sources: [{kind: note, value: "..."}]
version: 1                       # required
created_at: "2026-04-10"        # required
```

---

## Naming Conventions

| Field | Convention | Example |
|-------|-----------|---------|
| ID prefix | Always `psc.` | `psc.style.glitch_scan_bend.v1` |
| Type segment | Matches `type` field | `style`, `palette`, `pipeline`, `shader` |
| Slug | `snake_case`, descriptive | `acid_vibration`, `cutout_layering` |
| Version | Integer, increment on breaking change | `v1`, `v2` |
| File name | Matches slug | `acid_vibration.yaml` |
| Directory | Matches type plural | `palettes/`, `pipelines/` |

---

## How to Add Entries

1. Choose the appropriate category directory under `db/entries/`.
2. Create a new file: `<slug>.yaml` using the schema above.
3. Assign a unique `id` following the `psc.<type>.<slug>.v1` convention.
4. Add at least: `id`, `type`, `name`, `summary`, `description`, `tags`, `version`, `created_at`.
5. Cross-reference related entries via `compat.works_with`.
6. Run `node tools/build_index.js` to regenerate the JSON indices.

---

## How to Reference Entries in Pipelines

Pipeline entries use a `steps` array where each step references another entry by its `id`:

```yaml
id: psc.pipeline.my_workflow.v1
type: pipeline
name: My Collage Workflow
inputs:
  - kind: image
    notes: "Source image"
steps:
  - use: psc.technique.cutout_layering.v1
    params:
      shadow_opacity: 0.4
  - use: psc.print_artifact.halftone_screen.v1
    params:
      frequency: 55.0
  - use: psc.shader.paper_grain_overlay.v1
outputs:
  - kind: image
```

---

## Usage from JavaScript

### Parse a single YAML entry

```js
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

const entry = load(readFileSync('db/entries/styles/analog_zine_xerox.yaml', 'utf8'));
console.log(entry.name);        // "Analog Zine / Xerox Collage"
console.log(entry.tags.mood);   // ["chaotic", "aggressive"]
```

### Load the generated JSON index

```js
import entries from './db/indices/entries.json' assert { type: 'json' };

// Find all pipeline entries
const pipelines = entries.filter(e => e.type === 'pipeline');

// Find all entries tagged with mood: euphoric
const euphoric = entries.filter(e =>
  Array.isArray(e.tags?.mood) && e.tags.mood.includes('euphoric')
);
```

### Use a palette entry's hex values

```js
import palette from './db/indices/entries.json' assert { type: 'json' };
const acidPalette = palette.find(e => e.id === 'psc.palette.acid_vibration.v1');
const hexValues = acidPalette.colors.map(c => c.hex);
// ["#FF6B00", "#0047FF", "#FF00C8", "#AAFF00", ...]
```

---

## Shader Pipeline Hints

Each shader entry (`type: shader`) and many other entries include an `outputs` array
with `kind: shader_hint` and/or `kind: code_fragment`. Use these to scaffold GLSL passes:

```js
// Collect all shader hint strings for a given pipeline
function collectShaderHints(pipelineEntry, allEntries) {
  return pipelineEntry.steps.flatMap(step => {
    const ref = allEntries.find(e => e.id === step.use);
    if (!ref) return [];
    return (ref.outputs || [])
      .filter(o => o.kind === 'shader_hint')
      .map(o => o.value);
  });
}
```

Shader entries also include `kind: code_fragment` outputs containing ready-to-use
GLSL snippets. Example using the halftone shader:

```js
const halftoneEntry = entries.find(e => e.id === 'psc.shader.halftone_screen.v1');
const glslCode = halftoneEntry.outputs.find(o => o.kind === 'code_fragment').value;
// Inject into your WebGL shader
```

---

## YAML → JSON Index Generation

The `tools/build_index.js` script scans all YAML entries and emits 4 JSON files under `db/indices/`:

| File | Contents |
|------|---------|
| `entries.json` | Full array of all entries |
| `summary.json` | Lightweight index (id, type, name, summary, tags) |
| `by_type.json` | Entries grouped by `type` |
| `by_tag.json` | Entry IDs grouped by `axis:value` tag strings |

### Setup & run

```bash
# Install dependencies (one-time)
npm install js-yaml glob

# Generate indices
node tools/build_index.js
```

The `db/indices/` output files are gitignored by convention — regenerate them locally
or in CI from the canonical YAML source.

---

## Current Entry Inventory

| Category | Count | Key entries |
|----------|-------|-------------|
| styles | 6 | analog_zine_xerox, sixties_poster_op_art, surreal_photomontage, cyberdelic_neon, occult_mandala_collage, glitch_scan_bend |
| techniques | 7 | cutout_layering, compositing_modes, texture_sourcing, collage_shadow_depth, ai_to_collage_constraints, kaleidoscope_pattern, masking_and_isolation |
| palettes | 5 | acid_vibration, vintage_duotone, cyberdelic_neon, occult_jewel, risograph_rainbow |
| print_artifacts | 5 | halftone_screen, cmyk_misregistration, ink_bleed, photocopy_noise, screenprint_separation |
| typography | 3 | psychedelic_poster_lettering, ransom_note, curved_baseline |
| rendering_shader | 5 | halftone_screen, paper_grain_overlay, chromatic_aberration, displacement_warp, edge_cutout |
| pipelines | 5 | ai_gen_to_collage, scan_textures_to_xerox, feedback_loop_kaleidoscope, acid_poster_render, glitch_neon_composite |
| motifs_subjects | 2 | sacred_geometry_grid, botanical_engraving |
| composition | 2 | radial_centered, maximalist_stack |
| materials_textures | 2 | aged_newsprint, watercolor_paper |

**Total: 42 entries**

---

## Tag Axes

All tag axes are defined in `db/_schema/tagsets.yaml`. Key axes:

- **medium**: `digital` · `analog` · `hybrid`
- **color**: `neon` · `acid` · `pastel` · `monochrome` · `CMYK` · `duotone` · `earth`
- **mood**: `euphoric` · `uncanny` · `chaotic` · `mystical` · `dreamy` · `aggressive`
- **era**: `60s` · `70s` · `90s_rave` · `contemporary`
- **print**: `halftone` · `newsprint` · `risograph` · `xerox` · `screenprint` · `offset`
- **shader_ops**: `posterize` · `halftone` · `chromatic_aberration` · `displacement` · `edge_detect` · `feedback_loop` · `noise_overlay`

---

## Contributing

1. Fork or branch.
2. Add entry YAML files following the naming conventions above.
3. Cross-reference new entries in existing entries' `compat.works_with`.
4. Run `node tools/build_index.js` and verify no parse errors.
5. Open a PR.

All initial entries use `created_at: "2026-04-10"`.
