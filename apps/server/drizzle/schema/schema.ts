import { pgTable, index, uuid, integer, boolean, text, jsonb, timestamp, foreignKey, unique, varchar, serial, check, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const betStatusEnum = pgEnum("bet_status_enum", ['NSF', 'GAME_CHECK_FAILED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SYSTEM', 'SERVER_SHUTDOWN', 'EXPIRED'])
export const bonusStatusEnum = pgEnum("bonus_status_enum", ['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'])
export const bonusTypeEnum = pgEnum("bonus_type_enum", ['DEPOSIT_MATCH', 'LONG_BONUS_DAY_1', 'LONG_BONUS_DAY_2', 'VIP_LEVEL_UP', 'FREE_SPINS_AWARD'])
export const depositMethodEnum = pgEnum("deposit_method_enum", ['DEPOSIT_CASHAPP', 'DEPOSIT_INSTORE_CASH', 'DEPOSIT_INSTORE_CARD'])
export const depositStatusEnum = pgEnum("deposit_status_enum", ['PENDING', 'COMPLETED', 'FAILED'])
export const gameCategoriesEnum = pgEnum("game_categories_enum", ['SLOTS', 'FISH', 'TABLE', 'LIVE', 'OTHER'])
export const gameStatusEnum = pgEnum("game_status_enum", ['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
export const sessionStatusEnum = pgEnum("session_status_enum", ['ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'TIMEOUT', 'OTP_PENDING', 'SHUTDOWN'])
export const typeOfJackpotEnum = pgEnum("type_of_jackpot_enum", ['MINOR', 'MAJOR', 'MEGA', 'NONE'])
export const userRoleEnum = pgEnum("user_role_enum", ['USER', 'AFFILIATE', 'ADMIN', 'OPERATOR', 'BOT'])
export const userStatusEnum = pgEnum("user_status_enum", ['ONLINE', 'OFFLINE', 'BANNED', 'INGAME'])
export const withdrawalStatusEnum = pgEnum("withdrawal_status_enum", ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'])


export const games = pgTable("games", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	version: integer().default(1).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	name: text().notNull(),
	title: text(),
	description: text(),
	category: gameCategoriesEnum().default('SLOTS').notNull(),
	thumbnailUrl: text("thumbnail_url"),
	bannerUrl: text("banner_url"),
	volatility: integer().default(1).notNull(),
	developer: text(),
	currentRtp: integer("current_rtp").default(0),
	targetRtp: integer("target_rtp"),
	status: gameStatusEnum().default('ACTIVE').notNull(),
	totalBetAmount: integer("total_bet_amount").default(0),
	totalWonAmount: integer("total_won_amount").default(0),
	totalBets: integer("total_bets").default(0),
	totalWins: integer("total_wins").default(0),
	hitPercentage: integer("hit_percentage").default(0),
	totalPlayers: integer("total_players").default(0),
	totalMinutesPlayed: integer("total_minutes_played").default(0),
	distinctPlayers: jsonb("distinct_players").default([]),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	minBet: integer("min_bet").default(100),
	maxBet: integer("max_bet").default(100000),
	isFeatured: boolean("is_featured").default(false),
	jackpotGroup: typeOfJackpotEnum("jackpot_group").default('NONE'),
	goldsvetData: jsonb("goldsvet_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("category_index").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	index().using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const activeBonuses = pgTable("active_bonuses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	bonusLogId: uuid("bonus_log_id").notNull(),
	status: bonusStatusEnum().default('ACTIVE').notNull(),
	priority: integer().default(100).notNull(),
	currentBonusBalance: integer("current_bonus_balance").default(0).notNull(),
	currentWageringRemaining: integer("current_wagering_remaining").default(0).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("active_bonus_status_index").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("active_bonus_user_id_index").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "active_bonuses_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.bonusLogId],
			foreignColumns: [bonusLogs.id],
			name: "active_bonuses_bonus_log_id_bonus_logs_id_fk"
		}),
]);

export const bonusLogs = pgTable("bonus_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	operatorId: uuid("operator_id").default(sql`'00000000-0000-0000-0000-000000000000'`).notNull(),
	triggeringDepositId: uuid("triggering_deposit_id"),
	bonusType: bonusTypeEnum("bonus_type").notNull(),
	bonusAmount: integer("bonus_amount").notNull(),
	wageringRequirementTotal: integer("wagering_requirement_total").notNull(),
	priority: integer().default(100).notNull(),
	expiresInDays: integer("expires_in_days").default(7),
	metaData: jsonb("meta_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bonus_logs_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.triggeringDepositId],
			foreignColumns: [depositLogs.id],
			name: "bonus_logs_triggering_deposit_id_deposit_logs_id_fk"
		}),
]);

export const userBalances = pgTable("user_balances", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	realBalance: integer("real_balance").default(0).notNull(),
	freeSpinsRemaining: integer("free_spins_remaining").default(0).notNull(),
	depositWageringRemaining: integer("deposit_wagering_remaining").default(0).notNull(),
	totalDepositedReal: integer("total_deposited_real").default(0).notNull(),
	totalWithdrawn: integer("total_withdrawn").default(0).notNull(),
	totalWagered: integer("total_wagered").default(0).notNull(),
	totalWon: integer("total_won").default(0).notNull(),
	totalBonusGranted: integer("total_bonus_granted").default(0).notNull(),
	totalFreeSpinWins: integer("total_free_spin_wins").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_balances_user_id_users_id_fk"
		}),
	unique("user_balances_user_id_unique").on(table.userId),
]);

