import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
} from "drizzle-zod";
import z from "zod";


export const userRoleEnum = pgEnum("user_role_enum", ['USER', 'AFFILIATE', 'ADMIN', 'OPERATOR', 'BOT'])
export const userStatusEnum = pgEnum("user_status_enum", ['ONLINE', 'OFFLINE', 'BANNED', 'PENDING'])


export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  username: text().notNull(),
  avatarUrl: text()
    .notNull()
    .default(
      "https://crqbazcsrncvbnapuxcp.supabase.co/storage/v1/object/public/avatars/avatar-6.webp"
    ),
  role: userRoleEnum("role").default("USER"),
  status: userStatusEnum("status").default("OFFLINE"),
  vipPoints: integer().default(0).notNull(),
  banned: boolean(),
  authEmail: text().notNull().unique(),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true, mode: "date" }).defaultNow(),
  phone: text(),
  invitorId: uuid(),
  operatorId: uuid(),
  botApiKeyHash: text(),
  botPermissions: jsonb().default("[]"),
  botServiceScope: jsonb().default("[]"),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const UserSelectSchema = createSelectSchema(userTable);
export const UserInsertSchema = createInsertSchema(userTable);
export type User = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;

export const userBalanceTable = pgTable("user_balances", {
  id: uuid().primaryKey().notNull(),
  // .
  userId: uuid().notNull(),
  realBalance: integer().default(0).notNull(),
  bonusBalance: integer().default(0).notNull(),
  freeSpinsRemaining: integer().default(0).notNull(),
  depositWrRemaining: integer().default(0).notNull(),
  bonusWrRemaining: integer().default(0).notNull(),
  totalDepositedReal: integer().default(0).notNull(),
  totalDepositedBonus: integer().default(0).notNull(),
  totalWithdrawn: integer().default(0).notNull(),
  totalWagered: integer().default(0).notNull(),
  totalWon: integer().default(0).notNull(),
  totalBonusGranted: integer().default(0).notNull(),
  totalFreeSpinWins: integer().default(0).notNull(),
  createdAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const UserBalanceSelectSchema = createSelectSchema(userBalanceTable);
export const UserBalanceInsertSchema = createInsertSchema(userBalanceTable);
export type UserBalance = typeof userBalanceTable.$inferSelect;
export type UserBalanceInsert = typeof userBalanceTable.$inferInsert;
export type UserBalanceSelect = typeof userBalanceTable.$inferSelect;

export type UserWithBalance = User & { userBalance: UserBalance };
