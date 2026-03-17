const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gametopup/gametopup backend/list api wepay.txt', 'utf8'));

if (data.data.gamepay) {
    console.log('--- GAMEPAY ANALYSIS ---');
    data.data.gamepay.forEach(game => {
        console.log(`ID: ${game.company_id} | Name: ${game.company_name}`);
        // Let's see what attributes each game object has to identify requirement
        // I'll log keys of the first game object to understand the structure
    });
    console.log('\n--- SAMPLE GAME OBJECT KEYS ---');
    console.log(Object.keys(data.data.gamepay[0]));
    console.log('\n--- SAMPLE GAME OBJECT DATA ---');
    console.log(JSON.stringify(data.data.gamepay[0], null, 2));
} else {
    console.log('No gamepay data found.');
}
