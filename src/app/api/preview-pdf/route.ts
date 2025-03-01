import { NextRequest, NextResponse } from "next/server";
import { generateCommitmentPDF } from "@/lib/pdf-generator-server";

export async function POST(request: NextRequest) {
  try {
    // Get the contract data from the request body
    const contractData = await request.json();

    if (!contractData || !contractData.title) {
      return NextResponse.json(
        { error: "Invalid contract data" },
        { status: 400 }
      );
    }

    // Generate the PDF using the server-side method
    const doc = generateCommitmentPDF(contractData);
    
    // Convert to base64 string for the browser to display
    const pdfBase64 = doc.output("datauristring");

    return NextResponse.json({ pdfBase64 });
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF preview" },
      { status: 500 }
    );
  }
}