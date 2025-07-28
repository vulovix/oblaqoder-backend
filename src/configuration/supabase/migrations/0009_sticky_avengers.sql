CREATE TABLE "topic_categories_table" (
	"topic_id" integer NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_collections_table" (
	"topic_id" integer NOT NULL,
	"collection_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_communities_table" (
	"topic_id" integer NOT NULL,
	"community_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "topics_table_name_unique" UNIQUE("name"),
	CONSTRAINT "topics_table_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "topic_categories_table" ADD CONSTRAINT "topic_categories_table_topic_id_topics_table_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_categories_table" ADD CONSTRAINT "topic_categories_table_category_id_categories_table_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_collections_table" ADD CONSTRAINT "topic_collections_table_topic_id_topics_table_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_collections_table" ADD CONSTRAINT "topic_collections_table_collection_id_collections_table_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_communities_table" ADD CONSTRAINT "topic_communities_table_topic_id_topics_table_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_communities_table" ADD CONSTRAINT "topic_communities_table_community_id_communities_table_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities_table"("id") ON DELETE cascade ON UPDATE no action;