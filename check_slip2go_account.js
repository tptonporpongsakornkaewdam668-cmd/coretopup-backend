require('dotenv').config();
const axios = require('axios');

const SLIP2GO_API_URL = (process.env.SLIP2GO_API_URL || "https://connect.slip2go.com").trim();
const SLIP2GO_SECRET_KEY = (process.env.SLIP2GO_SECRET_KEY || "").trim();

async function checkAccountInfo() {
    // Ensure we are calling the base account info endpoint
    const url = "https://connect.slip2go.com/api/account/info";
    console.log(`🔍 Checking Slip2Go account info at: ${url}`);
    
    let config = {
      method: 'GET',
      url: url,
      headers: {
        'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    try {
        const response = await axios.request(config);
        console.log('✅ Account Info Response:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error checking account info:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

checkAccountInfo();
