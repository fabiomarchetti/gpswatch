// Script per generare l'hash della password admin
const bcrypt = require('bcryptjs');

const password = 'Admin2025!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Errore:', err);
    return;
  }

  console.log('\n=== HASH GENERATO ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopia questo hash nello script SQL 01_create_users_table.sql');
  console.log('nella riga INSERT INTO users...\n');
});
