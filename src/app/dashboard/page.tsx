import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ContractList } from "@/components/dashboard/contract-list";
import { ContractService } from "@/services/contract.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Contract } from "@/types/contract";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-4">Please sign in to view your dashboard.</p>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch user's contracts and cast to Contract type
  const contracts = (await ContractService.getContracts(userId)) as Contract[];

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Commitments</h1>
        <Button asChild>
          <Link href="/">New Commitment</Link>
        </Button>
      </div>

      <ContractList contracts={contracts} />
    </div>
  );
}