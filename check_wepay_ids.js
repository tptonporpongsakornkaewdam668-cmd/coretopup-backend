const { wepayRequest, getWepayProductList } = require("./src/services/wepay");
require("dotenv").config();

async function checkWepayIds() {
    const result = await getWepayProductList();
    if (result.statusCode !== 200) {
        console.error("Failed:", result.data);
        return;
    }

    const items = result.data.data?.gtopup || [];
    console.log(`\nTotal wePAY products: ${items.length}\n`);
    console.log("=== All Company IDs and Names ===");
    items.forEach(g => {
        console.log(`- ID: "${g.company_id}" | Name: "${g.company_name}" | Denominations: ${g.denomination?.length || 0}`);
    });
}

checkWepayIds();
