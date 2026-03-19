const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'https://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function resetAndFix() {
    console.log("🚀 Resetting and Fixing Sliders Table (HTTP Mode)...");
    try {
        await db.execute("DROP TABLE IF EXISTS sliders");
        await db.execute(`CREATE TABLE sliders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            image_url TEXT, 
            link_url TEXT, 
            order_index INTEGER DEFAULT 0, 
            is_active INTEGER DEFAULT 1, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log("✅ Sliders table recreated successfully.");

        const images = ["/slidebar/1.png", "/slidebar/2.png", "/slidebar/3.png"];
        for (let i = 0; i < images.length; i++) {
            await db.execute({
                sql: "INSERT INTO sliders (image_url, order_index, is_active) VALUES (?, ?, 1)",
                args: [images[i], i + 1]
            });
            console.log(`✅ Added Slider ${i + 1}: ${images[i]}`);
        }

        console.log("✨ SUCCESS! All 3 images are now in Turso.");
    } catch (e) {
        console.error("❌ Reset Failed:", e);
    }
}

resetAndFix();
