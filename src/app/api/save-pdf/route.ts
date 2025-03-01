import { NextRequest, NextResponse } from "next/server";
import { getPDFBuffer } from "@/lib/pdf-generator-server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ContractStatus } from "@/types/contract";

export async function POST(request: NextRequest) {
  try {
    // Get user ID if authenticated
    const { userId } = await auth();

    // Get the contract data from the request body
    const body = await request.json();
    console.log("Received request body:", body);

    if (!body.contractData) {
      return NextResponse.json(
        { error: "Missing contractData in request body" },
        { status: 400 }
      );
    }

    const { contractData } = body;

    if (!contractData.title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    // Create a new contract in the database - map deadline to endDate
    const startDate = new Date();
    const endDate = contractData.deadline 
      ? new Date(contractData.deadline) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

    // Log the data we're about to save
    console.log("About to save contract with data:", {
      title: contractData.title,
      description: contractData.description || "",
      amount: contractData.stakeAmount || 0,
      startDate,
      endDate,
      userId: userId || undefined,
    });

    // Create a new contract in the database
    const contract = await prisma.contract.create({
      data: {
        title: contractData.title,
        description: contractData.description || "",
        amount: Number(contractData.stakeAmount || 0), // Ensure amount is a number
        startDate: startDate,
        endDate: endDate,
        userId: userId || undefined,
        status: ContractStatus.PENDING_PAYMENT, // Use enum value
      },
    });

    console.log("Successfully created contract:", contract);

    // Generate PDF buffer using the server-side method
    const pdfBuffer = await getPDFBuffer(contractData);
    console.log("Generated PDF buffer of size:", pdfBuffer.length);

    return NextResponse.json({ 
      success: true,
      contractId: contract.id
    });
    
  } catch (error: any) {
    // Enhanced error logging
    console.error("Error saving commitment:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Return a more descriptive error message
    return NextResponse.json(
      { 
        error: "Failed to save commitment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}