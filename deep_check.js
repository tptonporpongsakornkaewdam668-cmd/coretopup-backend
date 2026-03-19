const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function deepCheck() {
    try {
        console.log("--- USERS SCHEMA ---");
        const res1 = await db.execute("PRAGMA table_info(users)");
        console.log(res1.rows.map(r => r.name).join(", "));

        console.log("\n--- ORDERS SCHEMA ---");
        const res2 = await db.execute("PRAGMA table_info(orders)");
        console.log(res2.rows.map(r => r.name).join(", "));
    } catch (e) {
        console.error("❌ DB Check Failed:", e);
    }
}
deepCheck();
