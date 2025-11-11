import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'path'

// FIX: Use the standard ES Module import.
// This matches your seed.ts and reset.ts files.
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.')
}

// Create the client *for migrations*
const migrationClient = postgres(connectionString, { max: 1 })

// Pass the postgres-js client to the postgres-js drizzle adapter
const db = drizzle(migrationClient)

async function runMigrate() {
  try {
    console.log('Running migrations...')

    const __dirname = new URL('.', import.meta.url).pathname
    const migrationsPath = join(__dirname, '..', '..', 'drizzle')

    await migrate(db, { migrationsFolder: migrationsPath })

    console.log('Migrations completed successfully.')
    await migrationClient.end() // Close the connection
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    await migrationClient.end() // Close on error too
    process.exit(1)
  }
}

runMigrate()
