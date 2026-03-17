const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gametopup/gametopup backend/list api wepay.txt', 'utf8'));

if (data.data.gtopup) {
    console.log('--- DETAILED GTOPUP ANALYSIS ---');
    data.data.gtopup.forEach(game => {
        const needsServer = game.gameservers && game.gameservers.length > 0;
        const refs = Object.keys(game.refs_format || {});
        const additionalRefs = refs.filter(r => r !== 'ref1');
        
        if (needsServer || additionalRefs.length > 0) {
            console.log(`[EXTRA INFO NEEDED]`);
        } else {
            console.log(`[UID ONLY]`);
        }
        console.log(`Game: ${game.company_name} (${game.company_id})`);
        if (needsServer) {
            console.log(`  - Servers: ${game.gameservers.map(s => s.name).join(', ')}`);
        }
        if (additionalRefs.length > 0) {
            console.log(`  - Additional Fields: ${additionalRefs.join(', ')}`);
        }
        console.log('-----------------------------------');
    });
}
