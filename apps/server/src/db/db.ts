import { drizzle } from 'drizzle-orm/bun-sql' // Use the bun-sql adapter
import { SQL } from 'bun' // Use bun:sql for runtime
// Import all the parts of our schema explicitly
import * as enums from '@/db/schema/_enums'
import * as operators from '@/db/schema/operators'
import * as users from '@/db/schema/users'
import * as games from '@/db/schema/games'
import * as wallets from '@/db/schema/wallets'
import * as logs from '@/db/schema/logs'
import * as relations from '@/db/schema/relations'

// Combine them into the schema object for the RUNTIME
const schema = {
  ...enums,
  ...operators,
  ...users,
  ...games,
  ...wallets,
  ...logs,
  ...relations
}
const connectionString = process.env.DATABASE_URL

/*
 * 1. Create the native bun:sql client
 * Removed '!' as the check above handles it
 */
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const client = new SQL(connectionString)
// 2. Pass the client and the *combined* schema object to Drizzle
export const db = drizzle({ client, schema, casing: 'snake_case' })
