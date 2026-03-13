const { supabase } = require('./src/db');

const defaultSettings = [
    { key: 'agreement_text', value: 'ข้อตกลงและเงื่อนไขการใช้บริการ: \n1. การเติมเงินไม่สามารถยกเลิกได้\n2. โปรดตรวจสอบ ID ของคุณให้ถูกต้อง\n3. ระบบจะดำเนินการภายใน 1-15 นาที' },
    { key: 'point_earn_rate', value: '1' },
    { key: 'point_earn_threshold', value: '100' },
    { key: 'point_redeem_rate', value: '0.1' }
];

async function seed() {
    console.log('🌱 Seeding system settings...');
    for (const item of defaultSettings) {
        const { error } = await supabase
            .from('system_settings')
            .upsert(item, { onConflict: 'key' });
        
        if (error) {
            console.error(`❌ Error seeding ${item.key}:`, error.message);
        } else {
            console.log(`✅ Seeded ${item.key}`);
        }
    }
    console.log('✨ Seeding complete!');
}

seed();
