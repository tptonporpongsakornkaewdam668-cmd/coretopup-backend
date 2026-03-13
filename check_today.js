const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTodayOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log("Checking orders since:", today.toISOString());

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
    
    if (error) {
        console.error("Error fetching today's orders:", error);
        return;
    }

    console.log(`Found ${orders.length} orders today.`);
    orders.forEach(o => {
        console.log(`- [${o.created_at}] ID: ${o.id}, Game: ${o.game_name}, Price: ${o.package_price} THB, Status: ${o.status}`);
    });

    if (orders.length === 0) {
        console.log("\nNo orders found today. Let's check ALL orders to see the latest one overall.");
        const { data: allOrders } = await supabase.from("orders").select("id, created_at, game_name").order("created_at", { ascending: false }).limit(5);
        allOrders?.forEach(o => console.log(`- [${o.created_at}] ${o.game_name}`));
    }
}

checkTodayOrders();
