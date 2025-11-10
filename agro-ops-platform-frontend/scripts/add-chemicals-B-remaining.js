// Script to generate the remaining chemicals starting with Б
const chemicals = require('/tmp/chemicals-B.json');
const fs = require('fs');

// Chemicals already added (first 30)
const alreadyAdded = [
  'БАЗАГРАН 480СЛ', 'БАЗАМИД ГРАНУЛАТ', 'БАНДЖО/ ДИРАНГО', 
  'БАРИТОН СУПЕР 97.5 ФС', 'БАТЕРИ', 'БАТЪЛ ДЕЛТА/  НУКЛЕУС',
  'БАУНТИ', 'БАЯ', 'БЕЛЕМ 0,8 МГ/ КОЛОМБО 0,8 МГ',
  'БЕЛИС', 'БЕЛКАР', 'БЕЛКАР МЕГА', 'БЕЛПРОЙЛ-А', 'БЕЛТАНОЛ',
  'БЕЛТИРУЛ', 'БЕЛУКА'
];

// Get remaining chemicals (skip first 30 entries)
const remaining = chemicals.slice(30);

console.log(`Remaining chemicals to add: ${remaining.length}`);
console.log(`\nFirst 10 remaining:`);
remaining.slice(0, 10).forEach((c, i) => {
  console.log(`${i+31}. ${c.name} - ${c.dose}`);
});

// Export remaining for manual addition
fs.writeFileSync('/tmp/chemicals-B-remaining.json', JSON.stringify(remaining, null, 2));
console.log(`\nExported remaining ${remaining.length} chemicals to /tmp/chemicals-B-remaining.json`);

