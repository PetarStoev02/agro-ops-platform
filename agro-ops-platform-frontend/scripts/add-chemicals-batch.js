const fs = require('fs');
const missingChemicals = JSON.parse(fs.readFileSync('/tmp/missing-chemicals.json', 'utf-8'));

// Normalize danger types (capitalize first letter)
function normalizeDangerTypes(dangerTypes) {
  return dangerTypes.map(dt => {
    const trimmed = dt.trim();
    if (!trimmed) return null;
    // Capitalize first letter
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }).filter(Boolean);
}

// Clean and normalize chemicals
const cleanedChemicals = missingChemicals.map(chem => {
  // Normalize dose - remove extra spaces, normalize dashes
  let dose = chem.dose.trim().replace(/\s+/g, ' ');
  dose = dose.replace(/–/g, '-'); // Replace en-dash with hyphen
  dose = dose.replace(/—/g, '-'); // Replace em-dash with hyphen
  
  // Normalize name
  const name = chem.name.trim();
  
  // Normalize danger types
  const dangerTypes = normalizeDangerTypes(chem.dangerTypes);
  
  if (dangerTypes.length === 0) {
    console.warn(`Warning: ${name} has no danger types, skipping`);
    return null;
  }
  
  return { name, dose, dangerTypes };
}).filter(Boolean);

console.log(`Total chemicals to process: ${cleanedChemicals.length}`);
console.log(`Sample cleaned:`, cleanedChemicals.slice(0, 5));

// Group by name to determine primary entries
const byName = new Map();
cleanedChemicals.forEach(chem => {
  if (!byName.has(chem.name)) {
    byName.set(chem.name, []);
  }
  byName.get(chem.name).push(chem);
});

// Mark first entry of each name as primary
const withPrimary = cleanedChemicals.map((chem, index) => {
  const sameName = byName.get(chem.name);
  const isFirst = sameName[0] === chem;
  return {
    ...chem,
    isPrimary: isFirst,
  };
});

// Export for batch import
fs.writeFileSync('/tmp/cleaned-chemicals.json', JSON.stringify(withPrimary, null, 2));
console.log(`\nExported ${withPrimary.length} cleaned chemicals to /tmp/cleaned-chemicals.json`);

// Show statistics
const stats = {
  total: withPrimary.length,
  primary: withPrimary.filter(c => c.isPrimary).length,
  byDangerType: {},
};

withPrimary.forEach(chem => {
  chem.dangerTypes.forEach(dt => {
    stats.byDangerType[dt] = (stats.byDangerType[dt] || 0) + 1;
  });
});

console.log('\nStatistics:');
console.log(`Total: ${stats.total}`);
console.log(`Primary entries: ${stats.primary}`);
console.log(`Secondary entries: ${stats.total - stats.primary}`);
console.log('\nBy danger type:');
Object.entries(stats.byDangerType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

module.exports = { chemicals: withPrimary };

