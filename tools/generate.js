#!/usr/bin/env node
/**
 * tools/generate.js
 * Generates random psychedelic collage combinations
 * 
 * Usage:
 *   node tools/generate.js              # Generate one combination
 *   node tools/generate.js --count=5    # Generate 5 combinations
 *   node tools/generate.js --prompt     # Output as AI image prompt
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENTRIES_FILE = path.join(ROOT, 'db', 'indices', 'entries.json');
const BY_TYPE_FILE = path.join(ROOT, 'db', 'indices', 'by_type.json');

function loadDatabase() {
  try {
    const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8'));
    const byType = JSON.parse(fs.readFileSync(BY_TYPE_FILE, 'utf8'));
    return { entries, byType };
  } catch (err) {
    console.error('Failed to load database. Run `node tools/build_index.js` first.');
    process.exit(1);
  }
}

function getRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomFromType(byType, typeName) {
  const items = byType[typeName];
  if (!items || items.length === 0) return null;
  return getRandom(items);
}

function generateCombination(db) {
  const { byType, entries } = db;
  
  // Pick random elements from different categories
  const style = getRandomFromType(byType, 'style');
  const palette = getRandomFromType(byType, 'palette');
  const technique = getRandomFromType(byType, 'technique');
  const motif = getRandomFromType(byType, 'motif');
  const typography = getRandomFromType(byType, 'typography');
  const printArtifact = getRandomFromType(byType, 'print_artifact');
  
  return {
    style,
    palette,
    technique,
    motif,
    typography,
    printArtifact,
  };
}

function formatAsPrompt(combo) {
  const parts = [];
  
  if (combo.style) {
    parts.push(combo.style.name);
  }
  
  if (combo.motif) {
    parts.push(`featuring ${combo.motif.name.toLowerCase()}`);
  }
  
  if (combo.palette) {
    parts.push(`with ${combo.palette.name.toLowerCase()} color palette`);
  }
  
  if (combo.technique) {
    parts.push(`using ${combo.technique.name.toLowerCase()} technique`);
  }
  
  if (combo.typography) {
    parts.push(`${combo.typography.name.toLowerCase()} typography`);
  }
  
  if (combo.printArtifact) {
    parts.push(`${combo.printArtifact.name.toLowerCase()} print artifacts`);
  }
  
  return parts.join(', ');
}

function displayCombination(combo, index, asPrompt = false) {
  if (asPrompt) {
    console.log(`\n🎨 Combination ${index}:`);
    console.log(formatAsPrompt(combo));
    return;
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🌀 COMBINATION ${index}`);
  console.log('='.repeat(80));
  
  if (combo.style) {
    console.log(`\n📐 STYLE: ${combo.style.name}`);
    console.log(`   ${combo.style.summary}`);
  }
  
  if (combo.palette) {
    console.log(`\n🎨 PALETTE: ${combo.palette.name}`);
    console.log(`   ${combo.palette.summary}`);
  }
  
  if (combo.technique) {
    console.log(`\n✂️  TECHNIQUE: ${combo.technique.name}`);
    console.log(`   ${combo.technique.summary}`);
  }
  
  if (combo.motif) {
    console.log(`\n🔮 MOTIF: ${combo.motif.name}`);
    console.log(`   ${combo.motif.summary}`);
  }
  
  if (combo.typography) {
    console.log(`\n📝 TYPOGRAPHY: ${combo.typography.name}`);
    console.log(`   ${combo.typography.summary}`);
  }
  
  if (combo.printArtifact) {
    console.log(`\n🖨️  PRINT ARTIFACT: ${combo.printArtifact.name}`);
    console.log(`   ${combo.printArtifact.summary}`);
  }
  
  // Extract common tags
  const allTags = {};
  Object.values(combo).forEach(item => {
    if (item && item.tags) {
      Object.entries(item.tags).forEach(([axis, values]) => {
        if (!allTags[axis]) allTags[axis] = new Set();
        const vals = Array.isArray(values) ? values : [values];
        vals.forEach(v => allTags[axis].add(v));
      });
    }
  });
  
  if (Object.keys(allTags).length > 0) {
    console.log(`\n🏷️  COMBINED TAGS:`);
    Object.entries(allTags).forEach(([axis, values]) => {
      console.log(`   ${axis}: ${[...values].join(', ')}`);
    });
  }
  
  console.log(`\n💡 AI PROMPT:\n   ${formatAsPrompt(combo)}`);
}

function main() {
  const args = process.argv.slice(2);
  let count = 1;
  let asPrompt = false;
  
  args.forEach(arg => {
    if (arg.startsWith('--count=')) {
      count = parseInt(arg.split('=')[1], 10);
    }
    if (arg === '--prompt') {
      asPrompt = true;
    }
  });
  
  const db = loadDatabase();
  
  console.log(`\n🌈 PSYCHEDELIC COLLAGE COMBINATION GENERATOR 🌈\n`);
  console.log(`Generating ${count} random combination(s)...\n`);
  
  for (let i = 1; i <= count; i++) {
    const combo = generateCombination(db);
    displayCombination(combo, i, asPrompt);
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Psychedelic Collage Combination Generator

Generates random combinations of styles, palettes, techniques, and more
from the database for inspiration or AI prompt generation.

Usage:
  node tools/generate.js [options]

Options:
  --count=<n>     Generate n combinations (default: 1)
  --prompt        Output as concise AI image prompts
  --help, -h      Show this help message

Examples:
  node tools/generate.js
  node tools/generate.js --count=10
  node tools/generate.js --count=5 --prompt
  `);
  process.exit(0);
}

main();
