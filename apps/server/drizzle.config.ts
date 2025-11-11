import 'dotenv/config' // Load .env file
import type { Config } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

export default {
  // Point to the new barrel file
  schema: [
    './src/db/schema/_enums.ts',
    './src/db/schema/operators.ts',
    './src/db/schema/users.ts',
    './src/db/schema/games.ts',
    './src/db/schema/wallets.ts',
    './src/db/schema/logs.ts'
  ],
  out: './drizzle',
  dialect: 'postgresql', // Changed from 'sqlite'
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL // Use the env variable
  }
} satisfies Config
