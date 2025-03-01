import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PaymentService } from "@/services/payment.service";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get user ID if authenticated - properly awaiting the auth() promise
    const { userId } = await auth();
    
    // Get request data
    const { contractId, amount, metadata } = await request.json();

    if (!contractId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: contractId and amount" },
        { status: 400 }
      );
    }

    // Verify that the contract exists
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Create a payment intent
    const paymentResponse = await PaymentService.createPaymentIntent({
      amount: Number(amount),
      contractId,
      metadata: {
        userId: userId || "anonymous",
        contractTitle: contract.title,
        ...metadata,
      },
    });

    return NextResponse.json(paymentResponse);
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}