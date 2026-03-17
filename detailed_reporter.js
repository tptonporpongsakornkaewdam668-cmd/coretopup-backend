const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gametopup/gametopup backend/list api wepay.txt', 'utf8'));

let report = '--- DETAILED WEPAY API ANALYSIS ---\n\n';

if (data.data.gtopup) {
    report += 'CATEGORY: GTOPUP (Game Topup)\n';
    report += '===================================\n\n';
    
    data.data.gtopup.forEach(game => {
        const needsServer = game.gameservers && game.gameservers.length > 0;
        const refs = Object.keys(game.refs_format || {});
        
        // Check if refs include anything other than ref1
        // Usually ref1 is UID
        const additionalRefs = refs.filter(r => r !== 'ref1');
        
        // Some games have complex regex in ref1 that implies multiple values separated by space
        const ref1Format = game.refs_format ? game.refs_format.ref1 : '';
        const hasSpaceInRegex = ref1Format && ref1Format.includes(' ');
        
        let status = '';
        if (needsServer || additionalRefs.length > 0 || hasSpaceInRegex) {
            status = '[EXTRA INFO NEEDED]';
        } else {
            status = '[UID ONLY]';
        }
        
        report += `${status}\n`;
        report += `Game: ${game.company_name} (${game.company_id})\n`;
        
        if (needsServer) {
            report += `  - Server Selection Needed (Buttons):\n`;
            game.gameservers.forEach(s => {
                report += `    * ${s.name} (Value: ${s.value})\n`;
            });
        }
        
        if (additionalRefs.length > 0) {
            report += `  - Additional Input Fields Needed:\n`;
            additionalRefs.forEach(ref => {
                report += `    * ${ref} (Format: ${game.refs_format[ref]})\n`;
            });
        }
        
        if (hasSpaceInRegex && !needsServer) {
            report += `  - Multiple Values in Ref1 (e.g., UID ZoneID):\n`;
            report += `    * Format: ${ref1Format}\n`;
        }
        
        report += '-----------------------------------\n';
    });
}

fs.writeFileSync('d:/gametopup/gametopup backend/final_analysis.txt', report, 'utf8');
console.log('Analysis written to final_analysis.txt');

