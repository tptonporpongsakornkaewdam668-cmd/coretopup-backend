const axios = require('axios');

async function testVPS() {
    const url = 'http://157.85.102.141:3002/proxy';
    console.log(`📡 Checking VPS at: ${url}`);
    try {
        const res = await axios.get(url, { timeout: 5000 });
        console.log(`✅ VPS is UP! Status: ${res.status}`);
    } catch (e) {
        console.log(`❌ VPS is DOWN or Unreachable! Error: ${e.message}`);
        if (e.response) console.log(`Response Status: ${e.response.status}`);
    }
}
testVPS();
