require('dotenv').config();
const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/runMigration.js <filename.sql>');
  process.exit(1);
}

const filePath = path.join(__dirname, '..', 'migrations', migrationFile);
if (!fs.existsSync(filePath)) {
  console.error(`Migration file not found: ${filePath}`);
  process.exit(1);
}

async function main() {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Running migration: ${migrationFile}`);
  try {
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  await pool.end();
}

main();
