const { supabase } = require("./src/db");

async function checkTables() {
    const tables = ["discount_codes", "system_settings", "users", "orders"];
    
    console.log("🔍 Checking tables...");
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").limit(5);
        if (error) {
            console.log(`❌ Table [${table}]: ERROR - ${error.message}`);
        } else {
            console.log(`✅ Table [${table}]: OK (Found ${data?.length || 0} rows)`);
            if (data && data.length > 0) {
                if (table === "system_settings") {
                    data.forEach(row => console.log(`   Key: ${row.key}, Value: ${row.value?.substring(0, 50)}...`));
                } else {
                    console.log(`   Columns: ${Object.keys(data[0]).join(", ")}`);
                }
            }
        }
    }
}

checkTables();
