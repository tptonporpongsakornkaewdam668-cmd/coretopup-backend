const bcrypt = require('bcryptjs');
const password = 'CoinZone@2024!';
bcrypt.hash(password, 12).then(hash => {
  console.log('PASSWORD: ' + password);
  console.log('HASH: ' + hash);
});
