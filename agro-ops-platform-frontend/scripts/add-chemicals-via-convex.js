// This script will be used to add chemicals via Convex
// For now, it just prepares the data

const chemicals = require('/tmp/cleaned-chemicals.json');
const now = Date.now();

// Prepare chemicals for insertion
const prepared = chemicals.map(chem => ({
  name: chem.name,
  dose: chem.dose,
  dangerTypes: chem.dangerTypes,
  isPrimary: chem.isPrimary,
  createdAt: now,
  updatedAt: now,
}));

console.log(`Prepared ${prepared.length} chemicals for insertion`);
console.log(`\nFirst 10:`);
prepared.slice(0, 10).forEach((c, i) => {
  console.log(`${i + 1}. ${c.name} - ${c.dose} - [${c.dangerTypes.join(', ')}] - Primary: ${c.isPrimary}`);
});

// Export in batches of 50
const batchSize = 50;
const batches = [];
for (let i = 0; i < prepared.length; i += batchSize) {
  batches.push(prepared.slice(i, i + batchSize));
}

console.log(`\nTotal batches: ${batches.length}`);
console.log(`Batch sizes: ${batches.map(b => b.length).join(', ')}`);

// Save batches
const fs = require('fs');
batches.forEach((batch, i) => {
  fs.writeFileSync(`/tmp/batch-${i + 1}.json`, JSON.stringify(batch, null, 2));
});

console.log(`\nSaved ${batches.length} batches to /tmp/batch-*.json`);

