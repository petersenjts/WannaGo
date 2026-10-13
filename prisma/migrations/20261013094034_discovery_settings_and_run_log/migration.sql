-- CreateEnum
CREATE TYPE "DiscoveryTrigger" AS ENUM ('ADMIN', 'CRON');

-- CreateEnum
CREATE TYPE "DiscoveryBlockedReason" AS ENUM ('KILL_SWITCH', 'DAILY_LIMIT', 'MONTHLY_LIMIT', 'RATE_LIMIT');

-- CreateTable
CREATE TABLE "DiscoverySettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "dailyPlaceLimit" INTEGER NOT NULL DEFAULT 50,
    "monthlyPlaceLimit" INTEGER NOT NULL DEFAULT 500,
    "maxCapPerRun" INTEGER NOT NULL DEFAULT 30,
    "cronRateLimitPerHour" INTEGER NOT NULL DEFAULT 2,
    "killSwitchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cronSecretHash" TEXT,
    "cronSecretUpdatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoverySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryRunLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "trigger" "DiscoveryTrigger" NOT NULL,
    "area" TEXT NOT NULL,
    "vertical" "Vertical" NOT NULL,
    "placesCreated" INTEGER NOT NULL DEFAULT 0,
    "placesSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "googleCallCount" INTEGER NOT NULL DEFAULT 0,
    "claudeInputTokens" INTEGER NOT NULL DEFAULT 0,
    "claudeOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "blockedReason" "DiscoveryBlockedReason",

    CONSTRAINT "DiscoveryRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoveryRunLog_startedAt_idx" ON "DiscoveryRunLog"("startedAt");

-- CreateIndex
CREATE INDEX "DiscoveryRunLog_trigger_startedAt_idx" ON "DiscoveryRunLog"("trigger", "startedAt");
