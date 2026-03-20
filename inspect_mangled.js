
import fs from 'fs';

const content = fs.readFileSync('d:/gametopup/gametopup frontend/src/pages/PremiumApp.tsx');
console.log('PremiumApp.tsx mangled region (line 79 area):');
const index = content.toString().indexOf('title: "');
if (index !== -1) {
    const slice = content.slice(index, index + 200);
    console.log(slice.toString('hex'));
    console.log(slice.toString('utf8'));
}
