import { SignUp } from "@clerk/nextjs";
 
export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md rounded-lg",
          },
        }}
      />
    </div>
  );
}