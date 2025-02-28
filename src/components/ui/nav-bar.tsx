'use client';

import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./button";

export function NavBar() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            Self-Commitment
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            <SignedIn>
              <Link href="/dashboard" className="text-sm font-medium">
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}