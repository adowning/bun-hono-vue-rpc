import 'dotenv/config' // Load .env file at the top
export { and, eq, gt, sql } from 'drizzle-orm'
export { db } from './db' // Export our new runtime db

// This now exports everything from our new /schema barrel file
export * from './schema'
