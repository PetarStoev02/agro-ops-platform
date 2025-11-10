const { chemicals } = require('./import-chemicals-from-csv');

// Existing chemicals from database (normalized)
const existingChemicals = [
  { name: '1,4 САЙТ', dose: '20 мл/1000 кг картофи', dangerTypes: ['Растежен регулатор'] },
  { name: 'АБАНТО (пиретрини 40 г/л)', dose: '60 мл/дка', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АБАНТО (пиретрини 40 г/л)', dose: '75 мл/дка', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'пириметанил-400 г/л', dose: '200 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АВАСТЕЛ ЕК', dose: '100-125 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АВИАТОР ЕКСПРО 225 ЕК', dose: '60-100 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АВИАТОР ЕКСПРО 225 ЕК', dose: '80-125 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АГИКСА', dose: '200-250 мл/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРИТОКС', dose: '100-150 мл/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРОКСОН 500 СЛ', dose: '100 мл продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРОКСОН 500 СЛ', dose: '120 мл продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРОКСОН 500 СЛ', dose: '160-200 мл продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРОКСОН 500 СЛ', dose: '160 мл продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРОКСОН 500 СЛ', dose: '240-320 мл продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АГРОКСОН 500 СЛ', dose: '240 мл продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АЗАКА', dose: '100 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АЗАТИН ЕК', dose: '100-150 мл продукт/дка', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АЗТЕК 250 ЕК', dose: '100-150 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АКРИС', dose: '200-300 мл/дка', dangerTypes: ['Хербицид'] },
  { name: 'АКТЕЛИК 50 ЕК', dose: '0,15 мл/м3', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АКТЕЛИК 50 ЕК', dose: '100 мл/100 м2', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АКТЕЛИК 50 ЕК', dose: '8 мл/1 тон', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АЛАЙ МАКС/ПОЙНТЕР УЛТРА', dose: '3,5 г продукт/дка', dangerTypes: ['Хербицид'] },
  { name: 'АЛГОН', dose: '100-150 мл/дка', dangerTypes: ['Фунгицид'] },
  { name: 'АЛФА СУПЕР', dose: '10-15 мл/дка', dangerTypes: ['Инсектицид'] },
  { name: 'АЛФА СУПЕР ЕК', dose: '10-15 мл/дка', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АЛФАГАРД 100 ЕК', dose: '10-15 мл/дка', dangerTypes: ['Инсектицид', 'Акарицид'] },
  { name: 'АЛФАМЕТРИН 100 ЕК', dose: '10-15 мл/дка', dangerTypes: ['Инсектицид', 'Акарицид'] },
];

// Normalize function
function normalize(chem) {
  return {
    name: chem.name.trim(),
    dose: chem.dose.trim().replace(/\s+/g, ' '),
    dangerTypes: [...new Set(chem.dangerTypes.map(dt => dt.trim()).filter(Boolean))].sort(),
  };
}

// Create comparison key
function createKey(chem) {
  const norm = normalize(chem);
  return `${norm.name}|${norm.dose}|${norm.dangerTypes.join(',')}`;
}

// Build set of existing
const existingSet = new Set(existingChemicals.map(createKey));

// Find missing - use flexible matching (check if name+dose exists, even if danger types differ slightly)
const missingChemicals = chemicals.filter(chem => {
  const norm = normalize(chem);
  const key = createKey(chem);
  
  // Exact match
  if (existingSet.has(key)) return false;
  
  // Check if same name+dose exists (different danger types are OK, will be added as secondary)
  const nameDoseKey = `${norm.name}|${norm.dose}`;
  const existingNameDose = existingChemicals.some(ex => {
    const exNorm = normalize(ex);
    return `${exNorm.name}|${exNorm.dose}` === nameDoseKey;
  });
  
  // If name+dose exists, we might skip it or add as variant
  // For now, let's add all that don't have exact match
  return true; // Add all for now, let the system handle duplicates
});

console.log(`Total in CSV: ${chemicals.length}`);
console.log(`Existing in DB: ${existingChemicals.length}`);
console.log(`To add: ${missingChemicals.length}`);

// Export first 100 for testing
const toAdd = missingChemicals.slice(0, 100);
console.log(`\nFirst 10 to add:`);
toAdd.slice(0, 10).forEach((chem, i) => {
  console.log(`${i + 1}. ${chem.name} - ${chem.dose} - [${chem.dangerTypes.join(', ')}]`);
});

// Export all missing for batch processing
const fs = require('fs');
fs.writeFileSync('/tmp/missing-chemicals.json', JSON.stringify(missingChemicals, null, 2));
console.log(`\nExported ${missingChemicals.length} missing chemicals to /tmp/missing-chemicals.json`);

module.exports = { missingChemicals };

