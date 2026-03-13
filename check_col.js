const { supabase } = require("./src/db");

async function checkColumns() {
    try {
        // Trying to select a non-existent column will reveal if it exists or not
        const { error } = await supabase.from("sliders").select("order_index").limit(1);
        if (error) {
            console.error("❌ order_index column error:", error.message);
        } else {
            console.log("✅ order_index column exists.");
        }
    } catch (err) {
        console.error("❌ Catch error:", err.message);
    }
}

checkColumns();
