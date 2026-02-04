const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function testPdf() {
    const dataBuffer = fs.readFileSync('../9E4CFEB1_6312189665.pdf');
    try {
        console.log('Testing as function...');
        const res = await pdf(dataBuffer);
        console.log('Success (func):', res.text.substring(0, 500));
    } catch (e) {
        console.log('Fail (func):', e.message);
        try {
            console.log('Testing as .default...');
            const res = await pdf.default(dataBuffer);
            console.log('Success (.default):', res.text.substring(0, 500));
        } catch (e2) {
            console.log('Fail (.default):', e2.message);
            try {
                console.log('Testing as .PDFParse...');
                const res = await pdf.PDFParse(dataBuffer);
                console.log('Success (.PDFParse):', res.text.substring(0, 500));
            } catch (e3) {
                console.log('Fail (.PDFParse):', e3.message);
            }
        }
    }
}
testPdf();
