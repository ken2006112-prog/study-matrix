-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "duration" INTEGER,
    "plannedDuration" INTEGER,
    "isFocusMode" BOOLEAN NOT NULL DEFAULT false,
    "subjectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "StudySession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "stability" REAL NOT NULL DEFAULT 0,
    "difficulty" REAL NOT NULL DEFAULT 0,
    "elapsedDays" REAL NOT NULL DEFAULT 0,
    "scheduledDays" REAL NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "state" INTEGER NOT NULL DEFAULT 0,
    "lastReview" DATETIME,
    "due" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Flashcard_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Flashcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SubjectToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SubjectToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SubjectToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FlashcardToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FlashcardToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Flashcard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FlashcardToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_SubjectToTag_AB_unique" ON "_SubjectToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_SubjectToTag_B_index" ON "_SubjectToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FlashcardToTag_AB_unique" ON "_FlashcardToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_FlashcardToTag_B_index" ON "_FlashcardToTag"("B");
