"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { downloadPDF, getPDFBase64 } from "@/lib/pdf-generator";
import { Contract } from "@/types/contract";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Stripe public key - add your key here
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface CommitmentModalProps {
  children: React.ReactNode;
}

interface CheckoutFormProps {
  amount: number;
  contractId: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
}

// Payment form component
function CheckoutForm({ amount, contractId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-confirmation`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "An error occurred with your payment");
      onError(error);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <PaymentElement className="mb-6" />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? "Processing..." : `Pay $${amount}`}
      </Button>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
    </form>
  );
}

export function CommitmentModal({ children }: CommitmentModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Contract>>({
    title: "",
    description: "",
    deadline: "",
    stakeAmount: 0,
  });
  const [step, setStep] = useState<"form" | "preview" | "payment">("form");
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [contractId, setContractId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "stakeAmount" && Number(value) < 0.5) {
      setErrorMessage("Minimum stake amount is $0.50 USD");
    } else {
      setErrorMessage("");
    }
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stakeAmount" ? Number(value) : value,
    }));
  };

  const handlePreview = async () => {
    // Basic form validation
    if (!formData.title || !formData.deadline || !formData.stakeAmount) {
      setErrorMessage("Please fill out all required fields");
      return;
    }

    if (formData.stakeAmount < 0.5) {
      setErrorMessage("Minimum stake amount is $0.50 USD");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Generate the PDF and get base64 data URL
      const pdfBase64 = await getPDFBase64(formData);
      setPdfPreview(pdfBase64);
      setStep("preview");
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setErrorMessage("Failed to generate commitment preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("form");
    } else if (step === "payment") {
      setStep("preview");
    }
  };

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // First save the commitment data
      const saveResponse = await fetch("/api/save-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractData: formData,
        }),
      });
      
      const saveData = await saveResponse.json();
      
      if (!saveResponse.ok) {
        throw new Error(saveData.details || saveData.error || "Failed to save commitment");
      }
      
      const { contractId } = saveData;
      setContractId(contractId);
      
      // Then create a payment intent
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractId,
          amount: formData.stakeAmount,
          metadata: {
            commitmentTitle: formData.title,
          },
        }),
      });
      
      const paymentData = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Failed to initialize payment");
      }
      
      const { clientSecret } = paymentData;
      setClientSecret(clientSecret);
      setStep("payment");
    } catch (error: any) {
      console.error("Error proceeding to payment:", error);
      setErrorMessage(error.message || "Failed to proceed to payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    setPaymentSuccess(true);
    // You could redirect to a success page or show a success message
    // router.push(`/contracts/${contractId}`);
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    setErrorMessage(`Payment failed: ${error.message}`);
  };

  const handleDownload = () => {
    downloadPDF(formData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}
        
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Your Commitment</DialogTitle>
              <DialogDescription>
                Define your commitment and set your stake to make it official.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Goal
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="I will..."
                  className="col-span-3"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the details of your commitment..."
                  className="col-span-3"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deadline" className="text-right">
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  className="col-span-3"
                  value={formData.deadline as string}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stakeAmount" className="text-right">
                  Stake Amount ($)
                </Label>
                <Input
                  id="stakeAmount"
                  name="stakeAmount"
                  type="number"
                  min="0.5"
                  step="0.01"
                  placeholder="Enter amount (min $0.50)"
                  className="col-span-3"
                  value={formData.stakeAmount || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handlePreview} disabled={isLoading}>
                {isLoading ? "Loading..." : "Preview Commitment"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && pdfPreview && (
          <>
            <DialogHeader>
              <DialogTitle>Your Commitment Scroll</DialogTitle>
              <DialogDescription>
                Review your commitment scroll before proceeding to payment.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center mt-4">
              <iframe
                src={pdfPreview}
                className="w-full h-80 border rounded-md"
              />
            </div>

            <DialogFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                  Back to Form
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
                  Download PDF
                </Button>
              </div>
              <Button 
                onClick={handleProceedToPayment}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Proceed to Payment"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle>Payment</DialogTitle>
              <DialogDescription>
                Secure your commitment with a payment.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-6">
              {paymentSuccess ? (
                <div className="text-center">
                  <div className="text-green-500 text-xl mb-2">Payment Successful!</div>
                  <p>Your commitment has been finalized.</p>
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-4"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : clientSecret ? (
                <div className="w-full">
                  <p className="text-center mb-4">
                    To finalize your commitment, please make a payment of ${formData.stakeAmount}.
                  </p>
                  
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      amount={formData.stakeAmount || 0}
                      contractId={contractId || ""}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                </div>
              ) : (
                <div className="w-full text-center">
                  <p>Loading payment form...</p>
                </div>
              )}
            </div>

            {!paymentSuccess && (
              <DialogFooter>
                <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                  Back
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}