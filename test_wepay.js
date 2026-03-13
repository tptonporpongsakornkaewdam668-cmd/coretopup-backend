require('dotenv').config();
const { wepayRequest, getWepayProductList } = require('./src/services/wepay');

async function test() {
    console.log('Testing balance_inquiry...');
    try {
        const balance = await wepayRequest({ type: 'balance_inquiry' });
        console.log('Balance:', JSON.stringify(balance, null, 2));

        console.log('Testing product list...');
        const products = await getWepayProductList();
        console.log('Product List Status:', products.statusCode);
        if (products.data && products.data.data && products.data.data.gtopup) {
            console.log('Found', products.data.data.gtopup.length, 'game products');
            console.log('First game:', products.data.data.gtopup[0].company_name);
        } else {
            console.log('No game products found or error in data structure');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
