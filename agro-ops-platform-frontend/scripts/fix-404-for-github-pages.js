/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../out');
const indexPath = path.join(outDir, 'index.html');
const notFoundPath = path.join(outDir, '404.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found. Build the project first.');
  process.exit(1);
}

console.log('Copying index.html to 404.html for GitHub Pages routing support...');

try {
  // Read index.html
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Write to 404.html
  fs.writeFileSync(notFoundPath, indexContent, 'utf-8');
  
  console.log('✓ 404.html created successfully');
  console.log('  GitHub Pages will now serve the app for all routes, enabling client-side routing.');
} catch (error) {
  console.error('Error creating 404.html:', error.message);
  process.exit(1);
}

