CREATE TABLE "categories_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "categories_table_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "post_categories_table" (
	"post_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_collections_table" (
	"post_id" integer NOT NULL,
	"collection_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_communities_table" (
	"post_id" integer NOT NULL,
	"community_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories_table" ADD CONSTRAINT "categories_table_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categories_table" ADD CONSTRAINT "post_categories_table_post_id_posts_table_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categories_table" ADD CONSTRAINT "post_categories_table_category_id_categories_table_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_collections_table" ADD CONSTRAINT "post_collections_table_post_id_posts_table_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_collections_table" ADD CONSTRAINT "post_collections_table_collection_id_collections_table_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_communities_table" ADD CONSTRAINT "post_communities_table_post_id_posts_table_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_communities_table" ADD CONSTRAINT "post_communities_table_community_id_communities_table_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities_table"("id") ON DELETE cascade ON UPDATE no action;