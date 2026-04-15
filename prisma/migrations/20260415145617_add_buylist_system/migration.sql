-- CreateEnum
CREATE TYPE "BuylistStatus" AS ENUM ('PENDING', 'RECEIVED', 'APPROVED', 'PAID', 'CANCELLED');

-- AlterEnum
ALTER TYPE "CreditLedgerSource" ADD VALUE 'BUYLIST_PROPOSAL';

-- DropIndex
DROP INDEX "orders_tenant_id_created_at_idx";

-- DropIndex
DROP INDEX "orders_tenant_id_status_idx";

-- CreateTable
CREATE TABLE "buylist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "card_template_id" UUID NOT NULL,
    "price_cash" DECIMAL(65,30) NOT NULL,
    "price_credit" DECIMAL(65,30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buylist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buylist_proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "status" "BuylistStatus" NOT NULL DEFAULT 'PENDING',
    "total_cash" DECIMAL(65,30) NOT NULL,
    "total_credit" DECIMAL(65,30) NOT NULL,
    "staff_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buylist_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buylist_proposal_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buylist_proposal_id" UUID NOT NULL,
    "card_template_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" "Condition" NOT NULL,
    "language" TEXT NOT NULL,
    "price_cash" DECIMAL(65,30) NOT NULL,
    "price_credit" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "buylist_proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buylist_items_tenant_id_idx" ON "buylist_items"("tenant_id");

-- CreateIndex
CREATE INDEX "buylist_proposals_tenant_id_idx" ON "buylist_proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "buylist_proposals_customer_id_idx" ON "buylist_proposals"("customer_id");

-- CreateIndex
CREATE INDEX "order_items_inventory_item_id_idx" ON "order_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_status_created_at_idx" ON "orders"("tenant_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "buylist_items" ADD CONSTRAINT "buylist_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buylist_items" ADD CONSTRAINT "buylist_items_card_template_id_fkey" FOREIGN KEY ("card_template_id") REFERENCES "card_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buylist_proposals" ADD CONSTRAINT "buylist_proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buylist_proposals" ADD CONSTRAINT "buylist_proposals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buylist_proposal_items" ADD CONSTRAINT "buylist_proposal_items_buylist_proposal_id_fkey" FOREIGN KEY ("buylist_proposal_id") REFERENCES "buylist_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buylist_proposal_items" ADD CONSTRAINT "buylist_proposal_items_card_template_id_fkey" FOREIGN KEY ("card_template_id") REFERENCES "card_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
