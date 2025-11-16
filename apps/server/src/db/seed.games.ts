import path from 'path'
import fs from 'fs'
import { db } from './db'
import { gameTable, NewGame } from './schema'
import { faker } from '@faker-js/faker'
type GameJson = {
  id: string
  created_at: string
  updated_at: string
  version: number
  is_active: boolean
  name: string
  title: string
  description: string | null
  category: string
  thumbnail_url: string | null
  banner_url: string | null
  developer: string
  target_rtp: number
  status: string
  min_bet: number
  max_bet: number
  is_featured: boolean
  goldsvet_data: any
  total_bet_amount: number
  total_won_amount: number
  volatility: number
  current_rtp: number
  total_bets: number
  total_wins: number
  hit_percentage: number
  total_players: number
  total_minutes_played: number
  distinct_players: string[] | null
  started_at: string
}
const seed = async () => {
  const gamesJsonPath = path.join(__dirname, '../../drizzle/games2.json')
  let gameInserts: NewGame[] = []

  try {
    const gamesString = fs.readFileSync(gamesJsonPath, 'utf-8')
    console.log(gamesString)
    let gamesData: GameJson[] = JSON.parse(gamesString)
    console.log(gamesData)
    gameInserts = gamesData
      .filter((g) => g.id)
      .map((game) => {
        // Map snake_case to camelCase
        console.log(game)
        game.name.includes('NG')
        return {
          id: faker.string.uuid(),
          name: game.name,
          title: game.title,
          category: game.category as NewGame['category'],
          developer: game.developer,
          // operatorId: is REMOVED (global game)
          status: 'ACTIVE',
          minBet: game.min_bet,
          maxBet: game.max_bet,
          isFeatured: game.is_featured,
          volatility: game.volatility,
          targetRtp: game.target_rtp,
          goldsvetData: game.goldsvet_data,
          totalBetAmount: game.total_bet_amount || 0,
          totalWonAmount: game.total_won_amount || 0,
          totalBets: game.total_bets || 0,
          totalWins: game.total_wins || 0,
          currentRtp: Math.round(game.current_rtp || 0),
          hitPercentage: Math.round(game.hit_percentage || 0),
          totalPlayers: game.total_players || 0,
          totalMinutesPlayed: game.total_minutes_played || 0,
          distinctPlayers: game.distinct_players || [],
          createdAt: new Date(game.createdAt),
          updatedAt: new Date(game.updatedAt)
          //   startedAt: new Date(game.startedAt)
        }
      })

    console.log(`Inserting ${gameInserts.length} active games...`)
    await db.insert(gameTable).values(gameInserts)
  } catch (err) {
    console.error(`Failed to load or insert games.json. Make sure it's at '${gamesJsonPath}'.`, err)
    process.exit(1)
  }
}
seed()
