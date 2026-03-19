const { createClient } = require('@libsql/client');
const db = createClient({
    url: 'libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxxT9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw'
});

async function fix() {
    console.log('🔧 Fixing orders table schema...');
    
    // Check current columns
    const info = await db.execute('PRAGMA table_info(orders)');
    const cols = info.rows.map(r => r['name']);
    console.log('Current columns:', cols.join(', '));
    
    const toAdd = [
        { name: 'user_email', type: 'TEXT DEFAULT NULL' },
        { name: 'username', type: 'TEXT DEFAULT NULL' },
        { name: 'game_name', type: 'TEXT DEFAULT NULL' },
        { name: 'package_name', type: 'TEXT DEFAULT NULL' },
        { name: 'price', type: 'NUMERIC DEFAULT NULL' },
    ];
    
    for (const col of toAdd) {
        if (!cols.includes(col.name)) {
            try {
                await db.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added column: ${col.name}`);
            } catch(e) {
                console.error(`❌ Failed to add ${col.name}: ${e.message}`);
            }
        } else {
            console.log(`ℹ️  Column already exists: ${col.name}`);
        }
    }
    
    console.log('\n✅ Orders table fix complete!');
}

fix().catch(e => console.error('Fatal:', e));
