
import fs from 'fs';

// CP1252 mapping for 0x80-0x9F
const cp1252 = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
    0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91,
    0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98,
    0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
};

function charToByte(char) {
    const code = char.charCodeAt(0);
    if (code < 0x80) return code;
    if (code >= 0x0E01 && code <= 0x0E5B) return code - 0x0E00 + 0xA0;
    if (cp1252[code]) return cp1252[code];
    if (code >= 0xA0 && code <= 0xFF) return code; // Latin-1
    return code & 0xFF; // Fallback
}

function fixString(str) {
    try {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            bytes.push(charToByte(str[i]));
        }
        return Buffer.from(bytes).toString('utf8');
    } catch (e) {
        return str;
    }
}

// TEST
const testStr = "เธฟ"; // Supposed to be ฿ (E0 B8 BF)
console.log(`Test: ${testStr} -> ${fixString(testStr)}`);

const test2 = "เน€เธ เธดเธ”เธ‚เน‰เธญเธœเธดเธ”เธžเธฅเธฒเธ”"; // Supposed to be เกิดข้อผิดพลาด
console.log(`Test 2: ${test2} -> ${fixString(test2)}`);

const files = [
    'd:/gametopup/gametopup frontend/src/pages/PremiumApp.tsx',
    'd:/gametopup/gametopup frontend/src/pages/CashCard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/AdminDashboard.tsx',
    'd:/gametopup/gametopup frontend/src/pages/TopUp.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    console.log(`Fixing ${file}...`);
    const content = fs.readFileSync(file, 'utf8');
    const fixedContent = fixString(content);
    
    // Safety check: if the fixed content is shorter than 50% of original, something might be wrong (unless it's all Thai)
    // Actually, UTF-8 Thai is 3x longer than the bytes, so fixed should be 1/3 the size of the mangled part.
    // ASCII is same size.
    
    fs.writeFileSync(file, fixedContent, 'utf8');
    console.log(`Fixed ${file}`);
});
