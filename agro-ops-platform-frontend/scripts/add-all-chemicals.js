// Script to add all missing chemicals from CSV
// This will be run via Convex CLI or through the admin interface

const fs = require('fs');
const chemicals = require('/tmp/cleaned-chemicals.json');

console.log(`Total chemicals to add: ${chemicals.length}`);
console.log(`\nThis script prepares the data for batch import.`);
console.log(`\nTo add these chemicals, you have two options:`);
console.log(`1. Use the admin interface at /admin/import-chemicals`);
console.log(`2. Convert CSV to Excel and use the importFromExcel action`);
console.log(`3. Add them programmatically using the insertChemical mutation`);

// Export as JSON for manual import or programmatic processing
fs.writeFileSync('/tmp/all-chemicals-to-add.json', JSON.stringify(chemicals, null, 2));
console.log(`\nExported all chemicals to /tmp/all-chemicals-to-add.json`);

// Show summary
const stats = {
  total: chemicals.length,
  byDangerType: {},
  uniqueNames: new Set(),
};

chemicals.forEach(chem => {
  stats.uniqueNames.add(chem.name);
  chem.dangerTypes.forEach(dt => {
    stats.byDangerType[dt] = (stats.byDangerType[dt] || 0) + 1;
  });
});

console.log(`\nSummary:`);
console.log(`  Total entries: ${stats.total}`);
console.log(`  Unique chemical names: ${stats.uniqueNames.size}`);
console.log(`\nBy danger type:`);
Object.entries(stats.byDangerType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

