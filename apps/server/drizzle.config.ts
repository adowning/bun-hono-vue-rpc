import 'dotenv/config' // Load .env file
import type { Config } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file')
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // Changed from 'sqlite'
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL // Use the env variable
  }
} satisfies Config
