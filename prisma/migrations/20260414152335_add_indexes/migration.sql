-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "customers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "orders_tenant_id_status_idx" ON "orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_tenant_id_source_idx" ON "orders"("tenant_id", "source");
