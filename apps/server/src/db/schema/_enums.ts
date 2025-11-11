import { pgEnum } from 'drizzle-orm/pg-core'

// --- USER ENUMS ---
export const userRoleEnum = pgEnum('user_role_enum', [
  'USER',
  'AFFILIATE',
  'ADMIN',
  'OPERATOR',
  'BOT'
])
export const userStatusEnum = pgEnum('user_status_enum', ['ONLINE', 'OFFLINE', 'BANNED', 'INGAME'])

// --- FINANCIAL ENUMS ---
export const depositMethodEnum = pgEnum('deposit_method_enum', [
  'DEPOSIT_CASHAPP',
  'DEPOSIT_INSTORE_CASH',
  'DEPOSIT_INSTORE_CARD'
])
export const depositStatusEnum = pgEnum('deposit_status_enum', ['PENDING', 'COMPLETED', 'FAILED'])

export const bonusTypeEnum = pgEnum('bonus_type_enum', [
  'DEPOSIT_MATCH',
  'LONG_BONUS_DAY_1',
  'LONG_BONUS_DAY_2',
  'VIP_LEVEL_UP',
  'FREE_SPINS_AWARD'
])

export const bonusStatusEnum = pgEnum('bonus_status_enum', [
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED'
])

export const withdrawalStatusEnum = pgEnum('withdrawal_status_enum', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED'
])

export const betStatusEnum = pgEnum('bet_status_enum', [
  'NSF', // Not Sufficient Funds
  'GAME_CHECK_FAILED',
  'COMPLETED',
  'CANCELLED_BY_USER',
  'CANCELLED_BY_SYSTEM',
  'SERVER_SHUTDOWN',
  'EXPIRED'
])

// --- GAME ENUMS ---
export const gameCategoriesEnum = pgEnum('game_categories_enum', [
  'SLOTS',
  'FISH',
  'TABLE',
  'LIVE',
  'OTHER'
])
export const gameStatusEnum = pgEnum('game_status_enum', ['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
export const jackpotTypeEnum = pgEnum('type_of_jackpot_enum', ['MINOR', 'MAJOR', 'MEGA', 'NONE'])

// --- SESSION ENUMS ---
export const sessionStatusEnum = pgEnum('session_status_enum', [
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'ABANDONED',
  'TIMEOUT',
  'OTP_PENDING',
  'SHUTDOWN'
])