export const betLogs = pgTable("bet_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	gameSessionId: uuid("game_session_id"),
	operatorId: uuid("operator_id"),
	status: betStatusEnum().default('COMPLETED').notNull(),
	wagerAmount: integer("wager_amount").notNull(),
	winAmount: integer("win_amount").notNull(),
	wagerPaidFromReal: integer("wager_paid_from_real").default(0).notNull(),
	wagerPaidFromBonus: integer("wager_paid_from_bonus").default(0).notNull(),
	isHit: boolean("is_hit").generatedAlwaysAs(sql`(win_amount > wager_amount)`),
	gameId: uuid("game_id"),
	gameName: text("game_name"),
	jackpotContribution: integer("jackpot_contribution"),
	vipPointsAdded: integer("vip_points_added"),
	processingTime: integer("processing_time"),
	metadata: jsonb(),
	affiliateId: uuid("affiliate_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("bet_log_game_id_index").using("btree", table.gameId.asc().nullsLast().op("uuid_ops")),
	index("bet_log_status_index").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("bet_log_user_id_index").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "bet_logs_user_id_users_id_fk"
		}),
]);

export const depositLogs = pgTable("deposit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	operatorId: uuid("operator_id").default(sql`'00000000-0000-0000-0000-000000000000'`).notNull(),
	amount: integer().notNull(),
	method: depositMethodEnum().notNull(),
	status: depositStatusEnum().default('PENDING').notNull(),
	realAmountBefore: integer("real_amount_before"),
	realAmountAfter: integer("real_amount_after"),
	depositWageringRequiredBefore: integer("deposit_wagering_required_before"),
	depositWageringRequiredAfter: integer("deposit_wagering_required_after"),
	metaData: jsonb("meta_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "deposit_logs_user_id_users_id_fk"
		}),
]);

