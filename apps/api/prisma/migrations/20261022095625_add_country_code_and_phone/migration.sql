-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "countryCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "phone" TEXT;
