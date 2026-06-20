const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../Week_4_AI_Analytics_Capstone_Portfolio_Readiness.pptx (1).pdf');
console.log('Reading PDF from:', pdfPath);

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    // number of pages
    console.log('Total Pages:', data.numpages);
    // pdf text
    fs.writeFileSync(path.join(__dirname, 'pdf_content.txt'), data.text);
    console.log('Successfully wrote PDF content to scratch/pdf_content.txt');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