export const withdrawalLogs = pgTable("withdrawal_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	operatorId: uuid("operator_id").default(sql`'00000000-0000-0000-0000-000000000000'`).notNull(),
	status: withdrawalStatusEnum().default('PENDING').notNull(),
	amount: integer().notNull(),
	realAmountBefore: integer("real_amount_before").notNull(),
	realAmountAfter: integer("real_amount_after").notNull(),
	metaData: jsonb("meta_data"),
	requestedAt: timestamp("requested_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "withdrawal_logs_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	authId: varchar("auth_id", { length: 256 }).notNull(),
	operatorId: uuid("operator_id").default(sql`'00000000-0000-0000-0000-000000000000'`).notNull(),
	email: text().notNull(),
	displayName: text("display_name").notNull(),
	avatar: text().default('avatar-06.avif').notNull(),
	roles: userRoleEnum().array().default(["USER"]).notNull(),
	status: userStatusEnum().default('OFFLINE').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	apikey: text(),
}, (table) => [
	foreignKey({
			columns: [table.operatorId],
			foreignColumns: [operators.id],
			name: "users_operator_id_operators_id_fk"
		}),
	unique("users_auth_id_unique").on(table.authId),
	unique("users_email_unique").on(table.email),
]);

export const wGameCategories = pgTable("w_game_categories", {
	id: serial().primaryKey().notNull(),
	gameId: integer("game_id").notNull(),
	categoryId: integer("category_id").notNull(),
});

export const operators = pgTable("operators", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	updatedBy: text("updated_by").default('system').notNull(),
	version: integer().default(1).notNull(),
	balance: integer().default(100000).notNull(),
	slotsBalance: integer("slots_balance").default(100000).notNull(),
	arcadeBalance: integer("arcade_balance").default(100000).notNull(),
	currentFloat: integer("current_float").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	name: text().notNull(),
	ownerId: text("owner_id").default('system').notNull(),
	products: jsonb().default([{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package One","isPromo":false,"bestValue":0,"bonusSpins":1,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":200,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":300,"amountToReceiveInCredits":500},{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package Two","isPromo":false,"bestValue":0,"bonusSpins":2,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":500,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":500,"amountToReceiveInCredits":1000},{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package Three","isPromo":false,"bestValue":0,"bonusSpins":3,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":1000,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":500,"amountToReceiveInCredits":1500},{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package Four","isPromo":false,"bestValue":0,"bonusSpins":5,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":1500,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":500,"amountToReceiveInCredits":2000}]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	gameSettings: jsonb("game_settings").default({"disabledGames":[]}).notNull(),
}, (table) => [
	unique("operators_name_unique").on(table.name),
]);

export const gameSessions = pgTable("game_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	isBot: boolean("is_bot").default(false).notNull(),
	authSessionId: uuid("auth_session_id"),
	userId: uuid("user_id").notNull(),
	gameId: uuid("game_id").notNull(),
	gameName: text("game_name"),
	status: sessionStatusEnum().default('ACTIVE').notNull(),
	totalWagered: integer("total_wagered").default(0),
	totalWon: integer("total_won").default(0),
	totalBets: integer("total_bets").default(0),
	gameSessionRtp: integer("game_session_rtp").default(0),
	playerStartingBalance: integer("player_starting_balance"),
	playerEndingBalance: integer("player_ending_balance"),
	duration: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	sessionData: jsonb("session_data"),
}, (table) => [
	index().using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index().using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "game_sessions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [games.id],
			name: "game_sessions_game_id_games_id_fk"
		}),
]);

