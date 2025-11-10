import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { faker } from '@faker-js/faker'
import * as schema from './schema'
import {
  NewUser,
  NewUserBalance,
  NewDepositLog,
  NewBonusLog,
  NewActiveBonus,
  NewBetLog,
  NewWithdrawalLog,
  UserBalance,
  ActiveBonus,
  NewGame,
  NewGameSession
} from './schema'
import { sql } from 'drizzle-orm'
import fs from 'fs' // We'll need this to read the games.json
import path from 'path'

// --- CONFIGURATION ---
const USER_COUNT = 100
const HOUSE_ID = '00000000-0000-0000-0000-000000000000'
const SIMULATION_START_DATE = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
const SIMULATION_END_DATE = new Date()
const CHANCE_TO_PLAY_PER_DAY = 0.5 // 50% chance a user will play on a given day
const SESSIONS_PER_DAY = 1 // Max sessions per day if they do play
const MIN_BETS_PER_SESSION = 10
const MAX_BETS_PER_SESSION = 150
const MIN_TIME_PER_BET_MS = 3000 // 3 seconds
const MAX_TIME_PER_BET_MS = 10000 // 10 seconds

// (Other financial configs remain the same)
const MIN_DEPOSIT = 2000
const MAX_DEPOSIT = 10000
const DEPOSIT_MATCH_PERCENT = 1.0
const DEPOSIT_WAGERING_MULTIPLIER = 1
const BONUS_WAGERING_MULTIPLIER = 10
const BONUS_PRIORITY = 100
const BONUS_EXPIRES_DAYS = 7
const MIN_BET = 50
const MAX_BET = 500
const CHANCE_TO_WIN = 0.4
const MIN_WIN_MULTIPLIER = 1.5
const MAX_WIN_MULTIPLIER = 2.75
const CHANCE_TO_DEPOSIT_AGAIN = 0.1
const CHANCE_TO_WITHDRAW = 0.2
const AUTOWITHDRAW_MULTIPLIER = 4

// --- FIX: Define a batch size to prevent parameter limit errors ---
const BATCH_SIZE = 500 // Insert 500 records at a time

// --- Database Connection ---
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.')
}
const client = postgres(connectionString, { max: 1 })
const db = drizzle(client, { schema, casing: 'snake_case' })

// --- HELPER FUNCTIONS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const addMsToDate = (date: Date, ms: number) => new Date(date.getTime() + ms)

/**
 * Type for the game data from games.json
 */
