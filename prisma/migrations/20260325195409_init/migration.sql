-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "profile" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "lastHumanOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "contactId" TEXT NOT NULL,
    "productName" TEXT,
    "budgetValue" DECIMAL(65,30),
    "budgetDate" TIMESTAMP(3) NOT NULL,
    "projectName" TEXT,
    "city" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'legacy_budget',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'reactivation_pending',
    "temperature" TEXT NOT NULL DEFAULT 'warm',
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "nextFollowupAt" TIMESTAMP(3),
    "lastOutreachAt" TIMESTAMP(3),
    "lastResponseAt" TIMESTAMP(3),
    "ownerType" TEXT NOT NULL DEFAULT 'agent',
    "humanOwner" TEXT,
    "reactivationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "deliveryStatus" TEXT,
    "intentDetected" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minDaysSinceBudget" INTEGER NOT NULL DEFAULT 7,
    "maxDaysSinceBudget" INTEGER,
    "allowedProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cooldownDays" INTEGER NOT NULL DEFAULT 15,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealth" (
    "id" TEXT NOT NULL,
    "uazapiStatus" TEXT NOT NULL DEFAULT 'unknown',
    "chatwootStatus" TEXT NOT NULL DEFAULT 'unknown',
    "openaiStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_phone_key" ON "Contact"("phone");

-- CreateIndex
CREATE INDEX "Budget_contactId_idx" ON "Budget"("contactId");

-- CreateIndex
CREATE INDEX "Budget_budgetDate_idx" ON "Budget"("budgetDate");

-- CreateIndex
CREATE INDEX "Opportunity_budgetId_idx" ON "Opportunity"("budgetId");

-- CreateIndex
CREATE INDEX "Opportunity_contactId_idx" ON "Opportunity"("contactId");

-- CreateIndex
CREATE INDEX "Opportunity_stage_idx" ON "Opportunity"("stage");

-- CreateIndex
CREATE INDEX "Opportunity_priorityScore_idx" ON "Opportunity"("priorityScore");

-- CreateIndex
CREATE INDEX "Message_opportunityId_idx" ON "Message"("opportunityId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "JobLog_jobType_idx" ON "JobLog"("jobType");

-- CreateIndex
CREATE INDEX "JobLog_startedAt_idx" ON "JobLog"("startedAt");

-- CreateIndex
CREATE INDEX "SystemHealth_lastChecked_idx" ON "SystemHealth"("lastChecked");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
