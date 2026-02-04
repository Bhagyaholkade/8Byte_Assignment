const pdf = require('pdf-parse');
console.log('PDF export:', pdf);
console.log('PDF keys:', Object.keys(pdf));
if (typeof pdf === 'function') {
    console.log('It is a function!');
} else if (pdf.default && typeof pdf.default === 'function') {
    console.log('It has a default function!');
} else {
    console.log('Neither is a function.');
}
