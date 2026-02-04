const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'E555815F_58D029050B.xlsx');
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet);

console.log('Total rows:', rawData.length);
console.log('\n=== Looking for Sector Headers ===\n');

rawData.forEach((row, index) => {
    // Check various conditions that might indicate a sector header
    const col1 = row.__EMPTY;
    const col2 = row.__EMPTY_1;

    // Log rows that might be sector headers
    if (col2 && col2.toString().toLowerCase().includes('sector')) {
        console.log(`Row ${index}:`);
        console.log(`  __EMPTY: "${col1}"`);
        console.log(`  __EMPTY_1: "${col2}"`);
        console.log(`  Full row keys:`, Object.keys(row).slice(0, 5));
        console.log('');
    }
});
