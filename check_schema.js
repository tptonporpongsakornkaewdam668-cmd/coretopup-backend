const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkSchema() {
    const { data, error } = await supabase.from("orders").select("*").limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Columns:", Object.keys(data[0] || {}));
        console.log("Sample Data:", data[0]);
    }
}

checkSchema();
