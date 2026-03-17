const axios = require('axios');
const fs = require('fs');

async function testWepaySize() {
  try {
    console.log("Fetching from wePAY...");
    const start = Date.now();
    const res = await axios.get("https://www.wepay.in.th/comp_export.php?json");
    const end = Date.now();
    console.log(`Fetch took ${end - start}ms`);
    
    const data = res.data;
    const jsonStr = JSON.stringify(data);
    console.log(`Original JSON size: ${(jsonStr.length / 1024).toFixed(2)} KB`);
    
    if (data.data && data.data.gtopup) {
      console.log(`Number of games: ${data.data.gtopup.length}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testWepaySize();
