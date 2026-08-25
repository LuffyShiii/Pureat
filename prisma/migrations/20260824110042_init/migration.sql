-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "state" TEXT NOT NULL,
    "purine_min_mg_per_100g" DOUBLE PRECISION NOT NULL,
    "purine_max_mg_per_100g" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "source_date" TIMESTAMP(3),
    "data_confidence" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_aliases" (
    "id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'zh',
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "food_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_rules" (
    "id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "level" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "source_date" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recommendation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recognition_results" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "image_hash" TEXT,
    "raw_ai_response" JSONB NOT NULL,
    "recognized_items" JSONB NOT NULL,
    "confidence_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recognition_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_usage" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "recognition_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "device_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE INDEX "foods_subcategory_idx" ON "foods"("subcategory");

-- CreateIndex
CREATE INDEX "food_aliases_alias_idx" ON "food_aliases"("alias");

-- CreateIndex
CREATE INDEX "food_aliases_food_id_idx" ON "food_aliases"("food_id");

-- CreateIndex
CREATE INDEX "recommendation_rules_rule_type_idx" ON "recommendation_rules"("rule_type");

-- CreateIndex
CREATE INDEX "recommendation_rules_active_priority_idx" ON "recommendation_rules"("active", "priority");

-- CreateIndex
CREATE INDEX "recognition_results_device_id_created_at_idx" ON "recognition_results"("device_id", "created_at");

-- CreateIndex
CREATE INDEX "device_usage_device_id_date_idx" ON "device_usage"("device_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "device_usage_device_id_date_key" ON "device_usage"("device_id", "date");

-- AddForeignKey
ALTER TABLE "food_aliases" ADD CONSTRAINT "food_aliases_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
