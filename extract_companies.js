const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gametopup/gametopup backend/list api wepay.txt', 'utf8'));

console.log('--- MTOPUP ---');
data.data.mtopup?.forEach(item => {
    console.log(`${item.company_id}: ${item.company_name}`);
});

console.log('--- CASHCARD ---');
data.data.cashcard?.forEach(item => {
    console.log(`${item.company_id}: ${item.company_name}`);
});

console.log('--- GAMEPAY ---');
data.data.gamepay?.forEach(item => {
    console.log(`${item.company_id}: ${item.company_name}`);
});

console.log('--- BILLPAY ---');
data.data.billpay?.forEach(item => {
    console.log(`${item.company_id}: ${item.company_name}`);
});
