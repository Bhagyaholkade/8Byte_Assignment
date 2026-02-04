const parser = require('./dataParser.js');

console.log('\n=== TESTING IMPROVED PARSER ===\n');

const stocks = parser.parseExcelData();
const sectors = {};

stocks.forEach(s => {
    if (!sectors[s.sector]) sectors[s.sector] = 0;
    sectors[s.sector]++;
});

console.log('\n=== RESULTS ===');
console.log('Total stocks parsed:', stocks.length);
console.log('Total sectors found:', Object.keys(sectors).length);
console.log('\nSector distribution:');
Object.entries(sectors).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} stocks`);
});
