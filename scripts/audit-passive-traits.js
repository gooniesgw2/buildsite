#!/usr/bin/env node
/**
 * Audit script to find passive traits with stat bonuses
 * Run this after balance patches to update the PASSIVE_STAT_TRAITS whitelist
 *
 * Usage: node scripts/audit-passive-traits.js
 */

const traits = require('../public/data/traits.json');
const specs = require('../public/data/specializations.json');

// Traits with AttributeAdjust facts
const traitsWithStats = traits.filter(t =>
  t.facts && t.facts.some(f => f.type === 'AttributeAdjust')
);

console.log(`Found ${traitsWithStats.length} traits with AttributeAdjust facts\n`);

// Keywords that indicate conditional bonuses
const conditionalKeywords = [
  'while', 'when', 'wielding', 'with a', 'under', 'above', 'below',
  'threshold', 'against', 'on foes', 'on strike', 'per ', 'based on',
  'affected by', 'during', 'grants', 'gain ', 'attuned to', 'in shroud',
  'each ', 'for each', 'if ', 'using', 'equipped', 'activat', 'combat only'
];

// Separate into likely passive and likely conditional
const likelyPassive = [];
const likelyConditional = [];

traitsWithStats.forEach(t => {
  const desc = (t.description || '').toLowerCase();

  // Check if description has 'is increased' or 'are increased' without conditions
  const hasIncreased = desc.includes('is increased') || desc.includes('are increased');
  const hasConditionalKeyword = conditionalKeywords.some(kw => desc.includes(kw));

  const statFacts = t.facts.filter(f => f.type === 'AttributeAdjust');
  const stats = statFacts.map(f => `+${f.value} ${f.target}`).join(', ');

  const spec = specs.find(s => s.id === t.specialization);
  const specName = spec ? spec.name : 'Unknown';
  const profession = spec ? spec.profession : 'Unknown';
  const isMinor = spec?.minor_traits?.includes(t.id);

  const traitInfo = {
    id: t.id,
    name: t.name,
    spec: specName,
    profession,
    stats,
    description: t.description,
    isMinor,
    hasIncreased,
    hasConditionalKeyword
  };

  if (hasIncreased && !hasConditionalKeyword) {
    likelyPassive.push(traitInfo);
  } else if (hasConditionalKeyword) {
    likelyConditional.push(traitInfo);
  } else {
    // Ambiguous - might need manual review
    likelyConditional.push(traitInfo);
  }
});

console.log('='.repeat(80));
console.log('LIKELY PASSIVE TRAITS (review and add to whitelist)');
console.log('='.repeat(80));
console.log();

likelyPassive.forEach(t => {
  const type = t.isMinor ? '[MINOR]' : '[MAJOR]';
  console.log(`${t.id}, // ${type} ${t.name} (${t.profession} - ${t.spec}): ${t.stats}`);
});

console.log('\n');
console.log('='.repeat(80));
console.log('CURRENT WHITELIST (from statCalculator.ts)');
console.log('='.repeat(80));
console.log();
console.log('Copy the IDs from "LIKELY PASSIVE TRAITS" above and update:');
console.log('src/lib/statCalculator.ts -> PASSIVE_STAT_TRAITS array');
console.log();
console.log('Note: Always manually verify traits before adding to the whitelist!');
console.log('Check the trait description to ensure there are no hidden conditions.');
