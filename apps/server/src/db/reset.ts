import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * This script will delete ALL data from the simulation tables.
 * It respects foreign key constraints by deleting in the correct order.
 */
const main = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.')
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client, { schema })

  console.log('--- RESETTING DATABASE ---')

  try {
    // We must delete in reverse order of creation to respect foreign keys
    console.log('Deleting bet logs...')
    await db.delete(schema.betLogTable)

    console.log('Deleting game sessions...')
    await db.delete(schema.gameSessionTable)

    console.log('Deleting active bonuses...')
    await db.delete(schema.activeBonusTable)

    /*
     * bonusLogTable and depositLogTable can have a circular-like dependency
     * (bonus references deposit, but we need to delete both)
     * We can break the link by setting the foreign key to null first (if it's nullable)
     * or just delete the logs that depend on deposits.
     * In our schema, bonusLog references depositLog, so we delete bonusLog first.
     */
    console.log('Deleting bonus logs...')
    await db.delete(schema.bonusLogTable)

    console.log('Deleting deposit logs...')
    await db.delete(schema.depositLogTable)

    console.log('Deleting withdrawal logs...')
    await db.delete(schema.withdrawalLogTable)

    console.log('Deleting user balances...')
    await db.delete(schema.userBalanceTable)

    // Users and Games must be deleted before the Operator
    console.log('Deleting users...')
    await db.delete(schema.userTable)

    console.log('Deleting games...')
    await db.delete(schema.gameTable)

    // Operator is last
    console.log('Deleting operator...')
    await db.delete(schema.operatorTable)

    console.log('--- DATABASE RESET SUCCESSFULLY ---')
    process.exit(0)
  } catch (err) {
    console.error('--- DATABASE RESET FAILED ---')
    console.error(err)
    process.exit(1)
  }
}

main()
