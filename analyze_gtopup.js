const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gametopup/gametopup backend/list api wepay.txt', 'utf8'));

if (data.data.gtopup) {
    console.log('--- GTOPUP ANALYSIS ---');
    data.data.gtopup.forEach(game => {
        console.log(`ID: ${game.company_id} | Name: ${game.company_name}`);
    });
    console.log('\n--- SAMPLE GAME OBJECT DATA ---');
    console.log(JSON.stringify(data.data.gtopup[0], null, 2));
} else {
    console.log('No gtopup data found.');
}