export const wShops = pgTable("w_shops", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	balance: numeric({ precision: 20, scale:  4 }).default('0.0000').notNull(),
	frontend: varchar({ length: 55 }).notNull(),
	currency: varchar({ length: 5 }).default('),
	percent: integer().default(90).notNull(),
	maxWin: integer("max_win").default(100).notNull(),
	shopLimit: integer("shop_limit").default(200).notNull(),
	isBlocked: integer("is_blocked").default(0).notNull(),
	access: integer().default(0),
	country: varchar({ length: 255 }).default(sql`NULL`),
	os: varchar({ length: 255 }).default(sql`NULL`),
	device: varchar({ length: 255 }).default(sql`NULL`),
	orderby: varchar({ length: 5 }).default('AZ').notNull(),
	userId: integer("user_id").notNull(),
	pending: integer().default(0).notNull(),
	rulesTermsAndConditions: integer("rules_terms_and_conditions").default(0).notNull(),
	rulesPrivacyPolicy: integer("rules_privacy_policy").default(0).notNull(),
	rulesGeneralBonusPolicy: integer("rules_general_bonus_policy").default(0).notNull(),
	rulesWhyBitcoin: integer("rules_why_bitcoin").default(0).notNull(),
	rulesResponsibleGaming: integer("rules_responsible_gaming").default(0).notNull(),
	happyhoursActive: integer("happyhours_active").default(1).notNull(),
	progressActive: integer("progress_active").default(1).notNull(),
	inviteActive: integer("invite_active").default(1).notNull(),
	welcomeBonusesActive: integer("welcome_bonuses_active").default(1).notNull(),
	smsBonusesActive: integer("sms_bonuses_active").default(1).notNull(),
	wheelfortuneActive: integer("wheelfortune_active").default(1),
}, (table) => [
	check("w_shops_orderby_check", sql`(orderby)::text = ANY ((ARRAY['AZ'::character varying, 'Rand'::character varying, 'RTP'::character varying, 'Count'::character varying, 'Date'::character varying])::text[])`),
]);

export const wSettings = pgTable("w_settings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 191 }).notNull(),
	value: text().notNull(),
});

export const wGames = pgTable("w_games", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).default(').notNull(),
	title: varchar({ length: 100 }).default(').notNull(),
	shopId: integer("shop_id").default(0).notNull(),
	jpgId: integer("jpg_id").default(0).notNull(),
	label: varchar({ length: 55 }).default(sql`NULL`),
	device: integer().default(1).notNull(),
	gamebank: varchar({ length: 55 }).default('slots'),
	chanceFirepot1: varchar({ length: 255 }).default(sql`NULL`),
	chanceFirepot2: varchar({ length: 255 }).default(sql`NULL`),
	chanceFirepot3: varchar({ length: 255 }).default(sql`NULL`),
	fireCount1: varchar({ length: 255 }).default(sql`NULL`),
	fireCount2: varchar({ length: 255 }).default(sql`NULL`),
	fireCount3: varchar({ length: 255 }).default(sql`NULL`),
	linesPercentConfigSpin: text("lines_percent_config_spin"),
	linesPercentConfigSpinBonus: text("lines_percent_config_spin_bonus"),
	linesPercentConfigBonus: text("lines_percent_config_bonus"),
	linesPercentConfigBonusBonus: text("lines_percent_config_bonus_bonus"),
	rezerv: varchar({ length: 55 }).default('),
	cask: varchar({ length: 10 }).default('),
	advanced: text(),
	bet: varchar({ length: 255 }).default(').notNull(),
	scaleMode: varchar({ length: 10 }).default(').notNull(),
	slotViewState: varchar({ length: 10 }).default(').notNull(),
	view: integer().default(0).notNull(),
	denomination: numeric({ precision: 20, scale:  2 }).default('1.00').notNull(),
	categoryTemp: varchar("category_temp", { length: 255 }).default(sql`NULL`),
	originalId: integer("original_id").default(0).notNull(),
	bids: integer().default(0).notNull(),
	statIn: numeric("stat_in", { precision: 20, scale:  4 }).default('0.0000').notNull(),
	statOut: numeric("stat_out", { precision: 20, scale:  4 }).default('0.0000').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	currentRtp: numeric("current_rtp", { precision: 20, scale:  4 }).default('0.0000').notNull(),
	rtpStatIn: numeric("rtp_stat_in", { precision: 20, scale:  4 }).default('0.0000').notNull(),
	rtpStatOut: numeric("rtp_stat_out", { precision: 20, scale:  4 }).default('0.0000').notNull(),
}, (table) => [
	check("w_games_scaleMode_check", sql`("scaleMode")::text = ANY ((ARRAY[''::character varying, 'showAll'::character varying, 'exactFit'::character varying])::text[])`),
	check("w_games_slotViewState_check", sql`("slotViewState")::text = ANY ((ARRAY[''::character varying, 'Normal'::character varying, 'HideUI'::character varying])::text[])`),
]);
