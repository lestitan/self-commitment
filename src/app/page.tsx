import { ContractForm } from "@/components/forms/contract-form";
import { Button } from "@/components/ui/button";
import { CommitmentModal } from "@/components/forms/commitment-modal";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Make Commitments to Your Future Self
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Create binding commitments backed by financial stakes to help you
            achieve your goals.
          </p>
          
          {/* Add prominent Make Commitment button */}
          <CommitmentModal>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105">
              Make Commitment Now
            </Button>
          </CommitmentModal>
          
          {!userId && (
            <div className="flex justify-center gap-4 mt-6">
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-up">Create an Account</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          )}
        </section>
        
        {userId && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-6 text-center">Create a New Contract</h2>
            <ContractForm />
          </div>
        )}
        
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 border rounded-lg shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-2">1. Create a Commitment</h3>
            <p className="text-muted-foreground">
              Define your goal, set a deadline, and stake money on your success.
            </p>
          </div>
          <div className="text-center p-6 border rounded-lg shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-2">2. Work Toward Your Goal</h3>
            <p className="text-muted-foreground">
              With real money on the line, you'll have extra motivation to succeed.
            </p>
          </div>
          <div className="text-center p-6 border rounded-lg shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-2">3. Verify & Celebrate</h3>
            <p className="text-muted-foreground">
              Complete your goal, get your money back, and share your success story.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}