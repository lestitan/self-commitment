"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Contract } from "@/types/contract";

// Helper function to add a styled title
const addTitle = (doc: jsPDF, text: string, y: number) => {
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
  const textOffset = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text(text, textOffset, y);
  return doc;
};

// Helper function to add a styled subtitle
const addSubtitle = (doc: jsPDF, text: string, y: number) => {
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
  const textOffset = (doc.internal.pageSize.width - textWidth) / 2;
  doc.text(text, textOffset, y);
  return doc;
};

// Helper function to add body text
const addText = (doc: jsPDF, text: string, y: number, align: "left" | "center" = "left") => {
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  
  if (align === "center") {
    const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
    const textOffset = (doc.internal.pageSize.width - textWidth) / 2;
    doc.text(text, textOffset, y);
  } else {
    doc.text(text, 20, y);
  }
  
  return doc;
};

// Helper function to add a decorative border
const addBorder = (doc: jsPDF) => {
  doc.setDrawColor(139, 69, 19); // Brown color for the border
  doc.setLineWidth(1);
  doc.rect(10, 10, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20);
  doc.setDrawColor(139, 69, 19);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 30);
  return doc;
};

// Helper function to add a signature field
const addSignatureField = (doc: jsPDF, y: number) => {
  doc.line(30, y, 180, y);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("Signature", 105, y + 10, { align: "center" });
  return doc;
};

// Helper function to add the date field
const addDateField = (doc: jsPDF, y: number) => {
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  const today = new Date().toLocaleDateString();
  doc.text(`Date: ${today}`, 105, y, { align: "center" });
  return doc;
};

// Function to generate a commitment scroll PDF
export const generateCommitmentPDF = (commitment: Partial<Contract>): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add decorative border
  addBorder(doc);

  // Add title
  addTitle(doc, "COMMITMENT SCROLL", 40);
  
  // Add subtitle with user name if available
  const subtitle = commitment.userId 
    ? "A solemn pledge made in good faith" 
    : "A solemn pledge made in good faith";
  addSubtitle(doc, subtitle, 50);

  // Add scroll intro text
  let y = 70;
  addText(doc, "On this day, I hereby commit myself to the following goal:", y);
  
  // Add goal in a box
  y += 15;
  doc.setFillColor(252, 249, 235); // Light papyrus color
  doc.roundedRect(20, y, doc.internal.pageSize.width - 40, 30, 3, 3, "F");
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  // Center the text inside the box
  const goalText = commitment.title || "[Your goal here]";
  const goalY = y + 18; // Center vertically in the box
  doc.text(goalText, 105, goalY, { align: "center" });

  // Add commitment details
  y += 45;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  
  // Add commitment description
  const description = commitment.description || "[Description of your commitment]";
  
  // Add deadline info
  y += 15;
  const deadline = commitment.deadline 
    ? new Date(commitment.deadline).toLocaleDateString() 
    : "[Deadline date]";
  addText(doc, `I pledge to complete this goal by: ${deadline}`, y);
  
  // Add stake amount
  y += 15;
  const amount = commitment.stakeAmount 
    ? `$${commitment.stakeAmount}` 
    : "[Amount]";
  addText(doc, `To ensure my commitment, I am staking ${amount} on my success.`, y);

  // Add formal declaration
  y += 30;
  addText(doc, "I understand that this commitment is binding, and I pledge my utmost effort", y);
  y += 10;
  addText(doc, "to fulfill it by the established deadline.", y);

  // Add signature field
  y += 40;
  addSignatureField(doc, y);
  
  // Add date
  y += 30;
  addDateField(doc, y);
  
  // Add footer text
  y = doc.internal.pageSize.height - 30;
  addText(doc, "This commitment is made on the Self-Commitment Platform", y, "center");
  y += 10;
  addText(doc, "May your resolve be strong and your success assured", y, "center");

  return doc;
};

export const downloadPDF = (commitment: Partial<Contract>, filename = "commitment-scroll.pdf") => {
  const doc = generateCommitmentPDF(commitment);
  doc.save(filename);
};

export const getPDFBlob = async (commitment: Partial<Contract>): Promise<Blob> => {
  const doc = generateCommitmentPDF(commitment);
  return doc.output("blob");
};

export const getPDFBase64 = async (commitment: Partial<Contract>): Promise<string> => {
  const doc = generateCommitmentPDF(commitment);
  return doc.output("datauristring");
};