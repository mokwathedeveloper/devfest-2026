import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: npm run hash-password -- "your-password"   (min 8 characters)');
  process.exit(1);
}
// Single-quote-safe output: bcrypt hashes contain "$", so wrap in quotes for .env files.
console.log(`ADMIN_PASSWORD_HASH='${bcrypt.hashSync(password, 12)}'`);
