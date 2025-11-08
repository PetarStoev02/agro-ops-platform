/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

// Path to the original template
const templatePath = path.join(
  __dirname,
  "..",
  "src",
  "shared",
  "assets",
  "Дневник+за+проведени+РЗ+мероприятия+и+торене (2).docx"
);

// Read the template
const templateBuffer = fs.readFileSync(templatePath);
const zip = new PizZip(templateBuffer);
const doc = zip.files["word/document.xml"].asText();

// Map of text patterns to replace with docxtemplater variables
// We need to work with XML structure, so we'll look for text nodes containing dots
const replacements = [
  {
    // Община followed by dots
    // In XML, this might be in separate text nodes, so we look for the pattern across tags
    pattern: /(Община[^<]*)(<w:t[^>]*>)(\.{10,})(<\/w:t>)/g,
    replacement: "$1$2{municipality}$4",
    description: "Община",
  },
  {
    // Населено място
    pattern: /(Населено място[^<]*)(<w:t[^>]*>)(\.{10,})(<\/w:t>)/g,
    replacement: "$1$2{settlement}$4",
    description: "Населено място",
  },
  {
    // Земеделски производител
    pattern: /(Земеделски производител[^<]*)(<w:t[^>]*>)(\.{10,})(<\/w:t>)/g,
    replacement: "$1$2{farm_name}$4",
    description: "Земеделски производител",
  },
  {
    // Адрес
    pattern: /(Адрес[^<]*)(<w:t[^>]*>)(\.{10,})(<\/w:t>)/g,
    replacement: "$1$2{address}$4",
    description: "Адрес",
  },
  {
    // Областна дирекция "Земеделие"
    pattern: /(Областна дирекция[^<]*[""]Земеделие[""][^<]*гр[^<]*)(<w:t[^>]*>)(\.{10,})(<\/w:t>)/g,
    replacement: "$1$2{agriculture_directorate}$4",
    description: "Областна дирекция Земеделие",
  },
  {
    // ЕКАТТЕ на регистрация
    pattern: /(ЕКАТТЕ на регистрация[^<]*)(<w:t[^>]*>)(\.{5,}|[\s]{5,})(<\/w:t>)/g,
    replacement: "$1$2{ekatte}$4",
    description: "ЕКАТТЕ на регистрация",
  },
  {
    // ОДБХ
    pattern: /(Областна дирекция по безопасност на храните[^<]*ОДБХ[^<]*гр[^<]*)(<w:t[^>]*>)(\.{10,})(<\/w:t>)/g,
    replacement: "$1$2{odbh}$4",
    description: "ОДБХ",
  },
];

// Patterns that work with the actual XML structure
// Text and dots are in the same <w:t> element
const simpleReplacements = [
  {
    // Община followed by dots in the same text node
    pattern: /(<w:t[^>]*>)(Община\s+)(\.{20,})(\s*<\/w:t>)/g,
    replacement: "$1$2{municipality}$4",
    description: "Община",
  },
  {
    // Населено място - might have different spacing
    // This pattern should catch it on page 1
    pattern: /(<w:t[^>]*>)(Населено място\s+)(\.{20,})(\s*<\/w:t>)/g,
    replacement: "$1$2{settlement}$4",
    description: "Населено място (page 1)",
  },
  {
    // Населено място - alternative pattern with more flexible spacing
    pattern: /(<w:t[^>]*>)(Населено място[^<]*?)(\.{15,})(\s*<\/w:t>)/g,
    replacement: "$1$2{settlement}$4",
    description: "Населено място (flexible)",
  },
  {
    pattern: /(<w:t[^>]*>)(Земеделски производител[^<]*?)(\.{15,})(\s*<\/w:t>)/g,
    replacement: "$1$2{farm_name}$4",
    description: "Земеделски производител",
  },
  {
    // Адрес - might not have period or have different spacing
    pattern: /(<w:t[^>]*>)(Адрес[^<]*?)(\.{15,})(\s*<\/w:t>)/g,
    replacement: "$1$2{address}$4",
    description: "Адрес",
  },
  {
    // Областна дирекция "Земеделие" гр. - find "гр." followed by dots
    // Look for "гр." with dots in any text node, but only if it appears after "Земеделие" in the document
    // Simple approach: find "гр." with dots that appears in context of "Земеделие"
    pattern: /(<w:t[^>]*>)(гр\.\s+)(\.{10,})(\s*<\/w:t>)/g,
    replacement: function(match, p1, p2, p3, p4, offset, string) {
      // Check if this "гр." appears after "Земеделие" in the document
      const beforeMatch = string.substring(Math.max(0, offset - 200), offset);
      if (beforeMatch.includes('Земеделие') && !beforeMatch.includes('ОДБХ')) {
        return p1 + p2 + '{agriculture_directorate}' + p4;
      }
      return match; // Don't replace if not in right context
    },
    description: "Областна дирекция Земеделие",
  },
  {
    // ЕКАТТЕ на регистрация - text is split across multiple nodes
    // Add variable right after "регистрация" text node closes
    pattern: /(регистрация[^<]*<\/w:t>[^<]*<\/w:r>[^<]*<\/w:p>)/g,
    replacement: "$1<w:p><w:r><w:t>{ekatte}</w:t></w:r></w:p>",
    description: "ЕКАТТЕ на регистрация (add after)",
  },
  {
    // ОДБХ - "гр." and dots are in same text node with xml:space="preserve"
    pattern: /(<w:t[^>]*xml:space="preserve"[^>]*>)(\s*гр\.\s+)(\.{10,})(\s*<\/w:t>)/g,
    replacement: "$1$2{odbh}$4",
    description: "ОДБХ (with xml:space)",
  },
  {
    // ОДБХ - alternative pattern if "гр." and dots are in separate text node
    pattern: /(ОДБХ[^<]*<\/w:t>[^<]*<w:t[^>]*>гр\.\s+)(\.{10,})(\s*<\/w:t>)/g,
    replacement: "$1{odbh}$3",
    description: "ОДБХ (separate node)",
  },
];

