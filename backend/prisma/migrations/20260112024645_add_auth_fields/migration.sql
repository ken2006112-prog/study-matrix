/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "UserMemory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "weakConcepts" TEXT NOT NULL DEFAULT '[]',
    "strongConcepts" TEXT NOT NULL DEFAULT '[]',
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "focusScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "subjectId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemesterConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "semesterName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "weeklyStudyHours" INTEGER NOT NULL,
    "learningStyle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SemesterConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subjectId" INTEGER NOT NULL,
    "examType" TEXT NOT NULL,
    "examDate" DATETIME NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "subjectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "StudySession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudySession" ("duration", "endTime", "id", "isFocusMode", "notes", "plannedDuration", "startTime", "subjectId", "userId") SELECT "duration", "endTime", "id", "isFocusMode", "notes", "plannedDuration", "startTime", "subjectId", "userId" FROM "StudySession";
DROP TABLE "StudySession";
ALTER TABLE "new_StudySession" RENAME TO "StudySession";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name") SELECT "createdAt", "email", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserMemory_userId_key" ON "UserMemory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterConfig_userId_key" ON "SemesterConfig"("userId");
