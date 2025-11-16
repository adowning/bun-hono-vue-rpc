import { relations } from "drizzle-orm/relations";
import { users, activeBonuses, bonusLogs, depositLogs, userBalances, betLogs, withdrawalLogs, operators, gameSessions, games } from "./schema";

export const activeBonusesRelations = relations(activeBonuses, ({one}) => ({
	user: one(users, {
		fields: [activeBonuses.userId],
		references: [users.id]
	}),
	bonusLog: one(bonusLogs, {
		fields: [activeBonuses.bonusLogId],
		references: [bonusLogs.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	activeBonuses: many(activeBonuses),
	bonusLogs: many(bonusLogs),
	userBalances: many(userBalances),
	betLogs: many(betLogs),
	depositLogs: many(depositLogs),
	withdrawalLogs: many(withdrawalLogs),
	operator: one(operators, {
		fields: [users.operatorId],
		references: [operators.id]
	}),
	gameSessions: many(gameSessions),
}));

export const bonusLogsRelations = relations(bonusLogs, ({one, many}) => ({
	activeBonuses: many(activeBonuses),
	user: one(users, {
		fields: [bonusLogs.userId],
		references: [users.id]
	}),
	depositLog: one(depositLogs, {
		fields: [bonusLogs.triggeringDepositId],
		references: [depositLogs.id]
	}),
}));

export const depositLogsRelations = relations(depositLogs, ({one, many}) => ({
	bonusLogs: many(bonusLogs),
	user: one(users, {
		fields: [depositLogs.userId],
		references: [users.id]
	}),
}));

export const userBalancesRelations = relations(userBalances, ({one}) => ({
	user: one(users, {
		fields: [userBalances.userId],
		references: [users.id]
	}),
}));

export const betLogsRelations = relations(betLogs, ({one}) => ({
	user: one(users, {
		fields: [betLogs.userId],
		references: [users.id]
	}),
}));

export const withdrawalLogsRelations = relations(withdrawalLogs, ({one}) => ({
	user: one(users, {
		fields: [withdrawalLogs.userId],
		references: [users.id]
	}),
}));

export const operatorsRelations = relations(operators, ({many}) => ({
	users: many(users),
}));

export const gameSessionsRelations = relations(gameSessions, ({one}) => ({
	user: one(users, {
		fields: [gameSessions.userId],
		references: [users.id]
	}),
	game: one(games, {
		fields: [gameSessions.gameId],
		references: [games.id]
	}),
}));

export const gamesRelations = relations(games, ({many}) => ({
	gameSessions: many(gameSessions),
}));