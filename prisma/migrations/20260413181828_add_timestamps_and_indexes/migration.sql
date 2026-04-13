/*
  Warnings:

  - Added the required column `updated_at` to the `card_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tenants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "card_templates" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "card_templates_name_set_idx" ON "card_templates"("name", "set");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
