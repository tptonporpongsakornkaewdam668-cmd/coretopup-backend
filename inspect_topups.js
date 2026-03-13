const { supabase } = require('./src/db');

async function inspectTopups() {
    console.log('🔍 Inspecting topups table columns...');
    
    // We try to insert a dummy object and catch the error which should list columns if it's a schema error
    // Alternatively, just try to get one row and see the keys.
    const { data, error } = await supabase.from('topups').select('*').limit(1);
    
    if (error) {
        console.error('❌ Error selecting from topups:', error.message);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('✅ Found data! Columns:', Object.keys(data[0]));
        console.log('Sample row:', data[0]);
    } else {
        console.log('⚠️ Table is empty. Trying to find columns via dummy insert...');
        // Try an empty insert to trigger a column mismatch error that might reveal something, 
        // but better yet, use a known method if possible.
        // In many cases, we can just check the first row if we have any data.
        // If not, we can try to guess columns.
        console.log('Please insert a sample row manually or check Supabase dashboard.');
    }
}

inspectTopups();
