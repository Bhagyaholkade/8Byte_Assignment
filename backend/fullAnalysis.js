const xlsx = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'E555815F_58D029050B.xlsx');
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet);

console.log('Total rows in Excel:', rawData.length);
console.log('\n=== CHECKING ALL ROWS FOR SECTORS ===\n');

let sectorCount = 0;
const sectors = [];

rawData.forEach((row, index) => {
    const col1 = row.__EMPTY;
    const col2 = row.__EMPTY_1;

    // More flexible sector detection
    const col2Str = col2 ? col2.toString().toLowerCase() : '';

    // Check if this looks like a sector header
    if (col2Str.includes('sector')) {
        sectorCount++;
        sectors.push({
            row: index,
            name: col2,
            col1: col1,
            hasCol1: !!col1
        });
        console.log(`Sector ${sectorCount}: "${col2}" at row ${index} (col1: ${col1 || 'empty'})`);
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total sectors found: ${sectorCount}`);
console.log(`Sector names:`, sectors.map(s => s.name));
