const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gametopup/gametopup backend/list api wepay.txt', 'utf8'));
console.log('Top level keys:', Object.keys(data.data));
