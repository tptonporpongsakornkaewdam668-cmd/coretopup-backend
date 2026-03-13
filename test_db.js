const { supabase } = require("./src/db");

async function checkTable() {
    try {
        const { data, error } = await supabase.from("sliders").select("*").limit(1);
        if (error) {
            console.error("❌ Error accessing 'sliders' table:", error.message);
            if (error.message.includes("relation \"public.sliders\" does not exist")) {
                console.log("👉 The 'sliders' table is MISSING. Please run the SQL script to create it.");
            }
        } else {
            console.log("✅ 'sliders' table exists and is accessible.");
        }
    } catch (err) {
        console.error("❌ Catch error:", err.message);
    }
}

checkTable();
