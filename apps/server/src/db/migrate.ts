// import { drizzle } from 'drizzle-orm/bun-sqlite';
// import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
// import { Database } from 'bun:sqlite';
// import { join } from 'path';

// // Get the directory of the current file
// const __dirname = new URL('.', import.meta.url).pathname;

// // Go up one level (from src/db) to the 'server' root for the db file
// const dbPath = join(__dirname, '..', '..', 'sqlite.db');
// const sqlite = new Database(dbPath);
// const db = drizzle(sqlite);

// async function runMigrate() {
//   try {
//     console.log('Running migrations...');
//     // Point to the drizzle folder in the 'server' root
//     const migrationsPath = join(__dirname, '..', '..', 'drizzle');
//     await migrate(db, { migrationsFolder: migrationsPath });
//     console.log('Migrations completed successfully.');
//     process.exit(0);
//   } catch (error) {
//     console.error('Migration failed:', error);
//     process.exit(1);
//   }
// }

// runMigrate();