// Page 2 field variables - these appear after "ПОЯВА, РАЗВИТИЕ"
const page2Replacements = [
  {
    // № на полето според единния регистър на площите - dots are split across multiple nodes
    // Structure: text with dots, then </w:t></w:r><w:r>...<w:t>....</w:t>...<w:t>.....</w:t>
    pattern: /(№ на полето според единния регистър на площите[^<]*)(\.{10,})(<\/w:t>[^<]*<w:r[^>]*>[^<]*<w:t[^>]*>)(\.{3,})(<\/w:t>[^<]*<w:r[^>]*>[^<]*<w:t[^>]*>)(\.{3,})(<\/w:t>)/g,
    replacement: "$1{field_number}$3$7",
    description: "№ на полето (split nodes)",
  },
  {
    // Alternative: if all dots are in single text node
    pattern: /(<w:t[^>]*>)(№ на полето според единния регистър на площите[^<]*?)(\.{15,})(<\/w:t>)/g,
    replacement: "$1$2{field_number}$4",
    description: "№ на полето (single node)",
  },
  {
    // Култура
    pattern: /(<w:t[^>]*>)(Култура[^<]*?)(\.{15,})(\s*<\/w:t>)/g,
    replacement: "$1$2{crop_type}$4",
    description: "Култура",
  },
  {
    // Сорт/хибрид
    pattern: /(<w:t[^>]*>)(Сорт\/хибрид[^<]*?)(\.{15,})(\s*<\/w:t>)/g,
    replacement: "$1$2{variety}$4",
    description: "Сорт/хибрид",
  },
  {
    // Засята площ (дка)
    pattern: /(<w:t[^>]*>)(Засята площ\s*\(дка\)[^<]*?)(\.{10,})(\s*<\/w:t>)/g,
    replacement: "$1$2{area}$4",
    description: "Засята площ (дка)",
  },
  {
    // Предшественик
    pattern: /(<w:t[^>]*>)(Предшественик[^<]*?)(\.{15,})(\s*<\/w:t>)/g,
    replacement: "$1$2{predecessor}$4",
    description: "Предшественик",
  },
];

// Apply replacements
let modifiedDoc = doc;
let replacementCount = 0;

// First try XML-aware replacements
for (const { pattern, replacement, description } of replacements) {
  const matches = modifiedDoc.match(pattern);
  if (matches) {
    replacementCount += matches.length;
    modifiedDoc = modifiedDoc.replace(pattern, replacement);
    console.log(`✅ Replaced ${matches.length} occurrence(s): ${description}`);
  }
}

// Apply simple replacements on XML structure
for (const { pattern, replacement, description } of simpleReplacements) {
  const beforeReplace = modifiedDoc;
  modifiedDoc = modifiedDoc.replace(pattern, replacement);
  if (beforeReplace !== modifiedDoc) {
    const matches = beforeReplace.match(pattern);
    replacementCount += matches ? matches.length : 1;
    console.log(`✅ Replaced: ${description}`);
  }
}

