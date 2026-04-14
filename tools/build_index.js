#!/usr/bin/env node
/**
 * tools/build_index.js
 * Scans all YAML entry files under db/entries/ and emits JSON indices
 * under db/indices/.
 *
 * Usage:
 *   node tools/build_index.js
 *
 * Outputs:
 *   db/indices/entries.json   – flat array of all entries (full objects)
 *   db/indices/by_type.json   – entries grouped by type
 *   db/indices/by_tag.json    – entries indexed by each tag axis/value
 *   db/indices/summary.json   – lightweight index (id, type, name, summary, tags)
 *
 * Requirements:
 *   npm install js-yaml glob   (or: yarn add js-yaml glob)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { globSync } = require('glob');

// ── Paths ────────────────────────────────────────────────────────────────────
const ROOT        = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'db', 'entries');
const INDICES_DIR = path.join(ROOT, 'db', 'indices');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read and parse a single YAML entry file. Returns null on error. */
function loadEntry(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(raw);
    if (!doc || typeof doc !== 'object') {
      console.warn(`[SKIP] ${filePath}: not a YAML object`);
      return null;
    }
    if (!doc.id || !doc.type) {
      console.warn(`[SKIP] ${filePath}: missing required id or type`);
      return null;
    }
    // Attach file path metadata for debugging
    doc._file = path.relative(ROOT, filePath);
    return doc;
  } catch (err) {
    console.error(`[ERROR] ${filePath}: ${err.message}`);
    return null;
  }
}

/** Flatten a tags object into an array of "axis:value" strings. */
function flattenTags(tags) {
  if (!tags || typeof tags !== 'object') return [];
  const result = [];
  for (const [axis, values] of Object.entries(tags)) {
    const vals = Array.isArray(values) ? values : [values];
    for (const v of vals) {
      result.push(`${axis}:${v}`);
    }
  }
  return result;
}

/** Produce a lightweight summary object for the summary index. */
function summarize(entry) {
  return {
    id:      entry.id,
    type:    entry.type,
    name:    entry.name,
    summary: entry.summary || '',
    tags:    entry.tags || {},
    _file:   entry._file,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Ensure output dir exists
  fs.mkdirSync(INDICES_DIR, { recursive: true });

  // Discover all YAML entry files
  const pattern = path.join(ENTRIES_DIR, '**', '*.yaml').replace(/\\/g, '/');
  const files   = globSync(pattern);

  if (files.length === 0) {
    console.warn('[WARN] No YAML entry files found under db/entries/');
  }

  // Load all entries
  const entries = [];
  for (const file of files) {
    const entry = loadEntry(file);
    if (entry) entries.push(entry);
  }

  console.log(`Loaded ${entries.length} entries from ${files.length} files.`);

  // ── Build indices ──────────────────────────────────────────────────────────

  // 1) Full flat array
  write('entries.json', entries);

  // 2) Grouped by type
  const byType = {};
  for (const e of entries) {
    (byType[e.type] = byType[e.type] || []).push(summarize(e));
  }
  write('by_type.json', byType);

  // 3) Grouped by tag (axis:value)
  const byTag = {};
  for (const e of entries) {
    for (const tag of flattenTags(e.tags)) {
      (byTag[tag] = byTag[tag] || []).push(e.id);
    }
  }
  write('by_tag.json', byTag);

  // 4) Lightweight summary
  write('summary.json', entries.map(summarize));

  console.log(`Wrote 4 index files to ${path.relative(ROOT, INDICES_DIR)}/`);
}

function write(name, data) {
  const dest = path.join(INDICES_DIR, name);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  → ${path.relative(ROOT, dest)} (${JSON.stringify(data).length} bytes)`);
}

main();
