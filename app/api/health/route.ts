import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "ADAPT OS",
    status: "operational",
    architecture: "next-react-typescript",
    timestamp: new Date().toISOString()
  });
}
