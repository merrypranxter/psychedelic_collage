#!/usr/bin/env node
/**
 * tools/query.js
 * Simple command-line query tool for the psychedelic collage database
 * 
 * Usage:
 *   node tools/query.js type=shader
 *   node tools/query.js tag=mood:euphoric
 *   node tools/query.js search=kaleidoscope
 *   node tools/query.js random --count=3
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENTRIES_FILE = path.join(ROOT, 'db', 'indices', 'entries.json');
const BY_TAG_FILE = path.join(ROOT, 'db', 'indices', 'by_tag.json');

// Load database
function loadDatabase() {
  try {
    return JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load database. Run `node tools/build_index.js` first.');
    process.exit(1);
  }
}

// Parse command line args
function parseArgs() {
  const args = process.argv.slice(2);
  const query = {
    type: null,
    tag: null,
    search: null,
    random: false,
    count: 1,
  };

  args.forEach(arg => {
    if (arg === 'random') {
      query.random = true;
    } else if (arg.startsWith('--count=')) {
      query.count = parseInt(arg.split('=')[1], 10);
    } else if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      query[key] = value;
    }
  });

  return query;
}

// Query functions
function filterByType(entries, type) {
  return entries.filter(e => e.type === type);
}

function filterByTag(entries, tagString) {
  return entries.filter(e => {
    if (!e.tags) return false;
    const [axis, value] = tagString.split(':');
    const tagValues = e.tags[axis];
    if (!tagValues) return false;
    const values = Array.isArray(tagValues) ? tagValues : [tagValues];
    return values.includes(value);
  });
}

function filterBySearch(entries, searchTerm) {
  const term = searchTerm.toLowerCase();
  return entries.filter(e => {
    const searchableText = [
      e.name,
      e.summary,
      e.description,
      e.type,
      e.id,
      JSON.stringify(e.tags),
    ].join(' ').toLowerCase();
    return searchableText.includes(term);
  });
}

function getRandomEntries(entries, count) {
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Display functions
function displayEntry(entry, detailed = false) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ID: ${entry.id}`);
  console.log(`Type: ${entry.type}`);
  console.log(`Name: ${entry.name}`);
  if (entry.summary) {
    console.log(`Summary: ${entry.summary}`);
  }
  
  if (detailed) {
    if (entry.description) {
      console.log(`\nDescription:\n${entry.description}`);
    }
    if (entry.tags) {
      console.log('\nTags:');
      Object.entries(entry.tags).forEach(([axis, values]) => {
        const vals = Array.isArray(values) ? values : [values];
        console.log(`  ${axis}: ${vals.join(', ')}`);
      });
    }
    if (entry.code || entry.glsl) {
      console.log(`\nCode:\n${entry.code || entry.glsl}`);
    }
  }
}

function displayResults(results, detailed = false) {
  if (results.length === 0) {
    console.log('\nNo results found.');
    return;
  }

  console.log(`\nFound ${results.length} result(s):`);
  results.forEach(entry => displayEntry(entry, detailed));
  console.log(`\n${'='.repeat(80)}\n`);
}

// Main
function main() {
  const query = parseArgs();
  const entries = loadDatabase();
  let results = entries;

  // Apply filters
  if (query.type) {
    results = filterByType(results, query.type);
    console.log(`Filtering by type: ${query.type}`);
  }

  if (query.tag) {
    results = filterByTag(results, query.tag);
    console.log(`Filtering by tag: ${query.tag}`);
  }

  if (query.search) {
    results = filterBySearch(results, query.search);
    console.log(`Searching for: ${query.search}`);
  }

  if (query.random) {
    results = getRandomEntries(results, query.count);
    console.log(`Getting ${query.count} random entry/entries`);
  }

  displayResults(results, true);

  // Export to JSON if requested
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Psychedelic Collage Database Query Tool

Usage:
  node tools/query.js [filters] [options]

Filters:
  type=<type>           Filter by entry type (shader, palette, style, etc.)
  tag=<axis:value>      Filter by tag (e.g., mood:euphoric, era:60s)
  search=<term>         Search in name, summary, and description
  random                Get random entries

Options:
  --count=<n>          Number of random entries to return (default: 1)
  --json               Output results as JSON
  --help, -h           Show this help message

Examples:
  node tools/query.js type=shader
  node tools/query.js tag=mood:euphoric
  node tools/query.js search=kaleidoscope
  node tools/query.js random --count=5
  node tools/query.js type=palette tag=era:60s
  `);
  process.exit(0);
}

main();
