-- CreateIndex
CREATE INDEX "farmers_agentId_createdAt_idx" ON "farmers"("agentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "farmers_status_createdAt_idx" ON "farmers"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "farmers_state_lga_idx" ON "farmers"("state", "lga");

-- CreateIndex
CREATE INDEX "farmers_clusterId_idx" ON "farmers"("clusterId");

-- CreateIndex
CREATE INDEX "farmers_createdAt_idx" ON "farmers"("createdAt" DESC);
