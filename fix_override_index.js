const { createClient } = require('@libsql/client');
const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function fix() {
    console.log('🔧 Creating unique index on product_overrides(company_id, original_price)...');
    try {
        // Remove duplicate rows first (keep the first occurrence)
        await db.execute(`
            DELETE FROM product_overrides WHERE id NOT IN (
                SELECT MIN(id) FROM product_overrides GROUP BY company_id, original_price
            )
        `);
        console.log('✅ Cleaned duplicate rows');

        // Create unique index
        await db.execute(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_product_overrides_unique 
            ON product_overrides(company_id, original_price)
        `);
        console.log('✅ Unique index created');

        // Verify
        const idx = await db.execute('PRAGMA index_list(product_overrides)');
        console.log('Indexes now:', JSON.stringify(idx.rows));

        // Test upsert
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
        console.log('✅ Upsert test PASSED');
        await db.execute({ sql: "DELETE FROM product_overrides WHERE company_id = 'TEST_GAME'", args: [] });
        console.log('🚀 All done! Product override should work now.');
    } catch(e) {
        console.error('❌ Fix failed:', e.message);
    }
}
fix();
