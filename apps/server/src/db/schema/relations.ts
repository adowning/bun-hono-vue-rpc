import { relations } from 'drizzle-orm'
import { operatorTable } from './operators'
import { userTable } from './users'
import { gameTable } from './games'
import { userBalanceTable, activeBonusTable } from './wallets'
import {
  gameSessionTable,
  depositLogTable,
  bonusLogTable,
  withdrawalLogTable,
  betLogTable
} from './logs'

// This is the new central hub for all relations.
// No thunks are needed because all imports are synchronous.

export const operatorRelations = relations(operatorTable, ({ many }) => ({
  users: many(userTable),
  games: many(gameTable)
}))

export const userRelations = relations(userTable, ({ one, many }) => ({
  operator: one(operatorTable, {
    fields: [userTable.operatorId],
    references: [operatorTable.id]
  }),
  userBalance: one(userBalanceTable, {
    fields: [userTable.id],
    references: [userBalanceTable.userId]
  }),
  activeBonuses: many(activeBonusTable),
  gameSessions: many(gameSessionTable),
  depositLogs: many(depositLogTable),
  bonusLogs: many(bonusLogTable),
  withdrawalLogs: many(withdrawalLogTable),
  betLogs: many(betLogTable)
}))

export const gameRelations = relations(gameTable, ({ many }) => ({
  // No more operator relation
  betLogs: many(betLogTable),
  gameSessions: many(gameSessionTable)
}))

export const userBalanceRelations = relations(userBalanceTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userBalanceTable.userId],
    references: [userTable.id]
  })
}))

export const activeBonusRelations = relations(activeBonusTable, ({ one }) => ({
  user: one(userTable, {
    fields: [activeBonusTable.userId],
    references: [userTable.id]
  }),
  bonusLog: one(bonusLogTable, {
    fields: [activeBonusTable.bonusLogId],
    references: [bonusLogTable.id]
  })
}))

export const gameSessionRelations = relations(gameSessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [gameSessionTable.userId],
    references: [userTable.id]
  }),
  game: one(gameTable, {
    fields: [gameSessionTable.gameId],
    references: [gameTable.id]
  })
}))

export const depositLogRelations = relations(depositLogTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [depositLogTable.userId],
    references: [userTable.id]
  }),
  triggeredBonusLogs: many(bonusLogTable)
}))

export const bonusLogRelations = relations(bonusLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [bonusLogTable.userId],
    references: [userTable.id]
  }),
  triggeringDeposit: one(depositLogTable, {
    fields: [bonusLogTable.triggeringDepositId],
    references: [depositLogTable.id]
  }),
  activeBonus: one(activeBonusTable, {
    fields: [bonusLogTable.id],
    references: [activeBonusTable.bonusLogId]
  })
}))

export const withdrawalLogRelations = relations(withdrawalLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [withdrawalLogTable.userId],
    references: [userTable.id]
  })
}))

export const betLogRelations = relations(betLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [betLogTable.userId],
    references: [userTable.id]
  }),
  game: one(gameTable, {
    fields: [betLogTable.gameId],
    references: [gameTable.id]
  })
}))
