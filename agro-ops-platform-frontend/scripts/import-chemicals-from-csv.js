const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, '../public/PPP+Register_BFSA+27.10.2025.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV - handle multi-line fields
const lines = csvContent.split('\n');
const rows = [];
let currentRow = [];
let inQuotedField = false;
let currentField = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      inQuotedField = !inQuotedField;
    } else if (char === ';' && !inQuotedField) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (!inQuotedField) {
    // End of row
    if (currentField) {
      currentRow.push(currentField.trim());
      currentField = '';
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
    }
  } else {
    // Multi-line field, add newline
    currentField += '\n';
  }
}

// Extract unique chemicals
const chemicalsMap = new Map();

// Skip header row
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  
  if (row.length < 11) continue;
  
  const productName = row[2]?.trim(); // Продукт
  const dose = row[5]?.trim(); // Доза/дка
  const functionType = row[10]?.trim(); // Функция
  const status = row[13]?.trim(); // Статус на запис
  
  // Only process ACTIVE entries
  if (!productName || !dose || !functionType || status !== 'ACTIVE') {
    continue;
  }
  
  // Normalize dose (remove extra spaces)
  const normalizedDose = dose.replace(/\s+/g, ' ');
  
  // Parse function type - can be like "Инсектицид / Акарицид" or "Фунгицид" etc.
  const dangerTypes = functionType
    .split(/[\/,]/)
    .map(t => t.trim())
    .filter(t => t && t !== 'със системно действие' && t !== 'с несистемно действие' && !t.includes('действие'))
    .map(t => {
      // Map common variations
      if (t.includes('Инсектицид')) return 'Инсектицид';
      if (t.includes('Акарицид')) return 'Акарицид';
      if (t.includes('Фунгицид')) return 'Фунгицид';
      if (t.includes('Хербицид')) return 'Хербицид';
      if (t.includes('Десикант')) return 'Десикант';
      if (t.includes('Растежен регулатор')) return 'Растежен регулатор';
      return t;
    })
    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  
  if (dangerTypes.length === 0) {
    // Fallback to original if no mapping found
    dangerTypes.push(functionType);
  }
  
  const key = `${productName}|${normalizedDose}`;
  
  if (!chemicalsMap.has(key)) {
    chemicalsMap.set(key, {
      name: productName,
      dose: normalizedDose,
      dangerTypes: dangerTypes,
    });
  } else {
    // Merge danger types if same product+dose has different types
    const existing = chemicalsMap.get(key);
    const mergedTypes = [...new Set([...existing.dangerTypes, ...dangerTypes])];
    chemicalsMap.set(key, {
      ...existing,
      dangerTypes: mergedTypes,
    });
  }
}

// Convert to array and sort
const chemicals = Array.from(chemicalsMap.values()).sort((a, b) => {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  if (a.dose < b.dose) return -1;
  if (a.dose > b.dose) return 1;
  return 0;
});

console.log(`Found ${chemicals.length} unique chemicals in CSV`);
console.log(`Sample:`, chemicals.slice(0, 5));

// Export for use in import script
module.exports = { chemicals };

