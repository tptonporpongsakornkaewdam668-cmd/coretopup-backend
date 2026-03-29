const bcrypt = require('bcryptjs');
const fs = require('fs');
const password = 'admin123';
bcrypt.hash(password, 12).then(hash => {
  fs.writeFileSync('CLEAN_HASH.txt', hash);
  console.log('DONE');
});
