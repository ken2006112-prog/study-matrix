/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ConceptRelation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FlashcardReview" ADD COLUMN "calibrationErr" INTEGER;

-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Concept" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "importance" REAL NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Concept" ("createdAt", "description", "id", "name", "subjectId") SELECT "createdAt", "description", "id", "name", "subjectId" FROM "Concept";
DROP TABLE "Concept";
ALTER TABLE "new_Concept" RENAME TO "Concept";
CREATE TABLE "new_ConceptRelation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    CONSTRAINT "ConceptRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Concept" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConceptRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Concept" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ConceptRelation" ("id", "sourceId", "strength", "targetId", "type") SELECT "id", "sourceId", "strength", "targetId", "type" FROM "ConceptRelation";
DROP TABLE "ConceptRelation";
ALTER TABLE "new_ConceptRelation" RENAME TO "ConceptRelation";
CREATE TABLE "new_Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "userId" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "difficulty" INTEGER NOT NULL DEFAULT 5,
    "targetGrade" TEXT,
    "semesterId" INTEGER,
    CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subject_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "SemesterConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subject" ("color", "id", "name", "userId") SELECT "color", "id", "name", "userId" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
