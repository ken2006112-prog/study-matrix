-- CreateTable
CREATE TABLE "Textbook" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "totalChapters" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "textbookId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "importance" REAL NOT NULL DEFAULT 0.5,
    "estimatedHours" REAL NOT NULL DEFAULT 2,
    "concepts" TEXT NOT NULL DEFAULT '[]',
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Chapter_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "chaptersToStudy" TEXT NOT NULL DEFAULT '[]',
    "totalHours" REAL NOT NULL,
    "priority" TEXT NOT NULL,
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlan_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subjectId" INTEGER NOT NULL,
    "examType" TEXT NOT NULL,
    "examDate" DATETIME NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startChapter" INTEGER,
    "endChapter" INTEGER,
    "textbookId" INTEGER,
    CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exam_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Exam" ("createdAt", "examDate", "examType", "id", "subjectId", "topics", "weight") SELECT "createdAt", "examDate", "examType", "id", "subjectId", "topics", "weight" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
