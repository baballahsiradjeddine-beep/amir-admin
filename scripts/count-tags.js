const fs = require('fs');
const content = fs.readFileSync('d:/bossamir/app/dashboard/page.tsx', 'utf8');

function count(regex) {
    return (content.match(regex) || []).length;
}

console.log('Open Divs:', count(/<div(\s|>)/g));
console.log('Close Divs:', count(/<\/div>/g));
console.log('Open Braces:', count(/\{/g));
console.log('Close Braces:', count(/\}/g));
console.log('Open Parens:', count(/\(/g));
console.log('Close Parens:', count(/\)/g));
console.log('Open Fragment:', count(/<>/g));
console.log('Close Fragment:', count(/<\/>/g));
