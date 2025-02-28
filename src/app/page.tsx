import { ContractForm } from "@/components/forms/contract-form";
import { Button } from "@/components/ui/button";
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
          {!userId && (
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/sign-up">Create an Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          )}
        </section>
        
        {userId ? (
          <ContractForm />
        ) : (
          <div className="text-center p-8 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Sign in to get started</h2>
            <p className="text-muted-foreground mb-4">
              Create an account or sign in to create your first commitment.
            </p>
          </div>
        )}
        
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-2">1. Create a Commitment</h3>
            <p className="text-muted-foreground">
              Define your goal, set a deadline, and stake money on your success.
            </p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-2">2. Work Toward Your Goal</h3>
            <p className="text-muted-foreground">
              With real money on the line, you'll have extra motivation to succeed.
            </p>
          </div>
          <div className="text-center p-6">
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