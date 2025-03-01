-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_user_id_fkey";

-- AlterTable
ALTER TABLE "contracts" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
