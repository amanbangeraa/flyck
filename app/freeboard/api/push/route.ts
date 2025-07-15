import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();
  // Mock: log the drawing JSON
  console.log("[API] /api/push received:", data);
  return NextResponse.json({ success: true });
} 