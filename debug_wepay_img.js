const { supabase } = require('./src/db');
const { getWepayProductList } = require('./src/services/wepay.js');
require('dotenv').config();

async function debugImages() {
    try {
        const result = await getWepayProductList();
        const rawData = result.data.data || {};
        const gtopup = rawData.gtopup || [];

        if (gtopup.length > 0) {
            console.log("Keys in a game item:", Object.keys(gtopup[0]));
            console.log("Sample image values:");
            gtopup.slice(0, 5).forEach(item => {
                console.log(`- ${item.company_name}: img=${item.img}, image=${item.image}, logo=${item.logo}, icon=${item.icon}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

debugImages();
