const bcrypt = require('bcryptjs');
const password = 'CoinZone@2026!';
bcrypt.hash(password, 12).then(hash => {
  console.log('HASH:' + hash);
});
