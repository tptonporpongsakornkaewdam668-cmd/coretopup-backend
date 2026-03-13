const { proxyRequest } = require("./proxy");

async function checkWepay() {
    console.log("🔍 Checking wePAY Product List via VPS Proxy...");
    const url = "https://www.wepay.in.th/comp_export.php?json";
    const result = await proxyRequest(url, "GET", {}, null);

    if (result.statusCode === 200) {
        console.log("✅ Success!");
        const data = result.data.data || {};

        const gtopupCount = data.gtopup?.length || 0;
        const mtopupCount = data.mtopup?.length || 0;

        console.log(`🎮 gtopup: ${gtopupCount} games`);
        console.log(`📱 mtopup: ${mtopupCount} services`);

        if (mtopupCount > 0) {
            console.log("📱 Sample mtopup:", JSON.stringify(data.mtopup[0], null, 2));
        }

        if (gtopupCount > 0) {
            console.log("🎮 Sample gtopup (First Denom):", JSON.stringify(data.gtopup[0].denomination?.[0], null, 2));
        }
    } else {
        console.log("❌ Failed:", result.statusCode, result.data);
    }
}

checkWepay();
