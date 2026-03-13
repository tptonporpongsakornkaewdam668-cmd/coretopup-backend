const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debugHistory() {
    // 1. Get all recent orders
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10);
    
    if (error) {
        console.error("Error fetching orders:", error);
        return;
    }

    console.log(`Found ${orders.length} total recent orders:`);
    orders.forEach(o => {
        console.log(`- ID: ${o.id}, User: ${o.user_id}, Email: ${o.user_email}, Game: ${o.game_name}, Price: ${o.package_price}, Status: ${o.status}`);
    });

    // 2. Check users
    const { data: users } = await supabase.from("users").select("id, email, username").limit(5);
    console.log("\nRecent Users:");
    users?.forEach(u => console.log(`- ${u.id}: ${u.email} (${u.username})`));
}

debugHistory();