// Apply page 2 replacements
for (const { pattern, replacement, description } of page2Replacements) {
  const beforeReplace = modifiedDoc;
  modifiedDoc = modifiedDoc.replace(pattern, replacement);
  if (beforeReplace !== modifiedDoc) {
    const matches = beforeReplace.match(pattern);
    replacementCount += matches ? matches.length : 1;
    console.log(`✅ Replaced: ${description}`);
  }
}

// Check if there are still text nodes with many dots that weren't replaced
const dotPattern = /(<w:t[^>]*>)(\.{15,})(<\/w:t>)/g;
const dotMatches = modifiedDoc.match(dotPattern);
if (dotMatches && dotMatches.length > 0) {
  console.log(`\n⚠️  Found ${dotMatches.length} text node(s) with dots that weren't matched.`);
  console.log("   These might need manual variable assignment in the template.");
}

// Add loop syntax for inspections table (Table 3)
// NOTE: We're NOT modifying the table structure to avoid breaking XML
// Instead, we'll just add variables in the first data row
// The loop tags will be added manually or handled differently
const page2Start = modifiedDoc.indexOf("ПОЯВА, РАЗВИТИЕ");
if (page2Start > -1) {
  const table3Start = modifiedDoc.indexOf("<w:tbl>", page2Start);
  if (table3Start > -1) {
    const table3End = modifiedDoc.indexOf("</w:tbl>", table3Start);
    if (table3End > -1) {
      // Find the first data row positions in the full document
      const firstTrStart = modifiedDoc.indexOf('<w:tr', table3Start);
      const firstTrEnd = modifiedDoc.indexOf('</w:tr>', firstTrStart);
      const secondTrStart = modifiedDoc.indexOf('<w:tr', firstTrEnd + 6);
      const secondTrEnd = modifiedDoc.indexOf('</w:tr>', secondTrStart);
      
      if (firstTrStart > -1 && firstTrEnd > -1 && secondTrStart > -1 && secondTrEnd > -1) {
        // Get the first data row (complete with <w:tr> and </w:tr>)
        let firstDataRow = modifiedDoc.substring(secondTrStart, secondTrEnd + 6);
        
        // Replace numbers with variables - ONLY in text content, don't modify structure
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(1)(<\/w:t>)/g, "$1{#all_inspections}{serial_number}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(2)(<\/w:t>)/g, "$1{date}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(3)(<\/w:t>)/g, "$1{phenological_phase}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(4)(<\/w:t>)/g, "$1{disease}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(5)(<\/w:t>)/g, "$1{surveyed_area}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(6)(<\/w:t>)/g, "$1{attacked_area}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(7)(<\/w:t>)/g, "$1{attack_degree}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(8)(<\/w:t>)/g, "$1{pest}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(9)(<\/w:t>)/g, "$1{development_stages}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(10)(<\/w:t>)/g, "$1{density}$3");
        firstDataRow = firstDataRow.replace(/(<w:t[^>]*>)(11)(<\/w:t>)/g, "$1{/all_inspections}$3");
        
        // Replace the first data row - preserve exact structure
        modifiedDoc = modifiedDoc.substring(0, secondTrStart) + firstDataRow + modifiedDoc.substring(secondTrEnd + 6);
        
        console.log(`✅ Added loop syntax and variables for inspections table`);
        replacementCount++;
      }
    }
  }
}

// Validate XML structure before saving
const trOpenBefore = (modifiedDoc.match(/<w:tr[^>]*>/g) || []).length;
const trCloseBefore = (modifiedDoc.match(/<\/w:tr>/g) || []).length;

if (trOpenBefore !== trCloseBefore) {
  console.log(`\n⚠️  XML validation: Unbalanced table rows (${trOpenBefore} open, ${trCloseBefore} close)`);
  console.log("Note: Original template also has this issue, but Word can handle it.");
  console.log("docxtemplater requires valid XML, so this might cause issues.");
  // Don't try to fix automatically - it's too risky and might break more things
}

console.log(`\n📊 Total replacements: ${replacementCount}`);

// Update the document in the zip
zip.file("word/document.xml", modifiedDoc);

// Generate the new buffer
const newBuffer = zip.generate({
  type: "nodebuffer",
  compression: "DEFLATE",
});

// Convert to base64
const base64 = newBuffer.toString("base64");

// Generate the constant file content
const constantFileContent = `export const TEMPLATE_BASE64 = "${base64}";`;

// Write to the constant file
const outputPath = path.join(__dirname, "..", "convex", "templateBase64Constant.ts");
fs.writeFileSync(outputPath, constantFileContent, "utf-8");

console.log(`\n✅ Template updated successfully!`);
console.log(`📁 Output: ${outputPath}`);
console.log(`📊 Base64 length: ${base64.length} characters`);

