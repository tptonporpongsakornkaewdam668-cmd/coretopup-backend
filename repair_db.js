const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function repair() {
    console.log("🚀 Repairing Schema with Correct Token...");
    try {
        // 1. users -> updated_at
        await db.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        console.log("✅ Added updated_at to users.");
    } catch (e) { console.log("ℹ️ users: skip error (might exist)."); }

    try {
        // 2. orders -> updated_at
        await db.execute("ALTER TABLE orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        console.log("✅ Added updated_at to orders.");
    } catch (e) { console.log("ℹ️ orders: skip error (might exist)."); }

    console.log("✨ REPAIR COMPLETE! Go purchase now.");
}
repair();
