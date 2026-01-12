-- CreateTable
CREATE TABLE "UserWellbeing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sleepHours" REAL,
    "sleepQuality" INTEGER,
    "stressLevel" INTEGER,
    "mood" TEXT,
    "energyLevel" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserWellbeing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConceptRelation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConceptRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Concept" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConceptRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Concept" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlashcardReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "flashcardId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "confidence" INTEGER,
    "actualResult" BOOLEAN NOT NULL,
    "duration" INTEGER NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlashcardReview_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ConceptTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudySession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "duration" INTEGER,
    "plannedDuration" INTEGER,
    "isFocusMode" BOOLEAN NOT NULL DEFAULT false,
    "interruptions" INTEGER NOT NULL DEFAULT 0,
    "cognitiveLoad" TEXT NOT NULL DEFAULT 'MEDIUM',
    "fatigueLevel" INTEGER,
    "subjectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "StudySession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudySession" ("duration", "endTime", "id", "interruptions", "isFocusMode", "notes", "plannedDuration", "startTime", "subjectId", "userId") SELECT "duration", "endTime", "id", "interruptions", "isFocusMode", "notes", "plannedDuration", "startTime", "subjectId", "userId" FROM "StudySession";
DROP TABLE "StudySession";
ALTER TABLE "new_StudySession" RENAME TO "StudySession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptTags_AB_unique" ON "_ConceptTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptTags_B_index" ON "_ConceptTags"("B");
