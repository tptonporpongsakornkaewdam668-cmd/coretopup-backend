const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function fixSliderURLs() {
    console.log("🚀 Updating Slider URLs to Absolute...");
    try {
        await db.execute("DELETE FROM sliders");
        const baseURL = "https://www.coinzonetopup.shop/slidebar";
        const images = ["1.png", "2.png", "3.png"];

        for (let i = 0; i < images.length; i++) {
            await db.execute({
                sql: "INSERT INTO sliders (image_url, order_index, is_active) VALUES (?, ?, 1)",
                args: [`${baseURL}/${images[i]}`, i + 1]
            });
            console.log(`✅ Added Slider ${i + 1}: ${baseURL}/${images[i]}`);
        }
        console.log("✨ ALL DONE! Please refresh everything.");
    } catch (e) {
        console.error("❌ Update Failed:", e);
    }
}
fixSliderURLs();
