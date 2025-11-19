#!/usr/bin/env ts-node

import { drizzle } from 'drizzle-orm/bun-sql'
import { SQL } from 'bun'
import * as fs from 'fs'
import * as path from 'path'

// Import schema and types
import * as enums from '@/db/schema/_enums'
import * as customTypes from '@/db/schema/_custom-types'
import * as games from '@/db/schema/games'

// Combine schema for drizzle
const schema = {
  ...enums,
  ...customTypes,
  ...games
}

// Database connection
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file')
}

const client = new SQL(connectionString)
export const db = drizzle({ client, schema, casing: 'snake_case' })

// Type definitions for JSON data
interface RawGameData {
  id: number
  shop_id?: number
  jpg_id?: string
  label?: string
  name: string
  title?: string
  developer: string
  type: string
  device?: string
  gamebank?: string
  lines_percent_config_spin?: any
  lines_percent_config_spin_bonus?: any
  lines_percent_config_bonus?: any
  lines_percent_config_bonus_bonus?: any
  active: boolean
  featured?: boolean
  popularity?: number
  standard_rtp?: number
  current_rtp?: number
  rtp_stat_in?: number
  rtp_stat_out?: number
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

// Map string type to enum values
function mapGameTypeToCategory(type: string): string {
  const typeMap: Record<string, string> = {
    'slots': 'SLOTS',
    'slot': 'SLOTS',
    'fish': 'FISH',
    'table': 'TABLE',
    'live': 'LIVE',
    'other': 'OTHER',
    'default': 'OTHER'
  }
  
  const normalizedType = type.toLowerCase().trim()
  return typeMap[normalizedType] || 'OTHER'
}

// Map active boolean to status enum
function mapActiveToStatus(active: boolean): string {
  return active ? 'ACTIVE' : 'INACTIVE'
}

// Function to build goldsvetData object according to schema
function buildGoldsvetData(game: RawGameData): any {
  const {
    name, title, developer, type, active, // Remove main fields
    ...remainingData
  } = game

  return {
    shop_id: game.shop_id,
    jpg_id: game.jpgg_id,
    label: game.label,
    device: game.device,
    gamebank: game.gamebank,
    lines_percent_config_spin: game.lines_percent_config_spin,
    lines_percent_config_spin_bonus: game.lines_percent_config_spin_bonus,
    lines_percent_config_bonus: game.lines_percent_config_bonus,
    lines_percent_config_bonus_bonus: game.lines_percent_config_bonus_bonus,
    featured: game.featured,
    popularity: game.popularity,
    standard_rtp: game.standard_rtp,
    current_rtp: game.current_rtp,
    rtp_stat_in: game.rtp_stat_in,
    rtp_stat_out: game.rtp_stat_out,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    // Include any additional fields that aren't mapped to main columns
    ...remainingData
  }
}

// Validate and sanitize data
function validateAndSanitizeGame(game: RawGameData): RawGameData | null {
  try {
    // Check required fields
    if (!game.name?.trim()) {
      console.warn(`Game with ID ${game.id} has no name, skipping`)
      return null
    }

    if (!game.developer?.trim()) {
      console.warn(`Game ${game.name} (ID: ${game.id}) has no developer, skipping`)
      return null
    }

    // Sanitize strings
    const sanitized = {
      ...game,
      name: game.name.trim(),
      title: game.title?.trim() || game.name.trim(),
      developer: game.developer.trim(),
      type: game.type?.trim() || 'other'
    }

    return sanitized
  } catch (error) {
    console.error(`Error validating game ${game.id}:`, error)
    return null
  }
}

// Main import function
async function importGames() {
  console.log('🎮 Starting games import process...')
  console.log('=' .repeat(50))

  const jsonFilePath = path.join(__dirname, 'games2.json')
  
  // Check if file exists
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`Games data file not found: ${jsonFilePath}`)
  }

  console.log(`📁 Reading games data from: ${jsonFilePath}`)

  // Read and parse JSON file
  let rawData: RawGameData[]
  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8')
    rawData = JSON.parse(fileContent)
    console.log(`📊 Loaded ${rawData.length} games from JSON file`)
  } catch (error) {
    throw new Error(`Failed to read or parse JSON file: ${error}`)
  }

  // Validate and sanitize data
  const validGames = rawData
    .map(validateAndSanitizeGame)
    .filter((game): game is RawGameData => game !== null)

  console.log(`✅ Validated ${validGames.length} games (${rawData.length - validGames.length} skipped due to validation errors)`)

  if (validGames.length === 0) {
    console.log('⚠️  No valid games to import')
    return
  }

  // Process games in batches to avoid memory issues
  const BATCH_SIZE = 50
  let processedCount = 0
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  console.log(`🔄 Processing games in batches of ${BATCH_SIZE}...`)
  console.log('=' .repeat(50))

  for (let i = 0; i < validGames.length; i += BATCH_SIZE) {
    const batch = validGames.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(validGames.length / BATCH_SIZE)

    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} games)`)

    for (const game of batch) {
      try {
        processedCount++

        // Check if game already exists
        const existingGame = await db
          .select()
          .from(games.gameTable)
          .where(games.gameTable.id.eq(game.id))
          .limit(1)

        if (existingGame.length > 0) {
          console.log(`⏭️  Game "${game.name}" (ID: ${game.id}) already exists, skipping`)
          skippedCount++
          continue
        }

        // Map game data to database schema
        const gameData = {
          id: game.id,
          name: game.name,
          title: game.title,
          developer: game.developer,
          category: mapGameTypeToCategory(game.type),
          status: mapActiveToStatus(game.active),
          goldsvetData: buildGoldsvetData(game)
        }

        // Insert game
        await db
          .insert(games.gameTable)
          .values(gameData)

        console.log(`✅ Inserted: "${game.name}" (ID: ${game.id}) - Category: ${gameData.category} - Status: ${gameData.status}`)
        successCount++

      } catch (error) {
        console.error(`❌ Error processing game "${game.name}" (ID: ${game.id}):`, error)
        errorCount++
      }
    }
  }

  // Print final summary
  console.log('\n' + '=' .repeat(50))
  console.log('🎯 IMPORT COMPLETE')
  console.log('=' .repeat(50))
  console.log(`📊 Total processed: ${processedCount}`)
  console.log(`✅ Successfully imported: ${successCount}`)
  console.log(`⏭️  Skipped (already exists): ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📁 Data source: ${jsonFilePath}`)
  console.log('=' .repeat(50))
}

// Error handling and cleanup
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Run the import
if (require.main === module) {
  importGames()
    .then(() => {
      console.log('\n🎉 Games import process completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Games import process failed:', error)
      process.exit(1)
    })
}

export { importGames }