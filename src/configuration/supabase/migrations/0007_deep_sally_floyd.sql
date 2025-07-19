ALTER TABLE "posts_table" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "posts_table" DROP COLUMN "title";