type GameJson = {
  id: string
  created_at: string
  updated_at: string
  version: number
  is_active: boolean
  name: string
  title: string
  description: string | null
  category: string // Will be cast to enum
  thumbnail_url: string | null
  banner_url: string | null
  developer: string
  operator_id: string | null
  target_rtp: number
  status: string // Will be cast to enum
  min_bet: number
  max_bet: number
  is_featured: boolean
  jackpot_group: string | null
  goldsvet_data: any // It's a complex JSON object
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

/**
 * In-memory stats tracker for games, to be flushed to DB at the end.
 */
class GameStatsTracker {
  totalBetAmount: number = 0
  totalWonAmount: number = 0
  totalBets: number = 0
  totalWins: number = 0
  totalMinutesPlayed: number = 0
  distinctPlayers: Set<string> = new Set()

  constructor(baseline: GameJson) {
    this.totalBetAmount = baseline.total_bet_amount || 0
    this.totalWonAmount = baseline.total_won_amount || 0
    this.totalBets = baseline.total_bets || 0
    this.totalWins = baseline.total_wins || 0
    this.totalMinutesPlayed = baseline.total_minutes_played || 0
    this.distinctPlayers = new Set(baseline.distinct_players || [])
  }
}

/**
 * Stateful User Simulator
 */
class UserSimulator {
  private userId: string
  private games: schema.Game[] // List of all available games
  private createdAt: Date

  // In-Memory State
  private balance: UserBalance
  private activeBonuses: ActiveBonus[] = []
  private totalDeposited = 0

  // Log Arrays
  private depositLogs: NewDepositLog[] = []
  private bonusLogs: NewBonusLog[] = []
  private activeBonusInserts: NewActiveBonus[] = []
  private betLogs: NewBetLog[] = []
  private withdrawalLogs: NewWithdrawalLog[] = []
  private gameSessions: NewGameSession[] = []

  constructor(
    userId: string,
    initialBalance: UserBalance, // Expects the full "Select" type
    games: schema.Game[],
    createdAt: Date
  ) {
    this.userId = userId
    this.balance = { ...initialBalance } // Clone the full state
    this.games = games
    this.createdAt = createdAt
  }

  // --- Financial Event Helpers (Unchanged) ---

  private processInitialDeposit(simDate: Date) {
    const depositAmount = randomInt(MIN_DEPOSIT, MAX_DEPOSIT)
    const bonusAmount = Math.floor(depositAmount * DEPOSIT_MATCH_PERCENT)
    const depositWagering = depositAmount * DEPOSIT_WAGERING_MULTIPLIER
    const bonusWagering = bonusAmount * BONUS_WAGERING_MULTIPLIER
    const depositId = faker.string.uuid()
    const bonusLogId = faker.string.uuid()
    const expiresAt = new Date(simDate)
    expiresAt.setDate(expiresAt.getDate() + BONUS_EXPIRES_DAYS)

    this.depositLogs.push({
      id: depositId,
      userId: this.userId,
      operatorId: HOUSE_ID,
      amount: depositAmount,
      method: 'DEPOSIT_CASHAPP',
      status: 'COMPLETED',
      realAmountBefore: this.balance.realBalance,
      realAmountAfter: this.balance.realBalance + depositAmount,
      depositWageringRequiredBefore: this.balance.depositWageringRemaining,
      depositWageringRequiredAfter: this.balance.depositWageringRemaining + depositWagering,
      createdAt: simDate,
      completedAt: simDate
    })
    this.bonusLogs.push({
      id: bonusLogId,
      userId: this.userId,
      operatorId: HOUSE_ID,
      triggeringDepositId: depositId,
      bonusType: 'DEPOSIT_MATCH',
      bonusAmount,
      wageringRequirementTotal: bonusWagering,
      priority: BONUS_PRIORITY,
      expiresInDays: BONUS_EXPIRES_DAYS,
      createdAt: simDate
    })
    const activeBonus: ActiveBonus = {
      id: faker.string.uuid(),
      userId: this.userId,
      bonusLogId,
      status: 'ACTIVE',
      priority: BONUS_PRIORITY,
      currentBonusBalance: bonusAmount,
      currentWageringRemaining: bonusWagering,
      expiresAt,
      createdAt: simDate,
      updatedAt: simDate
    }
    this.activeBonusInserts.push(activeBonus)
    this.activeBonuses.push(activeBonus)
    this.balance.realBalance += depositAmount
    this.balance.depositWageringRemaining += depositWagering
    this.balance.totalDepositedReal += depositAmount
    this.balance.totalBonusGranted += bonusAmount
    this.totalDeposited += depositAmount
  }

  private processDeposit(simDate: Date) {
    const depositAmount = randomInt(MIN_DEPOSIT, MAX_DEPOSIT)
    const depositWagering = depositAmount * DEPOSIT_WAGERING_MULTIPLIER
    this.depositLogs.push({
      id: faker.string.uuid(),
      userId: this.userId,
      operatorId: HOUSE_ID,
      amount: depositAmount,
      method: 'DEPOSIT_CASHAPP',
      status: 'COMPLETED',
      realAmountBefore: this.balance.realBalance,
      realAmountAfter: this.balance.realBalance + depositAmount,
      depositWageringRequiredBefore: this.balance.depositWageringRemaining,
      depositWageringRequiredAfter: this.balance.depositWageringRemaining + depositWagering,
      createdAt: simDate,
      completedAt: simDate
    })
    this.balance.realBalance += depositAmount
    this.balance.depositWageringRemaining += depositWagering
    this.balance.totalDepositedReal += depositAmount
    this.totalDeposited += depositAmount
  }

  private processBet(game: schema.Game, gameSessionId: string, simDate: Date) {
    const wagerAmount = randomInt(
      Math.max(MIN_BET, game.minBet || MIN_BET),
      Math.min(MAX_BET, game.maxBet || MAX_BET)
    )
    const totalAvailableBonus = this.activeBonuses.reduce(
      (sum, b) => (b.status === 'ACTIVE' ? sum + b.currentBonusBalance : sum),
      0
    )
    if (this.balance.realBalance + totalAvailableBonus < wagerAmount) {
      return { nsf: true, wagerAmount: 0, winAmount: 0 }
    }
    const isWin = Math.random() < CHANCE_TO_WIN
    const winAmount = isWin
      ? Math.floor(
          wagerAmount *
            (Math.random() * (MAX_WIN_MULTIPLIER - MIN_WIN_MULTIPLIER) + MIN_WIN_MULTIPLIER)
        )
      : 0
    let wagerPaidFromReal = 0
    let wagerPaidFromBonus = 0
    let wagerToPay = wagerAmount
    if (this.balance.realBalance > 0) {
      const paidReal = Math.min(this.balance.realBalance, wagerToPay)
      this.balance.realBalance -= paidReal
      wagerPaidFromReal += paidReal
      wagerToPay -= paidReal
    }
    if (wagerToPay > 0) {
      this.activeBonuses.sort((a, b) => a.priority - b.priority)
      for (const bonus of this.activeBonuses) {
        if (wagerToPay === 0) break
        if (bonus.status !== 'ACTIVE' || bonus.currentBonusBalance === 0) continue
        const paidBonus = Math.min(bonus.currentBonusBalance, wagerToPay)
        bonus.currentBonusBalance -= paidBonus
        wagerPaidFromBonus += paidBonus
        wagerToPay -= paidBonus
        bonus.updatedAt = simDate
      }
    }
    let wagerForWROnly = wagerAmount
    if (wagerPaidFromReal > 0 && this.balance.depositWageringRemaining > 0) {
      const cleared = Math.min(this.balance.depositWageringRemaining, wagerPaidFromReal)
      this.balance.depositWageringRemaining -= cleared
    }
    for (const bonus of this.activeBonuses) {
      if (wagerForWROnly === 0) break
      if (bonus.status !== 'ACTIVE' || bonus.currentWageringRemaining === 0) continue
      const cleared = Math.min(bonus.currentWageringRemaining, wagerForWROnly)
      bonus.currentWageringRemaining -= cleared
      wagerForWROnly -= cleared
      bonus.updatedAt = simDate
      if (bonus.currentWageringRemaining === 0) {
        this.completeBonus(bonus, simDate)
      }
    }
    if (winAmount > 0) {
      this.balance.realBalance += winAmount
    }
    this.betLogs.push({
      userId: this.userId,
      operatorId: HOUSE_ID,
      status: 'COMPLETED',
      wagerAmount,
      winAmount,
      wagerPaidFromReal,
      wagerPaidFromBonus,
      gameId: game.id,
      gameName: game.name,
      gameSessionId,
      createdAt: simDate
    })
    this.balance.totalWagered += wagerAmount
    this.balance.totalWon += winAmount
    return { nsf: false, wagerAmount, winAmount }
  }

  private processWithdrawal(simDate: Date) {
    const totalBonusWR = this.activeBonuses.reduce((sum, b) => sum + b.currentWageringRemaining, 0)
    if (
      this.balance.depositWageringRemaining > 0 ||
      totalBonusWR > 0 ||
      this.balance.realBalance < MIN_DEPOSIT
    ) {
      return
    }
    const isAutoWithdraw = this.balance.realBalance > this.totalDeposited * AUTOWITHDRAW_MULTIPLIER
    if (!isAutoWithdraw && Math.random() > CHANCE_TO_WITHDRAW) {
      return
    }
    const withdrawalAmount = isAutoWithdraw
      ? this.balance.realBalance - this.totalDeposited * (AUTOWITHDRAW_MULTIPLIER - 1)
      : Math.floor(this.balance.realBalance * (Math.random() * 0.5 + 0.1))
    if (withdrawalAmount <= 0) return
    this.withdrawalLogs.push({
      userId: this.userId,
      operatorId: HOUSE_ID,
      status: 'COMPLETED',
      amount: withdrawalAmount,
      realAmountBefore: this.balance.realBalance,
      realAmountAfter: this.balance.realBalance - withdrawalAmount,
      requestedAt: simDate,
      completedAt: simDate
    })
    this.balance.realBalance -= withdrawalAmount
    this.balance.totalWithdrawn += withdrawalAmount
  }

  private completeBonus(bonus: ActiveBonus, simDate: Date) {
    bonus.status = 'COMPLETED'
    bonus.updatedAt = simDate
    if (bonus.currentBonusBalance > 0) {
      this.balance.realBalance += bonus.currentBonusBalance
      bonus.currentBonusBalance = 0
    }
  }

  private getTotalBalance() {
    return (
      this.balance.realBalance +
      this.activeBonuses.reduce(
        (sum, b) => (b.status === 'ACTIVE' ? sum + b.currentBonusBalance : 0),
        0
      )
    )
  }

  // --- Main Simulation Loop (Refactored for Sessions) ---
  public simulate() {
    let currentDate = new Date(this.createdAt)

    // 1. Initial Deposit
    this.processInitialDeposit(currentDate)

    const daysSinceJoined = Math.floor(
      (SIMULATION_END_DATE.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    // 2. Daily Activity Loop
    for (let i = 0; i <= daysSinceJoined; i++) {
      // A. Check for bonus expiration
      for (const bonus of this.activeBonuses) {
        if (bonus.status === 'ACTIVE' && bonus.expiresAt && currentDate > bonus.expiresAt) {
          bonus.status = 'EXPIRED'
          bonus.currentBonusBalance = 0
          bonus.updatedAt = currentDate
        }
      }

      // B. Check for Withdrawal (can happen even if not playing)
      this.processWithdrawal(currentDate)

      // C. Chance to play today?
      if (Math.random() > CHANCE_TO_PLAY_PER_DAY) {
        currentDate.setDate(currentDate.getDate() + 1) // Advance to next day
        continue
      }

      // D. Check for re-deposit if low on funds
      if (this.getTotalBalance() < MIN_DEPOSIT && Math.random() < CHANCE_TO_DEPOSIT_AGAIN) {
        this.processDeposit(currentDate)
      }

      // E. Run Game Sessions for the day
      for (let j = 0; j < SESSIONS_PER_DAY; j++) {
        if (this.getTotalBalance() < MIN_BET) {
          break // Stop playing if out of money
        }

        const game = this.games[randomInt(0, this.games.length - 1)]!
        const sessionStartTime = new Date(currentDate)
        const gameSessionId = faker.string.uuid()

        const session: NewGameSession = {
          id: gameSessionId,
          userId: this.userId,
          gameId: game.id,
          gameName: game.name,
          status: 'ACTIVE', // Will be COMPLETED
          playerStartingBalance: this.getTotalBalance(),
          createdAt: sessionStartTime,
          // Will be set at end
          totalWagered: 0,
          totalWon: 0,
          totalBets: 0,
          playerEndingBalance: 0,
          duration: 0,
          updatedAt: sessionStartTime
        }

        const numberOfBets = randomInt(MIN_BETS_PER_SESSION, MAX_BETS_PER_SESSION)
        let sessionWagered = 0
        let sessionWon = 0

        for (let k = 0; k < numberOfBets; k++) {
          const betTime = randomInt(MIN_TIME_PER_BET_MS, MAX_TIME_PER_BET_MS)
          currentDate = addMsToDate(currentDate, betTime) // Advance time per bet

          const betResult = this.processBet(game, gameSessionId, currentDate)

          if (betResult.nsf) {
            break // End session if NSF
          }

          sessionWagered += betResult.wagerAmount
          sessionWon += betResult.winAmount
          session.totalBets!++
        }

        // Complete the session
        session.status = 'COMPLETED'
        session.totalWagered = sessionWagered
        session.totalWon = sessionWon
        session.playerEndingBalance = this.getTotalBalance()
        session.updatedAt = new Date(currentDate)
        session.duration = Math.round(
          (session.updatedAt.getTime() - session.createdAt!.getTime()) / 60000
        ) // in minutes

        this.gameSessions.push(session)
      }

      // Advance to next day (or what's left of it)
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(randomInt(0, 5), randomInt(0, 59)) // Start next day at a random early time
    }

    // 3. Return all logs and the final state
    this.balance.updatedAt = new Date()

    return {
      finalBalance: this.balance,
      depositLogs: this.depositLogs,
      bonusLogs: this.bonusLogs,
      activeBonusInserts: this.activeBonusInserts,
      activeBonusUpdates: this.activeBonuses, // The full final state
      betLogs: this.betLogs,
      withdrawalLogs: this.withdrawalLogs,
      gameSessions: this.gameSessions
    }
  }
}

/**
 * Main Seed Function
 */
const main = async () => {
  console.log('--- SEEDING STARTED (Session-Based Model) ---')

  // 1. Clean database
  console.log('Cleaning database...')
  await db.delete(schema.betLogTable)
  await db.delete(schema.gameSessionTable)
  await db.delete(schema.activeBonusTable)
  await db.delete(schema.bonusLogTable)
  await db.delete(schema.depositLogTable)
  await db.delete(schema.withdrawalLogTable)
  await db.delete(schema.userBalanceTable)
  await db.delete(schema.userTable)
  await db.delete(schema.gameTable)
  await db.delete(schema.operatorTable)

  // 2. Create HOUSE operator
  console.log('Creating HOUSE operator...')
  const [house] = await db
    .insert(schema.operatorTable)
    .values({
      id: HOUSE_ID,
      name: 'HOUSE',
      ownerId: 'system'
    })
    .returning()
  if (!house) throw new Error(' you have no house operator')
  // 3. Load and Insert Games from JSON
  console.log('Loading games from games.json...')
  // Assumes games.json is in the root, parallel to 'apps'
  const gamesJsonPath = path.join(__dirname, '../../../../games.json')
  let gameInserts: NewGame[] = []
  const gameBaselineStats = new Map<string, GameStatsTracker>()

  try {
    const gamesString = fs.readFileSync(gamesJsonPath, 'utf-8')
    const gamesData: GameJson[] = JSON.parse(gamesString)

    gameInserts = gamesData
      .filter((g) => g.status === 'ACTIVE') // Only seed active games
      .map((game) => {
        gameBaselineStats.set(game.id, new GameStatsTracker(game))
        // Map snake_case to camelCase
        return {
          id: game.id,
          name: game.name,
          title: game.title,
          category: game.category as NewGame['category'],
          developer: game.developer,
          operatorId: house.id, // Assign to HOUSE
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
          createdAt: new Date(game.created_at),
          updatedAt: new Date(game.updated_at),
          startedAt: new Date(game.started_at)
        }
      })

    console.log(`Inserting ${gameInserts.length} active games...`)
    await db.insert(schema.gameTable).values(gameInserts)
  } catch (err) {
    console.error(
      `Failed to load or insert games.json. Make sure it's at the root of the 'bun-hono-vue-rpc' project.`,
      err
    )
    process.exit(1)
  }

  // Get all games we just inserted (to pass to simulator)
  const allGames = await db.query.gameTable.findMany({
    where: sql`${schema.gameTable.operatorId} = ${house.id}`
  })

  // 4. Create users and simulate
  console.log(`Creating and simulating ${USER_COUNT} users...`)

  const users: NewUser[] = []
  const userBalances: NewUserBalance[] = []
  const allSimOutputs = []

  for (let i = 0; i < USER_COUNT; i++) {
    const createdAt = randomDate(SIMULATION_START_DATE, SIMULATION_END_DATE)
    const email = faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    })

    const user: NewUser = {
      id: faker.string.uuid(),
      authId: faker.string.uuid(),
      operatorId: house.id,
      email,
      displayName: faker.internet.username(),
      roles: ['USER'],
      createdAt
    }
    users.push(user)

    const balanceId = faker.string.uuid()

    // This is the "Insert" type
    const newBalance: NewUserBalance = {
      id: balanceId,
      userId: user.id!,
      createdAt
    }
    userBalances.push(newBalance)

    // This is the full "Select" type object for the simulator's initial state
    const initialSimState: UserBalance = {
      id: balanceId,
      userId: user.id!,
      createdAt,
      updatedAt: createdAt,
      realBalance: 0,
      freeSpinsRemaining: 0,
      depositWageringRemaining: 0,
      totalDepositedReal: 0,
      totalWithdrawn: 0,
      totalWagered: 0,
      totalWon: 0,
      totalBonusGranted: 0,
      totalFreeSpinWins: 0
    }

    // Pass the full state object to the simulator
    const simulator = new UserSimulator(user.id!, initialSimState, allGames, createdAt)
    allSimOutputs.push(simulator.simulate())

    if ((i + 1) % 10 === 0) {
      console.log(`Simulated user ${i + 1}/${USER_COUNT}`)
    }
  }

  // 5. Aggregate all logs
  console.log('Aggregating all simulation data...')
  const allDepositLogs = allSimOutputs.flatMap((o) => o.depositLogs)
  const allBonusLogs = allSimOutputs.flatMap((o) => o.bonusLogs)
  const allActiveBonusInserts = allSimOutputs.flatMap((o) => o.activeBonusInserts)
  const allBetLogs = allSimOutputs.flatMap((o) => o.betLogs)
  const allWithdrawalLogs = allSimOutputs.flatMap((o) => o.withdrawalLogs)
  const allGameSessions = allSimOutputs.flatMap((o) => o.gameSessions)
  const finalBalanceUpdates = allSimOutputs.map((o) => o.finalBalance)
  const finalActiveBonusUpdates = allSimOutputs.flatMap((o) => o.activeBonusUpdates)

  // 6. Aggregate Game Stats
  console.log('Aggregating game stats...')

  // Add new session data to the baseline stats
  for (const session of allGameSessions) {
    const stats = gameBaselineStats.get(session.gameId!)
    if (!stats) continue
    stats.totalMinutesPlayed += session.duration || 0
    stats.distinctPlayers.add(session.userId)
  }

  // Add new bet data
  for (const bet of allBetLogs) {
    const stats = gameBaselineStats.get(bet.gameId!)
    if (!stats) continue
    stats.totalBetAmount += bet.wagerAmount
    stats.totalWonAmount += bet.winAmount
    stats.totalBets++
    if (bet.winAmount > 0) {
      stats.totalWins++
    }
  }

  // 7. Run Final Transaction
  console.log('Inserting all data into database...')
  try {
    await db.transaction(async (tx) => {
      // Insert foundational data
      if (users.length) await tx.insert(schema.userTable).values(users)
      if (userBalances.length) await tx.insert(schema.userBalanceTable).values(userBalances)

      // --- FIX: BATCH INSERT ALL LOGS ---
      console.log(`Inserting ${allDepositLogs.length} deposit logs...`)
      for (let i = 0; i < allDepositLogs.length; i += BATCH_SIZE) {
        const batch = allDepositLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.depositLogTable).values(batch)
      }

      console.log(`Inserting ${allBonusLogs.length} bonus logs...`)
      for (let i = 0; i < allBonusLogs.length; i += BATCH_SIZE) {
        const batch = allBonusLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.bonusLogTable).values(batch)
      }

      console.log(`Inserting ${allActiveBonusInserts.length} active bonuses...`)
      for (let i = 0; i < allActiveBonusInserts.length; i += BATCH_SIZE) {
        const batch = allActiveBonusInserts.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.activeBonusTable).values(batch)
      }

      console.log(`Inserting ${allGameSessions.length} game sessions...`)
      for (let i = 0; i < allGameSessions.length; i += BATCH_SIZE) {
        const batch = allGameSessions.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.gameSessionTable).values(batch)
      }

      console.log(`Inserting ${allBetLogs.length} bet logs...`)
      for (let i = 0; i < allBetLogs.length; i += BATCH_SIZE) {
        const batch = allBetLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.betLogTable).values(batch)
      }

      console.log(`Inserting ${allWithdrawalLogs.length} withdrawal logs...`)
      for (let i = 0; i < allWithdrawalLogs.length; i += BATCH_SIZE) {
        const batch = allWithdrawalLogs.slice(i, i + BATCH_SIZE)
        await tx.insert(schema.withdrawalLogTable).values(batch)
      }

      // --- Apply final state updates ---
      console.log('Applying final state updates...')

      // Update User Balances (Real Wallets)
      for (const balance of finalBalanceUpdates) {
        await tx
          .update(schema.userBalanceTable)
          .set({
            realBalance: balance.realBalance,
            depositWageringRemaining: balance.depositWageringRemaining,
            totalDepositedReal: balance.totalDepositedReal,
            totalWithdrawn: balance.totalWithdrawn,
            totalWagered: balance.totalWagered,
            totalWon: balance.totalWon,
            totalBonusGranted: balance.totalBonusGranted,
            updatedAt: balance.updatedAt
          })
          .where(sql`${schema.userBalanceTable.id} = ${balance.id}`)
      }

      // Update Active Bonuses (Bonus Wallets)
      for (const bonus of finalActiveBonusUpdates) {
        await tx
          .update(schema.activeBonusTable)
          .set({
            status: bonus.status,
            currentBonusBalance: bonus.currentBonusBalance,
            currentWageringRemaining: bonus.currentWageringRemaining,
            updatedAt: bonus.updatedAt
          })
          .where(sql`${schema.activeBonusTable.id} = ${bonus.id}`)
      }

      // Update Game Stats
      for (const [gameId, stats] of gameBaselineStats.entries()) {
        const newRtp =
          stats.totalBetAmount > 0 ? (stats.totalWonAmount / stats.totalBetAmount) * 100 : 0
        const newHitPercentage = stats.totalBets > 0 ? (stats.totalWins / stats.totalBets) * 100 : 0

        await tx
          .update(schema.gameTable)
          .set({
            totalBetAmount: stats.totalBetAmount,
            totalWonAmount: stats.totalWonAmount,
            totalBets: stats.totalBets,
            totalWins: stats.totalWins,
            totalMinutesPlayed: stats.totalMinutesPlayed,
            totalPlayers: stats.distinctPlayers.size,
            distinctPlayers: Array.from(stats.distinctPlayers),
            currentRtp: Math.round(newRtp),
            hitPercentage: Math.round(newHitPercentage),
            updatedAt: new Date()
          })
          .where(sql`${schema.gameTable.id} = ${gameId}`)
      }
    })
  } catch (err) {
    console.error('--- SEEDING FAILED ---')
    console.error(err)
    process.exit(1)
  }

  console.log('--- SEEDING FINISHED ---')
  process.exit(0)
}

main().catch((err) => {
  console.error('--- SEEDING FAILED (uncaught) ---')
  console.error(err)
  process.exit(1)
})
