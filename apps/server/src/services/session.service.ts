import { db, eq, and, SessionStatus, gameSessionTable, GameSession, gameTable } from '@/db'
import type { PgTransaction } from 'drizzle-orm/pg-core'

export interface AuthSession {
  access_token: string
  userId: string
  gameSessions: GameSession[]
  started: Date
  ended: Date
  status: SessionStatus
}
class SessionService {
  private db = db

  async getActiveGameSession(userId: string): Promise<GameSession | null> {
    try {
      const activeSession = await this.db.query.gameSessionTable.findFirst({
        where: and(
          eq(gameSessionTable.userId, userId),
          eq(gameSessionTable.status, 'ACTIVE')
        )
      })
      return activeSession || null
    } catch (error) {
      console.error('Failed to get active game session:', error)
      throw new Error('Failed to get active game session')
    }
  }

  /**
   * Gets an active session or creates a new one.
   * Used for  game providers.
   */
  async getOrCreateGameSession(
    userId: string,
    gameName: string,
    tx?: PgTransaction<any, any, any>
  ): Promise<GameSession> {
    const dbClient = tx || this.db

    const activeSession = await dbClient.query.gameSessionTable.findFirst({
      where: and(
        eq(gameSessionTable.userId, userId),
        eq(gameSessionTable.gameName, gameName),
        eq(gameSessionTable.status, 'ACTIVE')
      )
    })

    if (activeSession) {
      return activeSession
    }
    const gamesList = await dbClient.select({ name: gameTable.name }).from(gameTable)
    console.log(gamesList)
    const [game] = await dbClient.select().from(gameTable).where(eq(gameTable.name, gameName))
    console.log(game)
    // Create a new one
    if (!game) throw new Error(gameName)
    const [newSession] = await dbClient.insert(gameSessionTable)
      .values({
        gameId: game.id,
        userId: userId,
        gameName: gameName,
        status: 'ACTIVE'
        // sessionData will be populated by the game logic
      })
      .returning()

    if (!newSession) throw new Error('Failed to create new game session')
    return newSession
  }
}

// Export singleton
export const sessionService = new SessionService()
