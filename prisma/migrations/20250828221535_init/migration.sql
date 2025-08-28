-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('EVENT', 'IDEA', 'WORKOUT', 'CALORIE', 'NOTE');

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "type" "public"."ItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "tags" TEXT[],
    "when" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
