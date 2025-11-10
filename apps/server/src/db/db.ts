import { drizzle } from 'drizzle-orm/bun-sql' // Use the bun-sql adapter
import { SQL } from 'bun' // Use bun:sql for runtime
import * as schema from './schema'
// 1. Create the native bun:sql client
// Removed '!' as the check above handles it
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const client = new SQL(process.env.DATABASE_URL)
// 2. Pass the client to Drizzle
export const db = drizzle({ client, schema, casing: 'snake_case' })
