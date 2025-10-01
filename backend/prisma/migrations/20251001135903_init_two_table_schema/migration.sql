-- CreateTable
CREATE TABLE "ComparisonSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "costUSD" DECIMAL(10,6) NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelResult_sessionId_idx" ON "ModelResult"("sessionId");

-- AddForeignKey
ALTER TABLE "ModelResult" ADD CONSTRAINT "ModelResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ComparisonSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
