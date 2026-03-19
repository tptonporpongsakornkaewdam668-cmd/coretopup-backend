const { createClient } = require('@libsql/client');
const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function check() {
    // Column info
    const info = await db.execute('PRAGMA table_info(product_overrides)');
    console.log('COLUMNS:', info.rows.map(r => r['name'] + ' (' + r['type'] + ')').join(', '));
    
    // Index info
    const idx = await db.execute('PRAGMA index_list(product_overrides)');
    console.log('INDEXES:', JSON.stringify(idx.rows));

    // Try a real insert to see full error
    try {
        await db.execute({
            sql: `INSERT INTO product_overrides 
                  (company_id, original_price, selling_price, cost_price, discount_price, discount_start, discount_end, custom_image_url) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(company_id, original_price) DO UPDATE SET 
                  selling_price = excluded.selling_price,
                  cost_price = excluded.cost_price,
                  discount_price = excluded.discount_price,
                  discount_start = excluded.discount_start,
                  discount_end = excluded.discount_end,
                  custom_image_url = excluded.custom_image_url`,
            args: ['TEST_GAME', 100, 90, 80, null, null, null, null]
        });
        console.log('✅ Insert/Upsert test PASSED');
        // Cleanup
        await db.execute({ sql: "DELETE FROM product_overrides WHERE company_id = 'TEST_GAME'", args: [] });
    } catch(e) {
        console.error('❌ Insert test FAILED:', e.message);
    }
}
check().catch(e => console.error('Fatal:', e));
