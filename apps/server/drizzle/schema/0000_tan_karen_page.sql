-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."bet_status_enum" AS ENUM('NSF', 'GAME_CHECK_FAILED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SYSTEM', 'SERVER_SHUTDOWN', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."bonus_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."bonus_type_enum" AS ENUM('DEPOSIT_MATCH', 'LONG_BONUS_DAY_1', 'LONG_BONUS_DAY_2', 'VIP_LEVEL_UP', 'FREE_SPINS_AWARD');--> statement-breakpoint
CREATE TYPE "public"."deposit_method_enum" AS ENUM('DEPOSIT_CASHAPP', 'DEPOSIT_INSTORE_CASH', 'DEPOSIT_INSTORE_CARD');--> statement-breakpoint
CREATE TYPE "public"."deposit_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."game_categories_enum" AS ENUM('SLOTS', 'FISH', 'TABLE', 'LIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."game_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."session_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'TIMEOUT', 'OTP_PENDING', 'SHUTDOWN');--> statement-breakpoint
CREATE TYPE "public"."type_of_jackpot_enum" AS ENUM('MINOR', 'MAJOR', 'MEGA', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('USER', 'AFFILIATE', 'ADMIN', 'OPERATOR', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."user_status_enum" AS ENUM('ONLINE', 'OFFLINE', 'BANNED', 'INGAME');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');--> statement-breakpoint
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
	"distinct_players" jsonb DEFAULT '[]'::jsonb,
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
	"is_hit" boolean GENERATED ALWAYS AS ((win_amount > wager_amount)) STORED,
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
	"completed_at" timestamp(3)
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
	"completed_at" timestamp(3)
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
	"apikey" text,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "w_game_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint
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
	"products" jsonb DEFAULT '[{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package One","isPromo":false,"bestValue":0,"bonusSpins":1,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":200,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":300,"amountToReceiveInCredits":500},{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package Two","isPromo":false,"bestValue":0,"bonusSpins":2,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":500,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":500,"amountToReceiveInCredits":1000},{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package Three","isPromo":false,"bestValue":0,"bonusSpins":3,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":1000,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":500,"amountToReceiveInCredits":1500},{"url":"https://nnzmufhldbsvvztlrrau.supabase.co/storage/v1/object/public/products/gems1.png","title":"Package Four","isPromo":false,"bestValue":0,"bonusSpins":5,"description":"blah blah ","productType":"DEPOSIT_PACKAGE","priceInCents":1500,"discountInCents":100,"bonusTotalInCredits":0,"totalDiscountInCents":500,"amountToReceiveInCredits":2000}]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"game_settings" jsonb DEFAULT '{"disabledGames":[]}'::jsonb NOT NULL,
	CONSTRAINT "operators_name_unique" UNIQUE("name")
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
	"updated_at" timestamp with time zone DEFAULT now(),
	"session_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "w_shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"balance" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"frontend" varchar(55) NOT NULL,
	"currency" varchar(5) DEFAULT '',
	"percent" integer DEFAULT 90 NOT NULL,
	"max_win" integer DEFAULT 100 NOT NULL,
	"shop_limit" integer DEFAULT 200 NOT NULL,
	"is_blocked" integer DEFAULT 0 NOT NULL,
	"access" integer DEFAULT 0,
	"country" varchar(255) DEFAULT NULL,
	"os" varchar(255) DEFAULT NULL,
	"device" varchar(255) DEFAULT NULL,
	"orderby" varchar(5) DEFAULT 'AZ' NOT NULL,
	"user_id" integer NOT NULL,
	"pending" integer DEFAULT 0 NOT NULL,
	"rules_terms_and_conditions" integer DEFAULT 0 NOT NULL,
	"rules_privacy_policy" integer DEFAULT 0 NOT NULL,
	"rules_general_bonus_policy" integer DEFAULT 0 NOT NULL,
	"rules_why_bitcoin" integer DEFAULT 0 NOT NULL,
	"rules_responsible_gaming" integer DEFAULT 0 NOT NULL,
	"happyhours_active" integer DEFAULT 1 NOT NULL,
	"progress_active" integer DEFAULT 1 NOT NULL,
	"invite_active" integer DEFAULT 1 NOT NULL,
	"welcome_bonuses_active" integer DEFAULT 1 NOT NULL,
	"sms_bonuses_active" integer DEFAULT 1 NOT NULL,
	"wheelfortune_active" integer DEFAULT 1,
	CONSTRAINT "w_shops_orderby_check" CHECK ((orderby)::text = ANY ((ARRAY['AZ'::character varying, 'Rand'::character varying, 'RTP'::character varying, 'Count'::character varying, 'Date'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "w_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(191) NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "w_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) DEFAULT '' NOT NULL,
	"title" varchar(100) DEFAULT '' NOT NULL,
	"shop_id" integer DEFAULT 0 NOT NULL,
	"jpg_id" integer DEFAULT 0 NOT NULL,
	"label" varchar(55) DEFAULT NULL,
	"device" integer DEFAULT 1 NOT NULL,
	"gamebank" varchar(55) DEFAULT 'slots',
	"chanceFirepot1" varchar(255) DEFAULT NULL,
	"chanceFirepot2" varchar(255) DEFAULT NULL,
	"chanceFirepot3" varchar(255) DEFAULT NULL,
	"fireCount1" varchar(255) DEFAULT NULL,
	"fireCount2" varchar(255) DEFAULT NULL,
	"fireCount3" varchar(255) DEFAULT NULL,
	"lines_percent_config_spin" text,
	"lines_percent_config_spin_bonus" text,
	"lines_percent_config_bonus" text,
	"lines_percent_config_bonus_bonus" text,
	"rezerv" varchar(55) DEFAULT '',
	"cask" varchar(10) DEFAULT '',
	"advanced" text,
	"bet" varchar(255) DEFAULT '' NOT NULL,
	"scaleMode" varchar(10) DEFAULT '' NOT NULL,
	"slotViewState" varchar(10) DEFAULT '' NOT NULL,
	"view" integer DEFAULT 0 NOT NULL,
	"denomination" numeric(20, 2) DEFAULT '1.00' NOT NULL,
	"category_temp" varchar(255) DEFAULT NULL,
	"original_id" integer DEFAULT 0 NOT NULL,
	"bids" integer DEFAULT 0 NOT NULL,
	"stat_in" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"stat_out" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"current_rtp" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"rtp_stat_in" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"rtp_stat_out" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	CONSTRAINT "w_games_scaleMode_check" CHECK (("scaleMode")::text = ANY ((ARRAY[''::character varying, 'showAll'::character varying, 'exactFit'::character varying])::text[])),
	CONSTRAINT "w_games_slotViewState_check" CHECK (("slotViewState")::text = ANY ((ARRAY[''::character varying, 'Normal'::character varying, 'HideUI'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "active_bonuses" ADD CONSTRAINT "active_bonuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_bonuses" ADD CONSTRAINT "active_bonuses_bonus_log_id_bonus_logs_id_fk" FOREIGN KEY ("bonus_log_id") REFERENCES "public"."bonus_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_logs" ADD CONSTRAINT "bonus_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_logs" ADD CONSTRAINT "bonus_logs_triggering_deposit_id_deposit_logs_id_fk" FOREIGN KEY ("triggering_deposit_id") REFERENCES "public"."deposit_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bet_logs" ADD CONSTRAINT "bet_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_logs" ADD CONSTRAINT "deposit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_logs" ADD CONSTRAINT "withdrawal_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_index" ON "games" USING btree ("category" enum_ops);--> statement-breakpoint
CREATE INDEX "games_status_index" ON "games" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "active_bonus_status_index" ON "active_bonuses" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "active_bonus_user_id_index" ON "active_bonuses" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bet_log_game_id_index" ON "bet_logs" USING btree ("game_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bet_log_status_index" ON "bet_logs" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "bet_log_user_id_index" ON "bet_logs" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "game_sessions_status_index" ON "game_sessions" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "game_sessions_user_id_index" ON "game_sessions" USING btree ("user_id" uuid_ops);
*/