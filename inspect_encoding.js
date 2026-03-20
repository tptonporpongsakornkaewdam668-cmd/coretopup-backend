
import fs from 'fs';

const content = fs.readFileSync('d:/gametopup/gametopup frontend/index.html');
console.log('index.html title region:');
const titleLine = content.toString().indexOf('<title>');
if (titleLine !== -1) {
    const slice = content.slice(titleLine, titleLine + 100);
    console.log(slice.toString('hex'));
    console.log(slice.toString('utf8'));
}
