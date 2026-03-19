const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function trace() {
    try {
        console.log("--- SCANNING FOR NEW ORDER ---");
        const res = await db.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1");
        if (res.rows.length > 0) {
            console.table(res.rows);
        } else {
            console.log("❌ NO ORDER FOUND. The failure happened BEFORE database insertion (Step 5 failed).");
        }
    } catch (e) {
        console.error("❌ Trace Failed:", e);
    }
}
trace();
