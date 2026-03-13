const axios = require('axios');

async function testEndpoints() {
    const baseUrl1 = "https://connect.slip2go.com";
    const baseUrl2 = "https://api.slip2go.com";
    
    const endpoints = [
        "/api/verify-slip/qr-image/info",
        "/api/verify-slip/qr-base64/info",
        "/api/v1/check-slip"
    ];
    
    for (const baseUrl of [baseUrl1, baseUrl2]) {
        for (const endpoint of endpoints) {
            const url = `${baseUrl}${endpoint}`;
            try {
                console.log(`Testing ${url}...`);
                // We just want to see if it's 404 or something else (like 401 Unauthorized)
                const response = await axios.post(url, {}, { 
                    validateStatus: () => true, // Don't throw on any status
                    timeout: 5000
                });
                console.log(`-> Status: ${response.status}`);
            } catch (err) {
                console.log(`-> Error: ${err.message}`);
            }
        }
    }
}

testEndpoints();
