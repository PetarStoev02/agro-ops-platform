const { chemicals } = require('./import-chemicals-from-csv');

// Existing chemicals from database (you'll need to provide this)
// For now, I'll create a script that outputs what needs to be added

// Normalize function to compare chemicals
function normalizeChemical(chem) {
  return {
    name: chem.name.trim(),
    dose: chem.dose.trim().replace(/\s+/g, ' '),
    dangerTypes: chem.dangerTypes.sort(),
  };
}

// Create a set of existing chemicals for quick lookup
// Format: "name|dose|dangerTypes"
function createKey(chem) {
  const normalized = normalizeChemical(chem);
  return `${normalized.name}|${normalized.dose}|${normalized.dangerTypes.join(',')}`;
}

// Sample existing chemicals (you'll need to get all from database)
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

const existingSet = new Set(existingChemicals.map(createKey));

// Find missing chemicals
const missingChemicals = chemicals.filter(chem => {
  const key = createKey(chem);
  return !existingSet.has(key);
});

console.log(`Total chemicals in CSV: ${chemicals.length}`);
console.log(`Existing chemicals: ${existingChemicals.length}`);
console.log(`Missing chemicals: ${missingChemicals.length}`);
console.log(`\nFirst 20 missing chemicals:`);
missingChemicals.slice(0, 20).forEach((chem, i) => {
  console.log(`${i + 1}. ${chem.name} - ${chem.dose} - [${chem.dangerTypes.join(', ')}]`);
});

// Export missing chemicals for batch import
module.exports = { missingChemicals };

