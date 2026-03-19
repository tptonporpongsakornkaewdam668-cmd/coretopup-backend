const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function updateSliders() {
    console.log("🚀 Updating Sliders in Turso...");
    try {
        // 1. ลบข้อมูลเก่าทิ้งก่อน
        await db.execute("DELETE FROM sliders");
        console.log("✅ Cleared old sliders.");

        // 2. ใส่ 3 ภาพใหม่ที่ระบุจากเครื่อง
        const images = ["/slidebar/1.png", "/slidebar/2.png", "/slidebar/3.png"];
        for (let i = 0; i < images.length; i++) {
            await db.execute({
                sql: "INSERT INTO sliders (image_url, order_index, is_active) VALUES (?, ?, 1)",
                args: [images[i], i + 1]
            });
            console.log(`✅ Added Slider ${i + 1}: ${images[i]}`);
        }

        console.log("✨ ALL DONE! Please push your frontend and refresh the website.");
    } catch (e) {
        console.error("❌ Update Failed:", e);
    }
}

updateSliders();
