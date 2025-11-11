CREATE TYPE "public"."bet_status_enum" AS ENUM('NSF', 'GAME_CHECK_FAILED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SYSTEM', 'SERVER_SHUTDOWN', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."bonus_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."bonus_type_enum" AS ENUM('DEPOSIT_MATCH', 'LONG_BONUS_DAY_1', 'LONG_BONUS_DAY_2', 'VIP_LEVEL_UP', 'FREE_SPINS_AWARD');--> statement-breakpoint
CREATE TYPE "public"."deposit_method_enum" AS ENUM('DEPOSIT_CASHAPP', 'DEPOSIT_INSTORE_CASH', 'DEPOSIT_INSTORE_CARD');--> statement-breakpoint
CREATE TYPE "public"."deposit_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."game_categories_enum" AS ENUM('SLOTS', 'FISH', 'TABLE', 'LIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."game_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."type_of_jackpot_enum" AS ENUM('MINOR', 'MAJOR', 'MEGA', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."session_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'TIMEOUT', 'OTP_PENDING', 'SHUTDOWN');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('USER', 'AFFILIATE', 'ADMIN', 'OPERATOR', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."user_status_enum" AS ENUM('ONLINE', 'OFFLINE', 'BANNED', 'INGAME');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"balance" integer DEFAULT 100000 NOT NULL,
	"slots_balance" integer DEFAULT 100000 NOT NULL,
	"arcade_balance" integer DEFAULT 100000 NOT NULL,
	"current_float" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"owner_id" text DEFAULT 'system' NOT NULL,
	"products" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "operators_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth_id" varchar(256) NOT NULL,
	"operator_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text DEFAULT 'avatar-06.avif' NOT NULL,
	"roles" "user_role_enum"[] DEFAULT '{"USER"}' NOT NULL,
	"status" "user_status_enum" DEFAULT 'OFFLINE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"description" text,
	"category" "game_categories_enum" DEFAULT 'SLOTS' NOT NULL,
	"thumbnail_url" text,
	"banner_url" text,
	"volatility" integer DEFAULT 1 NOT NULL,
	"developer" text,
	"operator_id" uuid,
	"current_rtp" integer DEFAULT 0,
	"target_rtp" integer,
	"status" "game_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"total_bet_amount" integer DEFAULT 0,
	"total_won_amount" integer DEFAULT 0,
	"total_bets" integer DEFAULT 0,
	"total_wins" integer DEFAULT 0,
	"hit_percentage" integer DEFAULT 0,
	"total_players" integer DEFAULT 0,
	"total_minutes_played" integer DEFAULT 0,
	"distinct_players" jsonb,
	"started_at" timestamp with time zone DEFAULT now(),
	"min_bet" integer DEFAULT 100,
	"max_bet" integer DEFAULT 100000,
	"is_featured" boolean DEFAULT false,
	"jackpot_group" "type_of_jackpot_enum" DEFAULT 'NONE',
	"goldsvet_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "active_bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bonus_log_id" uuid NOT NULL,
	"status" "bonus_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"current_bonus_balance" integer DEFAULT 0 NOT NULL,
	"current_wagering_remaining" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_balances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"real_balance" integer DEFAULT 0 NOT NULL,
	"free_spins_remaining" integer DEFAULT 0 NOT NULL,
	"deposit_wagering_remaining" integer DEFAULT 0 NOT NULL,
	"total_deposited_real" integer DEFAULT 0 NOT NULL,
	"total_withdrawn" integer DEFAULT 0 NOT NULL,
	"total_wagered" integer DEFAULT 0 NOT NULL,
	"total_won" integer DEFAULT 0 NOT NULL,
	"total_bonus_granted" integer DEFAULT 0 NOT NULL,
	"total_free_spin_wins" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_balances_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "bet_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_session_id" uuid,
	"operator_id" uuid,
	"status" "bet_status_enum" DEFAULT 'COMPLETED' NOT NULL,
	"wager_amount" integer NOT NULL,
	"win_amount" integer NOT NULL,
	"wager_paid_from_real" integer DEFAULT 0 NOT NULL,
	"wager_paid_from_bonus" integer DEFAULT 0 NOT NULL,
	"is_hit" boolean GENERATED ALWAYS AS (win_amount > wager_amount) STORED,
	"game_id" uuid,
	"game_name" text,
	"jackpot_contribution" integer,
	"vip_points_added" integer,
	"processing_time" integer,
	"metadata" jsonb,
	"affiliate_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bonus_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operator_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"triggering_deposit_id" uuid,
	"bonus_type" "bonus_type_enum" NOT NULL,
	"bonus_amount" integer NOT NULL,
	"wagering_requirement_total" integer NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"expires_in_days" integer DEFAULT 7,
	"meta_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operator_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"amount" integer NOT NULL,
	"method" "deposit_method_enum" NOT NULL,
	"status" "deposit_status_enum" DEFAULT 'PENDING' NOT NULL,
	"real_amount_before" integer,
	"real_amount_after" integer,
	"deposit_wagering_required_before" integer,
	"deposit_wagering_required_after" integer,
	"meta_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"auth_session_id" uuid,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"game_name" text,
	"status" "session_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"total_wagered" integer DEFAULT 0,
	"total_won" integer DEFAULT 0,
	"total_bets" integer DEFAULT 0,
	"game_session_rtp" integer DEFAULT 0,
	"player_starting_balance" integer,
	"player_ending_balance" integer,
	"duration" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "withdrawal_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operator_id" uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"status" "withdrawal_status_enum" DEFAULT 'PENDING' NOT NULL,
	"amount" integer NOT NULL,
	"real_amount_before" integer NOT NULL,
	"real_amount_after" integer NOT NULL,
	"meta_data" jsonb,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_bonuses" ADD CONSTRAINT "active_bonuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_bonuses" ADD CONSTRAINT "active_bonuses_bonus_log_id_bonus_logs_id_fk" FOREIGN KEY ("bonus_log_id") REFERENCES "public"."bonus_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bet_logs" ADD CONSTRAINT "bet_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_logs" ADD CONSTRAINT "bonus_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_logs" ADD CONSTRAINT "bonus_logs_triggering_deposit_id_deposit_logs_id_fk" FOREIGN KEY ("triggering_deposit_id") REFERENCES "public"."deposit_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_logs" ADD CONSTRAINT "deposit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_logs" ADD CONSTRAINT "withdrawal_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_index" ON "games" USING btree ("category");--> statement-breakpoint
CREATE INDEX "games_operator_index" ON "games" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "games_status_index" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "active_bonus_user_id_index" ON "active_bonuses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "active_bonus_status_index" ON "active_bonuses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bet_log_user_id_index" ON "bet_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bet_log_status_index" ON "bet_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bet_log_game_id_index" ON "bet_logs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_sessions_user_id_index" ON "game_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_sessions_status_index" ON "game_sessions" USING btree ("status");